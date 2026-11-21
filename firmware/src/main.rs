#![no_std]
#![no_main]

mod backend;
mod dhcp;
mod display;
mod hash;
mod server;
mod wifi;

use core::net::Ipv4Addr;

use embassy_executor::Spawner;
use embassy_net::Stack;
use embassy_time::{Duration, Timer};
use esp_alloc as _;
use esp_backtrace as _;
use esp_hal::{clock::CpuClock, rng::Rng, timer::timg::TimerGroup};
use esp_println::println;
use static_cell::StaticCell;

macro_rules! mk_static {
    ($t:ty, $val:expr) => {{
        static STATIC_CELL: StaticCell<$t> = StaticCell::new();
        STATIC_CELL.init($val)
    }};
}

const AP_SSID: &str = match option_env!("KIOSK_AP_SSID") { Some(v) => v, None => "SurakshaSetu-Kiosk" };
const STA_SSID: &str = match option_env!("KIOSK_STA_SSID") { Some(v) => v, None => "" };
const STA_PASS: &str = match option_env!("KIOSK_STA_PASS") { Some(v) => v, None => "" };

#[esp_hal_embassy::main]
async fn main(spawner: Spawner) {
    let peripherals = esp_hal::init(esp_hal::Config::default().with_cpu_clock(CpuClock::max()));
    esp_alloc::heap_allocator!(72 * 1024);

    let timg0 = TimerGroup::new(peripherals.TIMG0);
    let timg1 = TimerGroup::new(peripherals.TIMG1);
    esp_hal_embassy::init(timg1.timer0);

    let mut rng = Rng::new(peripherals.RNG);
    // generate seeds before rng is consumed by esp_wifi::init
    let ap_seed = (rng.random() as u64) << 32 | rng.random() as u64;
    let sta_seed = (rng.random() as u64) << 32 | rng.random() as u64;

    let esp_wifi_ctrl = esp_wifi::init(timg0.timer0, rng, peripherals.RADIO_CLK).unwrap();
    let esp_wifi_ctrl = mk_static!(esp_wifi::EspWifiController<'static>, esp_wifi_ctrl);

    let (ap_dev, sta_dev, controller) =
        esp_wifi::wifi::new_ap_sta(esp_wifi_ctrl, peripherals.WIFI).unwrap();
    let controller = mk_static!(esp_wifi::wifi::WifiController<'static>, controller);

    // AP interface: static 192.168.2.1/24
    let ap_resources = mk_static!(embassy_net::StackResources<4>, embassy_net::StackResources::new());
    let ap_config = embassy_net::Config::ipv4_static(embassy_net::StaticConfigV4 {
        address: embassy_net::Ipv4Cidr::new(Ipv4Addr::new(192, 168, 2, 1), 24),
        gateway: Some(Ipv4Addr::new(192, 168, 2, 1)),
        dns_servers: Default::default(),
    });
    let (ap_stack, ap_runner) = embassy_net::new(ap_dev, ap_config, ap_resources, ap_seed);
    let ap_stack = mk_static!(embassy_net::Stack<'static>, ap_stack);
    let ap_runner = mk_static!(embassy_net::Runner<'static, esp_wifi::wifi::WifiDevice<'static, esp_wifi::wifi::WifiApDevice>>, ap_runner);

    // STA interface: DHCP on the venue/phone hotspot network
    let sta_resources = mk_static!(embassy_net::StackResources<4>, embassy_net::StackResources::new());
    let sta_config = embassy_net::Config::dhcpv4(embassy_net::DhcpConfig::default());
    let (sta_stack, sta_runner) = embassy_net::new(sta_dev, sta_config, sta_resources, sta_seed);
    let sta_stack = mk_static!(embassy_net::Stack<'static>, sta_stack);
    let sta_runner = mk_static!(embassy_net::Runner<'static, esp_wifi::wifi::WifiDevice<'static, esp_wifi::wifi::WifiStaDevice>>, sta_runner);

    spawner.spawn(connection_task(controller, AP_SSID, STA_SSID, STA_PASS)).ok();
    spawner.spawn(net_task_ap(ap_runner)).ok();
    spawner.spawn(net_task_sta(sta_runner)).ok();
    spawner.spawn(dhcp_task(*ap_stack)).ok();
    spawner.spawn(server_task(*ap_stack)).ok();

    // I2C for the SSD1306 OLED (SDA=GPIO8, SCL=GPIO9 — adjust to your board)
    let i2c = esp_hal::i2c::master::I2c::new(
        peripherals.I2C0,
        esp_hal::i2c::master::Config::default(),
    )
    .unwrap()
    .with_sda(peripherals.GPIO8)
    .with_scl(peripherals.GPIO9);
    spawner.spawn(display_task(i2c)).ok();

    display::DISPLAY.signal(display::DisplayMsg::Ready(Ipv4Addr::new(192, 168, 2, 1)));

    println!("Suraksha Setu kiosk up");
    loop {
        Timer::after(Duration::from_secs(3600)).await;
    }
}

#[embassy_executor::task]
async fn connection_task(
    controller: &'static mut esp_wifi::wifi::WifiController<'static>,
    ap_ssid: &'static str,
    sta_ssid: &'static str,
    sta_pass: &'static str,
) {
    wifi::run(controller, ap_ssid, sta_ssid, sta_pass).await
}

#[embassy_executor::task]
async fn net_task_ap(runner: &'static mut embassy_net::Runner<'static, esp_wifi::wifi::WifiDevice<'static, esp_wifi::wifi::WifiApDevice>>) {
    runner.run().await
}

#[embassy_executor::task]
async fn net_task_sta(runner: &'static mut embassy_net::Runner<'static, esp_wifi::wifi::WifiDevice<'static, esp_wifi::wifi::WifiStaDevice>>) {
    runner.run().await
}

#[embassy_executor::task]
async fn dhcp_task(stack: embassy_net::Stack<'static>) {
    dhcp::run(stack).await
}

#[embassy_executor::task]
async fn server_task(stack: embassy_net::Stack<'static>) {
    server::run(stack).await
}

#[embassy_executor::task]
async fn display_task(i2c: esp_hal::i2c::master::I2c<'static, esp_hal::Blocking>) {
    display::run(i2c).await
}
