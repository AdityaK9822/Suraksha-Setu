use core::fmt::Write;
use embassy_sync::blocking_mutex::raw::CriticalSectionRawMutex;
use embassy_sync::signal::Signal;
use embedded_graphics::{
    mono_font::{ascii::FONT_6X10, MonoTextStyle},
    pixelcolor::BinaryColor,
    prelude::*,
    text::Text,
};
use esp_hal::i2c::master::I2c;
use log::{info, warn};
use ssd1306::{prelude::*, I2CDisplayInterface, Ssd1306};

pub enum DisplayMsg {
    Ready(core::net::Ipv4Addr),
    Busy,
    Result {
        headline: &'static str,
        detail: heapless::String<64>,
    },
}

pub static DISPLAY: Signal<CriticalSectionRawMutex, DisplayMsg> = Signal::new();

pub async fn run(i2c: I2c<'static, esp_hal::Blocking>) -> ! {
    let interface = I2CDisplayInterface::new(i2c);
    let mut display = Ssd1306::new(interface, DisplaySize128x64, DisplayRotation::Rotate0)
        .into_buffered_graphics_mode();
    if display.init().is_err() {
        warn!("OLED init failed (check SDA=GPIO8/SCL=GPIO9 and address); running headless");
        loop {
            let _ = DISPLAY.wait().await;
        }
    }
    let style = MonoTextStyle::new(&FONT_6X10, BinaryColor::On);

    let mut buf = heapless::String::<128>::new();
    loop {
        let msg = DISPLAY.wait().await;
        let _ = display.clear(BinaryColor::Off);
        buf.clear();
        match msg {
            DisplayMsg::Ready(ip) => {
                info!("display: ready {}", ip);
                let _ = writeln!(buf, "Suraksha Setu");
                let _ = writeln!(buf, "Kiosk ready");
                let _ = writeln!(buf, "{}", ip);
            }
            DisplayMsg::Busy => {
                info!("display: busy");
                let _ = writeln!(buf, "Working...");
            }
            DisplayMsg::Result { headline, detail } => {
                info!("display: {} / {}", headline, detail.as_str());
                let _ = writeln!(buf, "{}", headline);
                let _ = writeln!(buf, "{}", detail.as_str());
            }
        }
        let _ = Text::new(buf.as_str(), Point::new(0, 10), style).draw(&mut display);
        let _ = display.flush();
    }
}
