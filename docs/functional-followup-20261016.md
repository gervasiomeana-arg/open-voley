# Continuación de revisión funcional — 16/10/2026 UTC

Alcance solicitado: continuar las correcciones y verificaciones pendientes, excluyendo cobros. No se cambió la integración de pagos ni se realizaron cargos.

## Competiciones

Se reemplazó la pantalla de demostración por torneos de la cuenta, sin muestras iniciales. El asistente selecciona equipos existentes por ID y conserva sus nombres como una fotografía del torneo. Soporta 2–32 equipos, partidos al mejor de cinco sets, todos contra todos a una rueda, eliminación directa y dos zonas con semifinales A1–B2/B1–A2 y final. Los pases libres completan la llave inicial sin reiterarse en rondas posteriores.

Se pueden programar fecha y hora, cargar/corregir resultados de la fase abierta, consultar tablas y cerrar fases. No se inventan resultados ni se presenta un enlace de scouting como si cargara el partido del fixture: los resultados de esta sección se registran manualmente. Cerrar una fase bloquea sus resultados para no invalidar cruces posteriores.

Las tablas usan el sistema seleccionado: 3/0 en 3–0 y 3–1, 2/1 en 3–2, o 2 al ganador y 1 al perdedor. Desempates: victorias y cociente de sets; si todavía afectan clasificación o primer puesto, se exige confirmar un orden conforme al reglamento. Corregir un resultado elimina esa confirmación.

La colección `openvoley_competitions_v1` tiene validación compartida cliente/servidor y utiliza la cola de sincronización por cuenta, con conflictos explícitos. Se incluyó en exportación/importación revisada y respaldos por sección. No necesita una nueva migración SQL: usa el almacén genérico existente. No rescata torneos de la antigua pantalla que nunca fueron guardados.

## Vídeo e IA

- Se impide reemplazar una fuente mientras su usuario genera un montaje y generar un montaje mientras la carga está incompleta, dentro de la misma instancia.
- La comprobación de FFmpeg tiene un límite de cinco segundos. Capacidades informa que sus archivos son temporales. Descargar para compartir verifica la respuesta HTTP antes de tratarla como MP4.
- El overlay de vídeo dejó de mostrar un jugador fijo, velocidades, alturas, OCR y acreditaciones ficticias. Sólo muestra etiquetas realmente registradas en una ventana de dos segundos. Se eliminó el retorno temprano anterior a un hook que podía fallar al activar/desactivar.
- El botón de Auto-Scan informa que no está disponible, sin simular un escaneo. Los marcadores manuales ya no se presentan como puntos del local, incluidos los marcadores históricos con código MANUAL.
- Las solicitudes de Gemini tienen timeout de 45 segundos, un único intento, máximo de salida y error ante respuesta vacía. El modelo puede configurarse con `GEMINI_MODEL`; el predeterminado es gemini-3.8-flash, documentado por Google: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash . La configuración de timeout/reintentos sigue la interfaz oficial del SDK y sus tipos instalados: https://googleapis.github.io/js-genai/release_docs/interfaces/types.HttpOptions.html .
- Un contexto excesivo se rechaza en lugar de truncar su JSON silenciosamente. Los fallos del proveedor no imprimen el prompt ni el objeto de error que pueda contener información privada.

## Validación

- Las 40 suites pasaron después de los cambios principales. Se agregó además una regresión del overlay (41 suites totales).
- Pruebas de fixtures y eliminación para todos los tamaños de 2 a 32, zonas de 4 a 12, resultados inválidos, sistemas de puntos, empates, cierre de fases y validación de relaciones.
- Exportación/importación por confirmación explícita, aislamiento local entre cuentas, no sobrescritura al detectar JSON corrupto y sincronización/hidratación del torneo con un servidor simulado.
- Integración HTTP local con FFmpeg real: fuente de cuatro segundos, montaje de dos cortes con audio, descarga MP4, duración verificada con ffprobe, acceso anónimo rechazado, acceso de otra cuenta rechazado y sustitución concurrente bloqueada. Datos y archivos de prueba se crearon en un directorio temporal aislado y se eliminaron.
- Pruebas DOM con jsdom: crear torneo, cargar resultado, tabla, remontar conservando datos, cambio de cuenta, overlay activado/desactivado y ausencia de etiqueta fuera de su instante. No acreditan dimensiones ni interacción táctil de un dispositivo real.
- Tipado, compilación de producción y comprobaciones de portada pasan. Entrada pública: 79.077 bytes gzip; la aplicación privada sigue diferida.
- Comprobación pública sin sesión: portada y salud HTTP 200; sesión, datos, cuentas y capacidades de vídeo HTTP 401 JSON con no-store. Estos resultados corresponden a la publicación anterior, no prueban que esta revisión ya esté desplegada.

## Verificaciones externas pendientes

1. Incorporar cambios de GitHub en AI Studio, publicar y repetir comprobaciones afectadas. No se desplegó desde esta sesión.
2. Google y vencimiento de prueba con cuentas reales en la publicación; celular/tablet y orientación; consulta real de Gemini con la credencial del servidor. Las pruebas del proveedor de IA son simuladas.
3. Confirmar FFmpeg, recursos y duración de trabajos en Cloud Run. Los archivos y trabajos todavía son temporales por instancia: reinicios, escalado y restricciones de CPU pueden interrumpir un render. La base de Supabase respalda metadatos/cortes, no MP4 originales ni montajes. Persistencia de vídeos y ejecución durable requieren almacenamiento y procesamiento adicionales.
4. Confirmar migración de los datos de ambos entrenadores y el último respaldo programado. La restauración aislada documentada en la revisión anterior no prueba que todos los pilotos estén migrados.
5. Rotación coordinada de claves que estuvieron expuestas, recuperación operativa a un proyecto Supabase separado, soporte/condiciones/privacidad y correspondencia entre prestaciones anunciadas y funciones operativas.

La auditoría y estas pruebas no certifican funcionamiento al 100 % de todos los dispositivos, cuentas o servicios externos.
