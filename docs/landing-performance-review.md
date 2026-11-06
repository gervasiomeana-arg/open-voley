# Revisión de rendimiento de la portada — 15/10/2026

## Evidencia y límites

Se contrastó el PDF de Visibility del 15/10 con el HTML y los recursos de la
web publicada, y con main a6a69f2. openvoley.com redirige a
https://open-voley-2026.ai.studio/; la página responde 200 y ya incluye un H1
en el HTML inicial. La imagen decorativa WebP tiene alt vacío explícito,
dimensiones, precarga y fetchpriority="high". No corresponde inventar un ALT
informativo ni aplicar otra vez la misma recomendación de prioridad.

El PDF informa PageSpeed móvil 57/100, FCP 8,302 s y LCP 8,583 s. No adjunta
el JSON original de Lighthouse ni identifica su elemento LCP. No se pudo
reproducir esa medición desde este entorno: la API de PageSpeed respondió
HTTP 429. Las mediciones de laboratorio y sus causas requieren nueva prueba;
no se acredita un nuevo puntaje, tráfico, conversiones ni posiciones.

Los cero clics/impresiones corresponden únicamente a las consultas de Search
Console recuperadas en el período declarado; no prueban ausencia de visitas.

## Cambios

- Entrada pública independiente: scouting, vídeo e IA se descargan al entrar
  a la aplicación, luego de consultar la sesión. App vuelve a verificarla y
  restaura el ámbito de datos con el mecanismo existente.
- Planes y acceso con Google se descargan al abrir sus ventanas. El SDK de
  Google se solicita al abrir el acceso, no en cada visita comercial.
- hydrateRoot reutiliza el HTML público. El prerender utiliza renderToString
  para conservar las fronteras de texto de React y evitar reconstrucciones.
- Los recursos de /assets, con nombres basados en su contenido, se conservan
  con Cache-Control public/max-age=31536000/immutable. HTML sigue revalidando;
  las API privadas mantienen no-store y autenticación.
- Se conserva la verificación de retornos de pago en App, incluso con sesión
  vencida. Los errores de descarga ofrecen recargar la página.

## Resultado verificable local

Misma instalación y configuración de compilación, antes/después:

| JavaScript inicial | Antes | Después |
| --- | ---: | ---: |
| Sin comprimir | 1.120.042 bytes | aproximadamente 254.000 bytes |
| Gzip local | 267.949 bytes | aproximadamente 79.100 bytes |

Estos tamaños no son tiempos de carga ni un puntaje PageSpeed. El grafo de
importaciones se comprueba en test:landing para impedir cargar App de forma
estática e imponer un presupuesto inicial menor a 150 KB gzip.

Verificación: tipado, build, landing y seguridad; pruebas DOM locales con
sesiones y Google simulados para visitante, planes, ingreso, sesión existente
y retorno de pago, sin errores de hidratación. Prueba HTTP de producción para
caché de assets/HTML y rechazo de API privada anónima. No se verificó OAuth
real ni se ejecutó Chrome/Lighthouse (binario no disponible).

## Después de publicar

Repetir PageSpeed móvil contra la URL final y conservar su JSON/fecha, elemento
LCP y tiempos de servidor. Probar Google real, planes, navegación móvil y
formulario de demo. Comparar mediciones equivalentes; revisar por separado
redirección del dominio y arranque de Cloud Run si sigue alto el tiempo inicial.
