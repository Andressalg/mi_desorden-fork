#pragma once

#include <stddef.h>
#include <stdint.h>

#include "esp_err.h"

/** Inicializa el micrófono I2S (INMP441). */
esp_err_t microfono_init(void);

/** Lee muestras PCM de 16 bits. Devuelve cuántas leyó. */
size_t microfono_leer(int16_t *buffer, size_t muestras);
