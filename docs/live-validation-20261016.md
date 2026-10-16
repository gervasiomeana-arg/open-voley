# Validación en la publicación — 16/10/2026

Pruebas realizadas desde el navegador remoto en https://open-voley-2026.ai.studio/ con la cuenta administradora, mediante el acceso normal de Google. No se obtuvieron contraseñas, códigos, cookies ni tokens. No se modificaron cobros, licencias, precios ni claves.

## Resultado observado

| Servicio | Resultado | Evidencia y límite |
| --- | --- | --- |
| Google | Aprobado para la cuenta administradora | Acceso completado, identidad visible, sesión conservada al recargar y acceso al panel administrativo. No prueba el alta de otra cuenta ni dispositivos móviles. |
| Sincronización | Aprobada para esta operación | Un corte técnico pasó de pendiente a confirmado en la nube; se retiró luego y la lista volvió a cero. Las ocho acciones originales del partido no se alteraron. |
| Consulta de IA | Falló | El servicio recibió una pregunta sobre el partido de ocho acciones; la interfaz terminó con un error genérico. El panel confirma presencia de credencial, no su validez, permisos, modelo o cuota. No se atribuye una causa sin diagnóstico adicional. |
| Reproducción de vídeo | Aprobada para el archivo técnico | MP4 H.264/AAC sintético de 12 s; metadatos 320×180, readyState 4, error nulo y reproducción avanzó hasta 7,3 s. |
| Etiquetado y filtro | Aprobados | Corte identificado como VALIDACIÓN TÉCNICA; el editor lo aisló por jugador y fundamento. No se guardó un montaje ni se envió a terceros. |
| Exportación de vídeo | Falló | No hubo descarga en 20 s. Al volver al reproductor apareció “Carga un archivo de video local antes de exportar el montaje”, pese a haber cargado y reproducido el archivo. No se verificó FFmpeg ni una exportación MP4 del servidor. |

La fecha de compilación visible en administración fue 15/10/2026 11:41:03 (formato del navegador). La interfaz también mostró el aviso nuevo de almacenamiento temporal. Sin un identificador de revisión, esa fecha no identifica por sí sola el commit desplegado ni acredita uniformidad de frontend/backend.

## Correcciones derivadas

1. El reproductor se desmontaba al abrir Editor Deportivo Inteligente. El fallback captureStream y el inicio de playlists consultaban una referencia nula. Ahora se conserva el mismo elemento multimedia entre pestañas, se pausa cuando corresponde y los mensajes también son visibles desde el editor. La exportación del navegador vuelve al reproductor sin perder el stream.
2. Los fallos de IA se clasifican en acceso/permisos, modelo, cuota/límite, tiempo de espera, respuesta vacía o indisponibilidad. La interfaz también distingue sesión, licencia y exceso de contexto. No se muestran mensajes crudos del proveedor ni se registran claves/conversaciones.

## Verificación de las correcciones

- Tipado, build y comprobación de portada.
- Regresión DOM con jsdom: el mismo elemento video sobrevive al cambio de pestaña, la exportación comienza captureStream/MediaRecorder, vuelve al reproductor y completa el enlace de descarga. Codificador simulado: no equivale a una exportación real de producción.
- Pruebas de clasificación de IA: 401/403/404/429/504/5xx, configuración, respuesta vacía y ausencia de datos privados en errores.
- Las pruebas del render FFmpeg existentes se realizaron en entorno local aislado en la revisión anterior; no se presentan como prueba del servidor publicado.

Pendiente: incorporar y publicar estas correcciones, repetir la pregunta de IA para identificar su error real y exportar el archivo técnico en producción. Google queda validado para la cuenta probada; IA y exportación no se consideran aprobadas todavía. Los originales de vídeo y los trabajos siguen siendo temporales por instancia.
