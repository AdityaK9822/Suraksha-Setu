# Suraksha Setu — ESP32-S3 verification kiosk (firmware)

Verification kiosk for NOC documents. The ESP32-S3 hosts an open Wi-Fi AP
(`SurakshaSetu-Kiosk` by default) and serves a small page; a phone connects,
scans the QR printed on a NOC (which resolves to the kiosk URL with the
serial), or uploads the PDF. The device hashes the PDF with Keccak-256 and
checks it against the backend, showing the result on the OLED.

Hardware assumed: ESP32-S3 dev board + SSD1306 128x64 OLED on I2C
(SDA=GPIO8, SCL=GPIO9). No camera — QR decoding is done by the phone.

## Toolchain (one-time)

```sh
cargo install espup espflash
espup install          # installs the `esp` rust toolchain for Xtensa
source ~/export-esp.sh  # or add to your shell profile
```

## Build & flash

```sh
cd firmware
KIOSK_STA_SSID="venue-wifi" KIOSK_STA_PASS="secret" \
KIOSK_BACKEND_HOST="192.168.1.50" KIOSK_BACKEND_PORT="4000" \
cargo run --release
```

Leave `KIOSK_STA_SSID` unset to run AP-only (no backend reachability).

Build-time config (all optional, via env):
- `KIOSK_AP_SSID` (default `SurakshaSetu-Kiosk`)
- `KIOSK_STA_SSID` / `KIOSK_STA_PASS` (default empty = AP only)
- `KIOSK_BACKEND_HOST` (default `192.168.1.50`)
- `KIOSK_BACKEND_PORT` (default `4000`)

## Notes / known limits

- `StackResources<4, 1>` arity assumes embassy-net 0.6's
  `StackResources<SOCKETS, UDP_SOCKETS, ...>`. If the build complains,
  adjust the generic args to match your embassy-net version.
- `DhcpConfig` is re-exported by embassy-net 0.6; if not, use
  `embassy_net::dhcpv4::Config::default()`.
- Open AP only (secured soft-AP is not supported by esp-wifi 0.12).
- No TLS/auth on the kiosk page — read-only verification on a softAP.
- Tests (`cargo test`) run on the esp toolchain target; the Keccak vector
  test pins the firmware hash to the backend's `@noble/hashes` output.
- shortcut: DHCP server is minimal (single pool, no NAK handling beyond
  reallocation); upgrade to a full DHCP implementation if lease churn
  matters.
