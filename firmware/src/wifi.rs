use embassy_time::{Duration, Timer};
use esp_wifi::wifi::{
    AccessPointConfiguration, AuthMethod, ClientConfiguration, Configuration, WifiController,
};
use heapless::String;

pub async fn run(
    controller: &mut WifiController<'static>,
    ap_ssid: &'static str,
    sta_ssid: &'static str,
    sta_pass: &'static str,
) {
    let use_sta = !sta_ssid.is_empty();

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

        if use_sta && !controller.is_connected().unwrap_or(false) {
            let _ = controller.connect_async().await;
        }

        Timer::after(Duration::from_secs(5)).await;
    }
}
