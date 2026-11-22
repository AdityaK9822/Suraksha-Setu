use embassy_time::{Duration, Timer};
use esp_wifi::wifi::{
    AccessPointConfiguration, AuthMethod, ClientConfiguration, Configuration, WifiController,
};
use heapless::String;
use log::info;

pub async fn run(
    controller: &mut WifiController<'static>,
    ap_ssid: &'static str,
    sta_ssid: &'static str,
    sta_pass: &'static str,
) {
    let use_sta = !sta_ssid.is_empty();
    let mut scanned = false;

    loop {
        if !controller.is_started().unwrap_or(false) {
            let mut ap_cfg = AccessPointConfiguration::default();
            ap_cfg.ssid = String::try_from(ap_ssid).unwrap_or_default();
            ap_cfg.auth_method = AuthMethod::None; // open AP (secured softAP not supported by esp-wifi 0.12)
            ap_cfg.channel = 6;
            ap_cfg.max_connections = 4;

            let conf = if use_sta {
                let mut client_cfg = ClientConfiguration::default();
                client_cfg.ssid = String::try_from(sta_ssid).unwrap_or_default();
                client_cfg.password = String::try_from(sta_pass).unwrap_or_default();
                client_cfg.auth_method = AuthMethod::WPA2Personal;
                Configuration::Mixed(client_cfg, ap_cfg)
            } else {
                Configuration::AccessPoint(ap_cfg)
            };

            if controller.set_configuration(&conf).is_ok() {
                let _ = controller.start_async().await;
            }
        }

        if use_sta && !scanned {
            scanned = true;
            match controller.scan_n_async::<32>().await {
                Ok((aps, count)) => {
                    info!("scan: {} APs visible", count);
                    for ap in aps.iter() {
                        info!(
                            "  AP {} ch={} rssi={} auth={:?}",
                            ap.ssid.as_str(), ap.channel, ap.signal_strength, ap.auth_method
                        );
                    }
                }
                Err(e) => info!("scan failed: {:?}", e),
            }
        }

        if use_sta && !controller.is_connected().unwrap_or(false) {
            info!("connecting to STA SSID {:?}", sta_ssid);
            if let Err(e) = controller.connect_async().await {
                info!("connect failed: {:?}", e);
            }
        }

        Timer::after(Duration::from_secs(5)).await;
    }
}
