# Revisión de pagos y acceso

Ingresar con la cuenta Google autorizada en ADMIN_EMAILS y abrir Configuración → Ventas & PRD → Administración y precios → Pagos y revisión de acceso.

El listado reúne los casos recibidos por webhook o confirmación y pagos anteriores del historial de cuentas. Prioriza revisión, reintentos y pendientes; muestra hasta 200 pagos y las últimas 100 comprobaciones. Los contadores corresponden a la cola de comprobaciones, no al total histórico de cobros. Ingresar un ID de Mercado Pago permite revisar un pago que no aparezca en el listado.

## Qué hace Reconsultar

Consulta GET /v1/payments/{id} con el token del servidor y verifica identificador, referencia OPEN VOLEY, cuenta, correo del pagador, moneda e importe cotizado. No solicita un cobro ni un reembolso. Sí aplica el acceso confirmado por el proveedor:

- Aprobado: agrega 30 o 365 días una sola vez, respetando la cotización original. Una cuenta bloqueada requiere revisión y permanece bloqueada.
- Pendiente/en proceso: registra el estado sin agregar acceso.
- Reembolso total/contracargo: retira los días otorgados por ese pago una sola vez e invalida sesiones, incluso si la cuenta está bloqueada.
- Reembolso parcial: señala revisión manual sin agregar ni quitar días automáticamente. Comprobar el caso en Mercado Pago y decidir el ajuste comercial; el panel no resuelve por sí mismo esa decisión.
- Propietario, importe, moneda o referencia inconsistentes: revisión manual, sin modificar acceso.
- Fallo del proveedor o del guardado: conserva el ID en la cola para reintentar. El webhook devuelve error para que el proveedor pueda repetir la notificación.

Cada consulta registra fecha, origen, resultado y administrador cuando corresponde. No se guardan respuestas completas del proveedor, tarjetas ni tokens en el registro. Las tablas de revisión y auditoría quedan dentro de SQLite y se incluyen en la herramienta de copia del servidor.

## Operación y límites

Revisar los estados Reintentar y Revisión necesaria al operar demos/ventas. Los reintentos del panel son manuales; no se instala un trabajador ni un calendario automático. El webhook válido reconsulta directamente al llegar. Una confirmación de pago de otro usuario no revela datos ni incorpora su pago al historial de quien consulta.

Configurar MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_WEBHOOK_SECRET en los secretos del despliegue. Las consultas tienen plazo de 10 segundos, límite por sesión y hasta dos reconsultas administrativas simultáneas. La aplicación sigue diseñada para una instancia: JSON de cuentas y SQLite no comparten una transacción. El historial por ID evita repetir días al reintentar después de un guardado parcial, pero se requiere volumen persistente y supervisión de fallos.

No es una conciliación bancaria completa: no busca automáticamente todos los movimientos de la cuenta de Mercado Pago ni descubre pagos que nunca notificaron a la app. Los pagos antiguos usan su registro histórico y la compatibilidad con precios originales si no tienen cotización guardada. Antes de ventas reales, probar con las credenciales sandbox aprobación, pendiente, webhook repetido, parcial, total, contracargo y cuenta bloqueada. Los ensayos de esta entrega usan respuestas sintéticas y no mueven dinero.

Referencias del proveedor:
- https://www.mercadopago.com.ar/developers/en/reference/online-payments/checkout-api-payments/get-payment/get
- https://www.mercadopago.com.ar/developers/en/docs/checkout-api-payments/response-handling/query-results
