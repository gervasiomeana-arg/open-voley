# OPEN VOLEY: apertura de pruebas y ventas

Esta entrega cierra los accesos de desarrollo que aceptaban la identidad del propietario o un correo sin verificar. Todas las sesiones anteriores dejan de ser válidas. Cerrar sesión invalida también las otras sesiones de la misma cuenta.

## Configuración antes de publicar

- Configurar un SESSION_SECRET nuevo, aleatorio, de al menos 32 caracteres; no reutilizar el respaldo antiguo del repositorio.
- Configurar GOOGLE_CLIENT_ID y VITE_GOOGLE_CLIENT_ID con el mismo cliente Web de Google, y autorizar el dominio publicado en Google Cloud. La app requiere Google para ingresar; no hay ingreso rápido por correo.
- Configurar ADMIN_EMAILS con el correo completo de la persona administradora. No existe un administrador otorgado automáticamente por el código.
- Configurar APP_URL con la URL pública HTTPS. Mantener NODE_ENV=production.
- Configurar MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_WEBHOOK_SECRET en los secretos del despliegue. La firma se obtiene en la configuración de Webhooks de Mercado Pago. No enviarlos al navegador.
- El comando de inicio es npm start, que ejecuta server-build/server.cjs. La carpeta dist contiene únicamente archivos del cliente.
- Configurar OPENVOLEY_DB_PATH en un volumen persistente. También deben persistir clients_db.json y el directorio .openvoley-video-renders. Todavía no hay un servicio externo de almacenamiento de cuentas o archivos.

## Administración comercial

Ingresar con la cuenta Google autorizada y abrir Configuración → Ventas & PRD → Administración y precios. Allí se configuran precios mensuales y anuales en ARS/USD, se consultan interesados y visitas y se exporta el listado de interesados.

Los nuevos ingresos verificados con Google registran nombre, correo y fechas en el historial de cuentas y en el registro comercial. El formulario público registra solicitudes de demo con autorización de contacto. Una visita anónima registra fecha, página y dispositivo; no permite identificar nombre o correo. La pantalla muestra las últimas 500 visitas y el total conservado.

Los cambios de precio se aplican a nuevos cobros; los iniciados antes mantienen su cotización. Son pagos de acceso por período, no una suscripción con débito automático. Las renovaciones vencidas comienzan desde el momento del pago. Los reembolsos totales y contracargos verificados retiran los días correspondientes e invalidan sesiones; reembolsos parciales requieren revisión manual.

## Datos anteriores y pruebas obligatorias

El almacenamiento del navegador queda separado por cuenta. Los datos antiguos sin propietario no se asignan automáticamente a quien ingrese. No se borran, pero dejan de aparecer en la nueva vista. El administrador dispone de una recuperación revisable por categorías, exportación de respaldo y opción de deshacer local; ver RECOVERY_RUNBOOK.md antes de importar.

Verificar en el despliegue real: dos cuentas independientes, administrador y usuario normal, cuenta vencida y bloqueada, cierre de sesión, cobro sandbox, notificación con firma válida, reembolso, cambio de precio con un cobro anterior pendiente, carga/render de vídeo y comportamiento en móvil/tablet.

Por defecto: 250 MB por archivo de vídeo, 2 GB por cuenta, dos cargas simultáneas globales, dos renders globales y uno por cuenta, hasta una hora de clips por montaje; 30 consultas IA por cuenta/hora y 200 globales/hora. La cuota de disco se comprueba antes de iniciar trabajos, no sustituye el límite de disco del contenedor ni el aislamiento de FFmpeg. Los trabajos y límites de frecuencia son de una sola instancia; no habilitar múltiples instancias sin un almacén compartido. Queda pendiente una cola duradera con limpieza de archivos tras reinicios.

## Pendientes antes de venta abierta

- Las herramientas de copia, verificación y restauración de SQLite, cuentas y vídeos están implementadas y probadas con datos sintéticos (RECOVERY_RUNBOOK.md). Configurar almacenamiento externo y retención; comprobar una restauración real y persistencia ante reinicio/redeploy antes de venta abierta.
- Verificar vulnerabilidades con el lockfile de Bun y las versiones exactas del despliegue. npm audit no admite directamente bun.lock.
- Acordar y publicar contacto real de soporte, política de privacidad, condiciones comerciales y procedimiento de eliminación de cuenta/datos. El formulario ya explica el uso y permite borrar interesados; eso no cubre todos los datos de una cuenta.
- Reconciliación de pagos fallidos y prueba de casos de reversión parciales. Monitorizar errores y costes.
- Revisar promesas de planes: accesos simultáneos por club, equipos compartidos, SLA y funciones de cada nivel todavía no se aplican como permisos comerciales separados.
- Prueba visual real del formulario de interés, panel administrativo y login en la tablet/celular. No se verificó aún el despliegue ni se procesaron cobros reales en esta entrega.

Referencias técnicas: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token y https://www.mercadopago.com.ar/developers/en/docs/wallet-connect/notifications.
