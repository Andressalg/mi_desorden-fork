#include "camara.h"

#include "esp_log.h"

static const char *TAG = "camara";

// Pinout de una ESP32-S3-WROOM CAM (OV2640). Ajustar al módulo que se use.
#define PIN_PWDN  -1
#define PIN_RESET -1
#define PIN_XCLK  15
#define PIN_SIOD  4
#define PIN_SIOC  5
#define PIN_D7    16
#define PIN_D6    17
#define PIN_D5    18
#define PIN_D4    12
#define PIN_D3    10
#define PIN_D2    8
#define PIN_D1    9
#define PIN_D0    11
#define PIN_VSYNC 6
#define PIN_HREF  7
#define PIN_PCLK  13

esp_err_t camara_init(void)
{
    camera_config_t config = {
        .pin_pwdn = PIN_PWDN,
        .pin_reset = PIN_RESET,
        .pin_xclk = PIN_XCLK,
        .pin_sccb_sda = PIN_SIOD,
        .pin_sccb_scl = PIN_SIOC,
        .pin_d7 = PIN_D7,
        .pin_d6 = PIN_D6,
        .pin_d5 = PIN_D5,
        .pin_d4 = PIN_D4,
        .pin_d3 = PIN_D3,
        .pin_d2 = PIN_D2,
        .pin_d1 = PIN_D1,
        .pin_d0 = PIN_D0,
        .pin_vsync = PIN_VSYNC,
        .pin_href = PIN_HREF,
        .pin_pclk = PIN_PCLK,
        .xclk_freq_hz = 20000000,
        .ledc_timer = LEDC_TIMER_0,
        .ledc_channel = LEDC_CHANNEL_0,
        .pixel_format = PIXFORMAT_JPEG,
        .frame_size = FRAMESIZE_SVGA,
        .jpeg_quality = 12,
        .fb_count = 2,
        .fb_location = CAMERA_FB_IN_PSRAM,
        .grab_mode = CAMERA_GRAB_LATEST,
    };

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "no arrancó la cámara: %s", esp_err_to_name(err));
    }
    return err;
}

camera_fb_t *camara_capturar(void)
{
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) {
        ESP_LOGE(TAG, "no se pudo capturar el frame");
    }
    return fb;
}
