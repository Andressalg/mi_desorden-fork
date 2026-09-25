#include "uplink.h"

#include <stdio.h>
#include <string.h>

#include "esp_http_client.h"
#include "esp_log.h"

static const char *TAG = "uplink";

static esp_err_t post_json(const char *path, const char *body)
{
    char url[256];
    snprintf(url, sizeof(url), "%s%s", CONFIG_MD_API_URL, path);

    esp_http_client_config_t config = {
        .url = url,
        .method = HTTP_METHOD_POST,
        .timeout_ms = 5000,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_header(client, "x-device-token", CONFIG_MD_DEVICE_TOKEN);
    esp_http_client_set_post_field(client, body, (int)strlen(body));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        const int status = esp_http_client_get_status_code(client);
        if (status >= 400) {
            ESP_LOGW(TAG, "POST %s → %d", path, status);
            err = ESP_FAIL;
        }
    } else {
        ESP_LOGW(TAG, "POST %s falló: %s", path, esp_err_to_name(err));
    }

    esp_http_client_cleanup(client);
    return err;
}

esp_err_t uplink_heartbeat(void)
{
    char body[256];
    snprintf(body, sizeof(body),
             "{\"device_id\":\"%s\",\"nombre\":\"%s\",\"firmware\":\"0.1.0\"}",
             CONFIG_MD_DEVICE_ID, CONFIG_MD_DEVICE_ID);
    return post_json("/devices/heartbeat", body);
}

esp_err_t uplink_deteccion(const char *etiqueta, float confianza, const char *fuente)
{
    char body[320];
    snprintf(body, sizeof(body),
             "{\"device_id\":\"%s\",\"etiqueta\":\"%s\",\"confianza\":%.2f,\"fuente\":\"%s\"}",
             CONFIG_MD_DEVICE_ID, etiqueta, confianza, fuente);
    return post_json("/detections", body);
}
