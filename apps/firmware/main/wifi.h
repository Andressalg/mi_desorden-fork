#pragma once

#include "esp_err.h"

/** Conecta al WiFi configurado en menuconfig y bloquea hasta tener IP. */
esp_err_t wifi_conectar(void);
