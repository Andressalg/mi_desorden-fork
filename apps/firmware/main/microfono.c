#include "microfono.h"

#include "driver/i2s_std.h"
#include "esp_log.h"

static const char *TAG = "microfono";

// INMP441 por I2S. Ajustar a los pines del armado.
#define PIN_BCLK 41
#define PIN_WS   42
#define PIN_DIN  2

#define SAMPLE_RATE 16000

static i2s_chan_handle_t s_rx;

esp_err_t microfono_init(void)
{
    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_AUTO, I2S_ROLE_MASTER);
    esp_err_t err = i2s_new_channel(&chan_cfg, NULL, &s_rx);
    if (err != ESP_OK) return err;

    i2s_std_config_t std_cfg = {
        .clk_cfg = I2S_STD_CLK_DEFAULT_CONFIG(SAMPLE_RATE),
        .slot_cfg = I2S_STD_PHILIPS_SLOT_DEFAULT_CONFIG(I2S_DATA_BIT_WIDTH_32BIT,
                                                        I2S_SLOT_MODE_MONO),
        .gpio_cfg = {
            .mclk = I2S_GPIO_UNUSED,
            .bclk = PIN_BCLK,
            .ws = PIN_WS,
            .dout = I2S_GPIO_UNUSED,
            .din = PIN_DIN,
        },
    };

    err = i2s_channel_init_std_mode(s_rx, &std_cfg);
    if (err != ESP_OK) return err;

    ESP_LOGI(TAG, "micrófono listo a %d Hz", SAMPLE_RATE);
    return i2s_channel_enable(s_rx);
}

size_t microfono_leer(int16_t *buffer, size_t muestras)
{
    size_t leidos = 0;
    // El INMP441 entrega 32 bits por muestra; nos quedamos con los 16 altos.
    static int32_t crudo[512];
    const size_t n = muestras < 512 ? muestras : 512;

    if (i2s_channel_read(s_rx, crudo, n * sizeof(int32_t), &leidos, 100) != ESP_OK) {
        return 0;
    }

    const size_t total = leidos / sizeof(int32_t);
    for (size_t i = 0; i < total; i++) {
        buffer[i] = (int16_t)(crudo[i] >> 16);
    }
    return total;
}
