use core::net::Ipv4Addr;
use embassy_net::udp::UdpSocket;
use embassy_time::{Duration, Timer};
use log::{info, warn};

const POOL_START: u8 = 100;
const POOL_END: u8 = 119;

pub async fn run(stack: embassy_net::Stack<'static>) -> ! {
    let mut rx_meta = [embassy_net::udp::PacketMetadata::EMPTY; 4];
    let mut rx_buf = [0u8; 1024];
    let mut tx_meta = [embassy_net::udp::PacketMetadata::EMPTY; 4];
    let mut tx_buf = [0u8; 1024];
    let mut socket = UdpSocket::new(stack, &mut rx_meta, &mut rx_buf, &mut tx_meta, &mut tx_buf);
    let _ = socket.bind(67);

    let mut leases: [([u8; 6], u8); 16] = [([0u8; 6], 0); 16];
    let mut nleases: usize = 0;

    loop {
        let mut buf = [0u8; 576];
        let (n, _) = match socket.recv_from(&mut buf).await {
            Ok(v) => v,
            Err(_) => {
                Timer::after(Duration::from_millis(10)).await;
                continue;
            }
        };
        if n < 240 {
            continue;
        }
        if buf[0] != 1 {
            continue;
        }
        if buf[236] != 0x63 || buf[237] != 0x82 || buf[238] != 0x53 || buf[239] != 0x63 {
            continue;
        }

        let mut xid = [0u8; 4];
        xid.copy_from_slice(&buf[4..8]);
        let chaddr = &buf[28..34];

        let mut msg_type: u8 = 0;
        let mut i = 240usize;
        while i < n {
            let opt = buf[i];
            if opt == 255 {
                break;
            }
            if opt == 0 {
                i += 1;
                continue;
            }
            if i + 1 >= n {
                break;
            }
            let len = buf[i + 1] as usize;
            if opt == 53 && len >= 1 && i + 2 < n {
                msg_type = buf[i + 2];
            }
            i += 2 + len;
        }

        if msg_type == 1 {
            let ip_octet = allocate(&mut leases, &mut nleases, chaddr);
            info!("DHCP DISCOVER {:02x?} -> 192.168.2.{}", chaddr, ip_octet);
            let mut reply = [0u8; 300];
            build_reply(&mut reply, &xid, chaddr, ip_octet, 2);
            let _ = socket
                .send_to(&reply[..300], (Ipv4Addr::new(255, 255, 255, 255), 68))
                .await;
        } else if msg_type == 3 {
            let mut req_ip: Option<u8> = None;
            let mut i = 240usize;
            while i < n {
                let opt = buf[i];
                if opt == 255 {
                    break;
                }
                if opt == 0 {
                    i += 1;
                    continue;
                }
                if i + 1 >= n {
                    break;
                }
                let len = buf[i + 1] as usize;
                if opt == 50 && len >= 4 && i + 5 < n {
                    req_ip = Some(buf[i + 5]);
                }
                i += 2 + len;
            }
            let ip_octet = req_ip.unwrap_or_else(|| allocate(&mut leases, &mut nleases, chaddr));
            info!(
                "DHCP REQUEST {:02x?} requested={:?} -> 192.168.2.{}",
                chaddr, req_ip, ip_octet
            );
            let mut reply = [0u8; 300];
            build_reply(&mut reply, &xid, chaddr, ip_octet, 5);
            let _ = socket
                .send_to(&reply[..300], (Ipv4Addr::new(255, 255, 255, 255), 68))
                .await;
        }
    }
}

fn allocate(leases: &mut [([u8; 6], u8); 16], n: &mut usize, mac: &[u8]) -> u8 {
    for k in 0..*n {
        if leases[k].0 == mac[..6] {
            return leases[k].1;
        }
    }
    let octet = POOL_START + (*n as u8);
    if octet > POOL_END {
        warn!("DHCP pool exhausted, reusing 192.168.2.{}", POOL_START);
        return POOL_START;
    }
    let mut m = [0u8; 6];
    m.copy_from_slice(&mac[..6]);
    if *n < 16 {
        leases[*n] = (m, octet);
        *n += 1;
    } else {
        warn!(
            "DHCP lease table full, handing out unrecorded 192.168.2.{}",
            octet
        );
    }
    octet
}

fn build_reply(reply: &mut [u8; 300], xid: &[u8; 4], chaddr: &[u8], ip_octet: u8, msg_type: u8) {
    for b in reply.iter_mut() {
        *b = 0;
    }
    reply[0] = 2; // BOOTREPLY
    reply[1] = 1; // htype ethernet
    reply[2] = 6; // hlen
    reply[4..8].copy_from_slice(xid);
    // yiaddr
    reply[16] = 192;
    reply[17] = 168;
    reply[18] = 2;
    reply[19] = ip_octet;
    // siaddr (server)
    reply[20] = 192;
    reply[21] = 168;
    reply[22] = 2;
    reply[23] = 1;
    reply[28..34].copy_from_slice(&chaddr[..6]);
    // magic cookie
    reply[236] = 0x63;
    reply[237] = 0x82;
    reply[238] = 0x53;
    reply[239] = 0x63;

    let mut i = 240usize;
    // 53 message type
    reply[i] = 53;
    reply[i + 1] = 1;
    reply[i + 2] = msg_type;
    i += 3;
    // 54 server id
    reply[i] = 54;
    reply[i + 1] = 4;
    reply[i + 2] = 192;
    reply[i + 3] = 168;
    reply[i + 4] = 2;
    reply[i + 5] = 1;
    i += 6;
    // 51 lease time (600s)
    reply[i] = 51;
    reply[i + 1] = 4;
    reply[i + 2] = 0;
    reply[i + 3] = 0;
    reply[i + 4] = 2;
    reply[i + 5] = 0x58;
    i += 6;
    // 1 subnet mask
    reply[i] = 1;
    reply[i + 1] = 4;
    reply[i + 2] = 255;
    reply[i + 3] = 255;
    reply[i + 4] = 255;
    reply[i + 5] = 0;
    i += 6;
    // 3 router
    reply[i] = 3;
    reply[i + 1] = 4;
    reply[i + 2] = 192;
    reply[i + 3] = 168;
    reply[i + 4] = 2;
    reply[i + 5] = 1;
    i += 6;
    // 6 dns
    reply[i] = 6;
    reply[i + 1] = 4;
    reply[i + 2] = 8;
    reply[i + 3] = 8;
    reply[i + 4] = 8;
    reply[i + 5] = 8;
    i += 6;
    // end
    reply[i] = 255;
}
