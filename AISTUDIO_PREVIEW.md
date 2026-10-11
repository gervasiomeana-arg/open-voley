# Recuperar la vista previa de OPEN VOLEY

La vista previa del editor usa un iframe de `https://aistudio.google.com`. En desarrollo, la política de seguridad permite esa dirección y la propia app. En producción mantiene `frame-ancestors 'self'`; no habilitar una excepción global para publicar.

## Ver la portada

- Ejecutar `npm run dev` en el entorno de vista previa, con `NODE_ENV=development`.
- Las credenciales de Google, Mercado Pago e IA no son necesarias para servir la portada en desarrollo. Sin Google configurado, el ingreso muestra el aviso correspondiente; no se concede una sesión de prueba ni acceso a administración.
- No hace falta configurar cuotas de vídeo, límites de IA ni la ruta de SQLite para esta revisión local: el código tiene valores por defecto. La ruta persistente sí debe planificarse antes de publicar.
- Los campos que el editor detecta en el código no implican que todos sean obligatorios para la vista previa. No introducir valores ficticios para cerrar el formulario del editor.

## Activar funciones

- Ingreso: `GOOGLE_CLIENT_ID` y `VITE_GOOGLE_CLIENT_ID` iguales, cliente OAuth web con orígenes autorizados y `SESSION_SECRET` aleatorio de 32 o más caracteres. Los secretos se cargan directamente en el entorno.
- Administración: `ADMIN_EMAILS` con el correo Google completo autorizado; primero se debe iniciar sesión con Google.
- Cobros: credenciales y firma de notificaciones de Mercado Pago. Se configuran al preparar pagos, no para ver la portada.
- IA: `GEMINI_API_KEY` al habilitar consultas reales.

La versión publicada sigue exigiendo la configuración de producción y controles del checklist de lanzamiento. Esta corrección no elimina esos controles.

## Si sigue en blanco

Comprobar `/api/health` en la dirección de la app. Si responde pero el iframe se bloquea, revisar el error de política `frame-ancestors` en la consola del navegador. Si no responde, consultar el error de arranque del servidor; la pantalla en blanco por sí sola no identifica la causa. No compartir variables secretas en capturas o registros.
