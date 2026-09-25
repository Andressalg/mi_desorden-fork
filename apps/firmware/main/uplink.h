#pragma once

#include <stdbool.h>

#include "esp_err.h"

/** Avisa a la API que el dispositivo está vivo. */
esp_err_t uplink_heartbeat(void);

/** Manda una detección a la API. */
esp_err_t uplink_deteccion(const char *etiqueta, float confianza, const char *fuente);
