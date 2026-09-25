#include "camara.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "microfono.h"
#include "uplink.h"
#include "wifi.h"

static const char *TAG = "main";

/**
 * Manda heartbeat cada CONFIG_MD_HEARTBEAT_SEGUNDOS para que la app sepa
 * que el dispositivo sigue vivo.
 */
static void tarea_heartbeat(void *arg)
{
    (void)arg;
    const TickType_t espera = pdMS_TO_TICKS(CONFIG_MD_HEARTBEAT_SEGUNDOS * 1000);

    for (;;) {
        uplink_heartbeat();
        vTaskDelay(espera);
    }
}

/**
 * Captura y reconocimiento.
 *
 * TODO: acá va el reconocimiento. Falta decidir dónde corre (ver
 * docs/DECISIONES.md): en el ESP32 con TFLite Micro / Edge Impulse, o
 * mandando el frame a la API para que lo clasifique un modelo más grande.
 * Por ahora solo captura y loguea el tamaño del frame.
 */
static void tarea_captura(void *arg)
{
    (void)arg;

    for (;;) {
        camera_fb_t *fb = camara_capturar();
        if (fb) {
            ESP_LOGI(TAG, "frame de %u bytes", (unsigned)fb->len);
            esp_camera_fb_return(fb);
        }
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "mi_desorden arrancando");

    ESP_ERROR_CHECK(wifi_conectar());

    if (camara_init() != ESP_OK) {
        ESP_LOGE(TAG, "sin cámara, sigo igual");
    }
    if (microfono_init() != ESP_OK) {
        ESP_LOGE(TAG, "sin micrófono, sigo igual");
    }

    xTaskCreate(tarea_heartbeat, "heartbeat", 4096, NULL, 4, NULL);
    xTaskCreate(tarea_captura, "captura", 8192, NULL, 5, NULL);
}
