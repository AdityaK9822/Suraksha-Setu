use core::fmt::Write;
use core::net::Ipv4Addr;
use embassy_net::tcp::TcpSocket;
use embassy_time::Duration;
use embedded_io_async::{Read, Write as IoWrite};
use heapless::String;

const BACKEND_HOST: &str = match option_env!("KIOSK_BACKEND_HOST") { Some(v) => v, None => "192.168.1.50" };
const BACKEND_PORT: &str = match option_env!("KIOSK_BACKEND_PORT") { Some(v) => v, None => "4000" };

pub enum Status {
    Verified(String<32>),
    Registered(String<32>),
    NotFound,
    Duplicate(String<32>),
    Error,
}

pub async fn verify_serial(stack: &embassy_net::Stack<'static>, serial: &str) -> Status {
    get_status(stack, &format_path("/verify/serial/", serial)).await
}

pub async fn verify_hash(stack: &embassy_net::Stack<'static>, hash: &[u8; 32]) -> Status {
    let mut hex = String::<64>::new();
    for b in hash {
        let _ = write!(hex, "{:02x}", b);
    }
    let mut path = String::<96>::new();
    let _ = write!(path, "/verify/hash/0x{}", hex.as_str());
    get_status(stack, path.as_str()).await
}

async fn get_status(stack: &embassy_net::Stack<'static>, path: &str) -> Status {
    let ip: Ipv4Addr = BACKEND_HOST.parse().unwrap_or(Ipv4Addr::new(192, 168, 1, 50));
    let port: u16 = BACKEND_PORT.parse().unwrap_or(4000);

    let mut rx = [0u8; 1024];
    let mut tx = [0u8; 1024];
    let mut socket = TcpSocket::new(*stack, &mut rx, &mut tx);
    socket.set_timeout(Some(Duration::from_secs(10)));

    if socket.connect((ip, port)).await.is_err() {
        return Status::Error;
    }

    let mut req = String::<256>::new();
    let _ = write!(
        req,
        "GET {} HTTP/1.1\r\nHost: k\r\nAccept: text/plain\r\nConnection: close\r\n\r\n",
        path
    );
    if socket.write_all(req.as_bytes()).await.is_err() {
        let _ = socket.close();
        return Status::Error;
    }

    let mut resp: heapless::Vec<u8, 1024> = heapless::Vec::new();
    let mut tmp = [0u8; 256];
    loop {
        match socket.read(&mut tmp).await {
            Ok(0) => break,
            Ok(n) => {
                for i in 0..n {
                    if resp.push(tmp[i]).is_err() {
                        break;
                    }
                }
                if resp.len() >= 1024 {
                    break;
                }
            }
            Err(_) => break,
        }
    }
    let _ = socket.close();

    let body = find_body(&resp);
    parse_status(body)
}

fn find_body(resp: &[u8]) -> &[u8] {
    for i in 0..resp.len().saturating_sub(3) {
        if resp[i] == b'\r'
            && resp[i + 1] == b'\n'
            && resp[i + 2] == b'\r'
            && resp[i + 3] == b'\n'
        {
            return &resp[i + 4..];
        }
    }
    &[]
}

fn parse_status(body: &[u8]) -> Status {
    // trim
    let mut start = 0;
    let mut end = body.len();
    while start < end && (body[start] == b' ' || body[start] == b'\n' || body[start] == b'\r' || body[start] == b'\t') {
        start += 1;
    }
    while end > start && (body[end - 1] == b' ' || body[end - 1] == b'\n' || body[end - 1] == b'\r' || body[end - 1] == b'\t') {
        end -= 1;
    }
    let s = core::str::from_utf8(&body[start..end]).unwrap_or("");

    if let Some(rest) = s.strip_prefix("VERIFIED") {
        Status::Verified(String::try_from(rest.trim()).unwrap_or_default())
    } else if let Some(rest) = s.strip_prefix("REGISTERED") {
        Status::Registered(String::try_from(rest.trim()).unwrap_or_default())
    } else if let Some(rest) = s.strip_prefix("DUPLICATE") {
        let r = rest.trim_start_matches(['-', '>', ' ']);
        Status::Duplicate(String::try_from(r.trim()).unwrap_or_default())
    } else if s == "NOTFOUND" || s == "NOT FOUND" || s == "NOT_FOUND" {
        Status::NotFound
    } else {
        Status::Error
    }
}

fn format_path(prefix: &str, value: &str) -> String<128> {
    let mut p = String::new();
    let _ = p.push_str(prefix);
    let _ = p.push_str(value);
    p
}

