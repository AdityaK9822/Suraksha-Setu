fn main() {
    // option_env! values are baked at compile time; without these Cargo would
    // keep a stale binary when KIOSK_* env vars change between builds.
    println!("cargo:rerun-if-env-changed=KIOSK_AP_SSID");
    println!("cargo:rerun-if-env-changed=KIOSK_STA_SSID");
    println!("cargo:rerun-if-env-changed=KIOSK_STA_PASS");
    println!("cargo:rerun-if-env-changed=KIOSK_BACKEND_HOST");
    println!("cargo:rerun-if-env-changed=KIOSK_BACKEND_PORT");
}
