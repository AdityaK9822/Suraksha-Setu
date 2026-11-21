# Firmware Module

ESP32-S3 verification kiosk for NOC documents. Rust via esp-rs (esp-hal).
No blockchain client on device — only Keccak-256 hashing + backend HTTP queries.

## Structure

```
firmware/
├── src/
│   ├── main.rs     # init HAL, Wi-Fi, two net stacks, spawn tasks
│   ├── wifi.rs     # AP (SurakshaSetu-Kiosk, open) + optional STA
│   ├── dhcp.rs     # minimal DHCPv4 server for AP clients
│   ├── server.rs   # HTTP/1.1 server on :80
│   ├── hash.rs     # streaming Keccak-256 wrapper
│   ├── backend.rs  # HTTP client to backend verify endpoints
│   └── display.rs  # SSD1306 OLED driver via embassy signal
├── FIRMWARE.md     # detailed architecture
├── README.md       # build/flash instructions
└── Cargo.toml
```

## Hardware

ESP32-S3 dev board + SSD1306 128x64 OLED on I2C (SDA=GPIO8, SCL=GPIO9).
No camera — QR decoding done by phone.

## Build-time config (env vars)

| Var | Default | Meaning |
|---|---|---|
| `KIOSK_AP_SSID` | `SurakshaSetu-Kiosk` | Soft-AP SSID |
| `KIOSK_STA_SSID` | (empty = AP only) | Venue Wi-Fi SSID |
| `KIOSK_STA_PASS` | (empty) | Venue Wi-Fi password |
| `KIOSK_BACKEND_HOST` | `192.168.1.50` | Backend host |
| `KIOSK_BACKEND_PORT` | `4000` | Backend port |

## Build & flash

```
cd firmware
cargo install espup espflash
espup install
source ~/export-esp.sh
KIOSK_STA_SSID="venue-wifi" KIOSK_STA_PASS="secret" \
KIOSK_BACKEND_HOST="192.168.1.50" KIOSK_BACKEND_PORT="4000" \
cargo run --release
```

Leave `KIOSK_STA_SSID` unset for AP-only mode.

## Verification flows

- By serial: phone GETs `/verify/serial/:serial` on kiosk -> kiosk queries backend
  `/verify/serial/:serial` -> result on OLED + text response.
- By PDF: phone POSTs raw PDF to `/verify-file` -> kiosk streams Keccak-256 hash
  (never buffers whole doc) -> queries backend `/verify/hash/0x...` -> result.

## Known limits

- Open AP only (no secured soft-AP in esp-wifi 0.12).
- No TLS/auth on kiosk page (read-only verification).
- Minimal DHCP server (single pool, no NAK handling beyond reallocation).
- `StackResources<4, 1>` assumes embassy-net 0.6.