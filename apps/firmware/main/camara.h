#pragma once

#include "esp_camera.h"
#include "esp_err.h"

/** Inicializa la OV2640. Necesita PSRAM. */
esp_err_t camara_init(void);

/** Toma un frame JPEG. Hay que devolverlo con esp_camera_fb_return(). */
camera_fb_t *camara_capturar(void);
