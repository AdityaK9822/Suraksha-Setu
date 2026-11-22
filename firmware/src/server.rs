use core::fmt::Write;
use embassy_net::tcp::TcpSocket;
use embassy_time::Duration;
use embedded_io_async::{Read, Write as IoWrite};
use heapless::String;
use log::info;

use crate::backend;
use crate::display;
use crate::hash;

const PAGE: &str = r#"<!doctype html>
<html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Suraksha Setu Kiosk</title>
<style>body{font-family:sans-serif;max-width:480px;margin:2em auto;padding:0 1em}
button{padding:.6em 1em;font-size:1em;margin:.3em 0}input{padding:.5em;font-size:1em;width:100%;box-sizing:border-box}
#out{margin-top:1em;padding:1em;border:1px solid #ccc;border-radius:8px;white-space:pre-wrap;min-height:3em}</style></head>
<body>
<h1>Suraksha Setu</h1>
<p>Verification kiosk. Scan the QR on a document with your phone, or upload the PDF.</p>
<h2>By serial</h2>
<form id=sf><input id=serial placeholder="SS-000123"><button>Verify</button></form>
<h2>By PDF</h2>
<input type=file id=pdf accept="application/pdf">
<button id=pf>Verify PDF</button>
<div id=out>Ready.</div>
<script>
const out=document.getElementById('out');
document.getElementById('sf').onsubmit=async e=>{e.preventDefault();out.textContent='Checking...';
 const r=await fetch('/verify/serial/'+encodeURIComponent(document.getElementById('serial').value));
 out.textContent=await r.text();};
document.getElementById('pf').onclick=async()=>{const f=document.getElementById('pdf').files[0];if(!f){out.textContent='Pick a file';return;}
 out.textContent='Hashing...';
 const r=await fetch('/verify-file',{method:'POST',body:await f.arrayBuffer(),headers:{'Content-Type':'application/octet-stream'}});
 out.textContent=await r.text();};
</script></body></html>"#;

pub async fn run(ap_stack: embassy_net::Stack<'static>, upstream: embassy_net::Stack<'static>) -> ! {
    let mut rx = [0u8; 4096];
    let mut tx = [0u8; 4096];
    loop {
        let mut socket = TcpSocket::new(ap_stack, &mut rx, &mut tx);
        socket.set_timeout(Some(Duration::from_secs(60)));
        if socket.accept(80).await.is_err() {
            continue;
        }
        let _ = handle(upstream, &mut socket).await;
        socket.close();
    }
}

async fn handle(upstream: embassy_net::Stack<'static>, socket: &mut TcpSocket<'_>) -> Result<(), ()> {
    let mut buf = [0u8; 4096];
    let mut total = 0usize;
    loop {
        if total >= buf.len() {
            return Err(());
        }
        let n = socket.read(&mut buf[total..]).await.map_err(|_| ())?;
        if n == 0 {
            return Err(());
        }
        total += n;
        if find_headers_end(&buf[..total]).is_some() {
            break;
        }
    }
    let hdr_end = find_headers_end(&buf[..total]).unwrap();

    let headers = core::str::from_utf8(&buf[..hdr_end]).unwrap_or("");
    let first_line = headers.lines().next().unwrap_or("");
    let mut parts = first_line.split_whitespace();
    let method = parts.next().unwrap_or("");
    let path = parts.next().unwrap_or("/");

    let mut content_length: usize = 0;
    for line in headers.lines() {
        let l = line.trim();
        if let Some(rest) = l
            .strip_prefix("Content-Length:")
            .or_else(|| l.strip_prefix("content-length:"))
        {
            content_length = rest.trim().parse().unwrap_or(0);
        }
    }

    if method == "GET" && path == "/" {
        respond(socket, "200 OK", "text/html; charset=utf-8", PAGE.as_bytes()).await
    } else if method == "GET" && path.starts_with("/verify/serial/") {
        let raw = &path["/verify/serial/".len()..];
        let serial = url_decode(raw);
        info!("serial lookup {:?}", serial.as_str());
        display::DISPLAY.signal(display::DisplayMsg::Busy);
        let status = backend::verify_serial(&upstream, serial.as_str()).await;
        let text = format_status(&status);
        update_display(&status);
        respond(socket, "200 OK", "text/plain", text.as_bytes()).await
    } else if method == "POST" && path == "/verify-file" {
        info!(
            "upload content-length={} buffered={}",
            content_length,
            total.saturating_sub(hdr_end + 4)
        );
        display::DISPLAY.signal(display::DisplayMsg::Busy);
        let mut hasher = hash::Sha3_256::new();
        let mut hashed = 0usize;
        let read_total = total.saturating_sub(hdr_end + 4);
        if read_total > 0 {
            let avail = (hdr_end + 4 + read_total).min(total);
            let chunk = &buf[hdr_end + 4..avail];
            hasher.update(chunk);
            hashed += chunk.len();
        }
        let mut remaining = content_length.saturating_sub(read_total);
        let mut tmp = [0u8; 4096];
        while remaining > 0 {
            let to_read = remaining.min(tmp.len());
            let r = socket.read(&mut tmp[..to_read]).await.map_err(|_| ())?;
            if r == 0 {
                info!("upload ended early after {} bytes", hashed);
                break;
            }
            hasher.update(&tmp[..r]);
            hashed += r;
            remaining = remaining.saturating_sub(r);
        }
        let h = hasher.finalize();
        info!("hashed {} bytes -> {}", hashed, hash::hex_encode(&h));
        let status = backend::verify_hash(&upstream, &h).await;
        let text = format_status(&status);
        update_display(&status);
        respond(socket, "200 OK", "text/plain", text.as_bytes()).await
    } else {
        respond(socket, "404 Not Found", "text/plain", b"not found").await
    }
}

fn format_status(s: &backend::Status) -> String<128> {
    let mut out = String::new();
    match s {
        backend::Status::Verified(serial) => {
            let _ = write!(out, "VERIFIED {}", serial);
        }
        backend::Status::Registered(serial) => {
            let _ = write!(out, "REGISTERED {}", serial);
        }
        backend::Status::NotFound => {
            let _ = write!(out, "NOT FOUND");
        }
        backend::Status::Duplicate(serial) => {
            let _ = write!(out, "DUPLICATE -> {}", serial);
        }
        backend::Status::Error => {
            let _ = write!(out, "BACKEND ERROR");
        }
    }
    out
}

fn update_display(s: &backend::Status) {
    let msg = match s {
        backend::Status::Verified(serial) => display::DisplayMsg::Result {
            headline: "VERIFIED",
            detail: {
                let mut d = String::new();
                let _ = write!(d, "{}", serial);
                d
            },
        },
        backend::Status::Registered(serial) => display::DisplayMsg::Result {
            headline: "REGISTERED",
            detail: {
                let mut d = String::new();
                let _ = write!(d, "{}", serial);
                d
            },
        },
        backend::Status::NotFound => display::DisplayMsg::Result {
            headline: "NOT FOUND",
            detail: String::new(),
        },
        backend::Status::Duplicate(serial) => display::DisplayMsg::Result {
            headline: "DUPLICATE",
            detail: {
                let mut d = String::new();
                let _ = write!(d, "-> {}", serial);
                d
            },
        },
        backend::Status::Error => display::DisplayMsg::Result {
            headline: "ERROR",
            detail: String::new(),
        },
    };
    display::DISPLAY.signal(msg);
}

async fn respond(
    socket: &mut TcpSocket<'_>,
    status: &str,
    ctype: &str,
    body: &[u8],
) -> Result<(), ()> {
    let mut hdr = String::<256>::new();
    let _ = write!(
        hdr,
        "HTTP/1.1 {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        status, ctype, body.len()
    );
    socket.write_all(hdr.as_bytes()).await.map_err(|_| ())?;
    socket.write_all(body).await.map_err(|_| ())?;
    socket.flush().await.map_err(|_| ())?;
    Ok(())
}

fn find_headers_end(buf: &[u8]) -> Option<usize> {
    for i in 0..buf.len().saturating_sub(3) {
        if buf[i] == b'\r'
            && buf[i + 1] == b'\n'
            && buf[i + 2] == b'\r'
            && buf[i + 3] == b'\n'
        {
            return Some(i);
        }
    }
    None
}

fn url_decode(input: &str) -> String<128> {
    let mut out = String::new();
    let bytes = input.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let (Some(hi), Some(lo)) = (hex_val(bytes[i + 1]), hex_val(bytes[i + 2])) {
                let _ = out.push((hi << 4 | lo) as char);
                i += 3;
                continue;
            }
        }
        if bytes[i] == b'+' {
            let _ = out.push(' ');
        } else {
            let _ = out.push(bytes[i] as char);
        }
        i += 1;
    }
    out
}

fn hex_val(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}
