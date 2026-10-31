# Suscripción mensual automática — Argentina / ARS

El enlace `mpago.la/34czrYP` sigue siendo un pago manual independiente. No suscribe a nadie ni convierte pagos anteriores en débitos recurrentes.

## Activación en AI Studio / Cloud Run

Sincronizar GitHub, configurar en **el servidor publicado**, reconstruir y publicar:

- `MERCADOPAGO_ACCESS_TOKEN`: credencial privada de la aplicación de Mercado Pago del vendedor. Nunca `VITE_` ni código cliente.
- `MERCADOPAGO_WEBHOOK_SECRET`: firma secreta que muestra Mercado Pago al configurar las notificaciones de esa misma aplicación.
- `APP_URL`: origen HTTPS de la aplicación publicada, por ejemplo `https://open-voley-2026.ai.studio` (sin ruta). Google OAuth debe seguir autorizando ese dominio.
- `MERCADOPAGO_SUBSCRIPTIONS_ENABLED=true`: habilita la contratación recurrente únicamente cuando están presentes las configuraciones anteriores. Dejar `false` hasta preparar la prueba.

No hace falta Public Key para esta autorización alojada: los datos de tarjeta se introducen en Mercado Pago, no en OPEN VOLEY. No solicitar ni pegar credenciales en el chat.

En Mercado Pago Developers → Tus integraciones → aplicación del vendedor → Webhooks:

- URL: `https://open-voley-2026.ai.studio/api/mercadopago/webhook` (usar el dominio real de APP_URL).
- Eventos: `payment`, `subscription_preapproval`, `subscription_authorized_payment`.
- Configurar el entorno de prueba y producción por separado. Usar las cuentas, tarjetas y restricciones de pruebas que indique Mercado Pago para Suscripciones; una prueba simulada local no acredita un cobro real.

`GET /api/mercadopago/config` devuelve `subscriptionsEnabled`; comprueba configuración presente, no validez de credenciales ni entrega de notificaciones.

## Experiencia del cliente

Planes → activar **Renovación mensual automática** → leer y aceptar los cargos → elegir plan → autorizar en Mercado Pago. No hay casillas preaceptadas. El primer cobro se solicita al autorizar; después es mensual hasta cancelar. No se promete una nueva prueba de siete días ni se pospone el cobro por el tiempo de prueba restante.

La cuenta Google se vincula en el servidor a la referencia única de la suscripción. La cuenta pagadora de Mercado Pago puede tener otro correo: el servidor verifica el ID del pagador y del vendedor contra la suscripción y su factura. El importe sale del catálogo del servidor y queda fijado para ese contrato. Cambiar precios en Administración afecta futuras contrataciones; no modifica contratos autorizados existentes.

**Mi suscripción mensual** aparece en Planes y en la pantalla de acceso vencido. Permite completar una autorización pendiente, actualizar pagos y cancelar. Cancelar detiene futuras renovaciones del contrato y conserva el período pagado. No borra datos ni reembolsa automáticamente. Un débito iniciado antes de cancelar podría liquidarse después.

Los botones de pago individual y el enlace manual permanecen disponibles y se describen por separado. El débito automático de esta integración se ofrece solo en ARS con cuenta vendedora argentina: no anunciar cobros internacionales recurrentes sin validación específica.

## Verificación y persistencia

- El servidor guarda una reserva antes de crear el contrato. Doble clic, solicitud simultánea y respuesta incierta no crean dos acuerdos. Una creación incierta requiere Actualizar estado, que busca la referencia exacta; nunca vuelve a crear a ciegas.
- La firma HMAC del webhook se verifica; después se consulta el recurso directamente en la API de Mercado Pago. El estado del navegador y el cuerpo del webhook no acreditan acceso.
- Se vinculan suscripción → factura → pago, con importe, moneda, vendedor y pagador coincidentes. Autorizar, estar pendiente o ser rechazado no otorga acceso.
- Un pago aprobado habilita su período calendario. Duplicados no suman días. La fecha de próximo cobro verificada se usa si corresponde al siguiente mes; si falta se calcula el mes con límite del último día. Se mantiene la prueba y las extensiones manuales existentes.
- El rechazo no renueva. Al terminar los períodos pagados/prueba/extensiones se bloquea el acceso operativo; equipos, partidos y jugadores permanecen guardados.
- Reembolso total/contracargo retira solo el período correspondiente. Parciales o discrepancias fallan sin otorgar acceso y requieren revisión manual. Los callbacks fallidos responden error para permitir reintentos de Mercado Pago. Los resultados procesados aparecen en el historial de conciliación.
- Actualizar pagos vuelve a consultar facturas paginadas y repara notificaciones perdidas; no requiere la página abierta para recibir webhooks. No se añade un cron externo.
- La licencia y el recibo se escriben juntos en el registro privado existente de la cuenta, protegido por las revisiones de Supabase. La escritura se reintenta al detectar un conflicto. No se cambian tablas ni políticas. Sin Supabase se usa el mecanismo local existente, que no es persistente en un contenedor efímero.

## Antes de anunciarlo como operativo

1. Publicar esta versión con la configuración y eventos correctos.
2. Con cuentas de prueba distintas del vendedor, comprobar autorización, factura aprobada y acceso, pago pendiente/rechazado, callback duplicado y renovación posterior.
3. Probar cancelación y verificar también el estado en Mercado Pago; comprobar vencimiento conservando datos.
4. Probar reembolso/contracargo y recuperación después de un callback fallido.
5. Comprobar reinicio y despliegue conservando estado en Supabase.
6. Registrar una prueba real controlada solo con autorización expresa del titular del medio de pago.

## Validación automatizada

`npm run test:subscriptions`, `npm run test:payments`, `npm run test:launch-security`, `npm run test:readiness`, `npm run lint`, `npm run build`.

Las pruebas utilizan cuentas ficticias y una API simulada, sin hacer cargos ni tocar datos de producción. La disponibilidad internacional, la aceptación de tarjetas y la entrega real de webhooks no quedan certificadas por ellas.

## Documentación oficial consultada

- https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-configuration/subscription-no-associated-plan/pending-payments
- https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/your-integrations/notifications/webhooks
- https://www.mercadopago.com.ar/developers/es/reference/online-payments/subscriptions/authorized-payment-search/get
- https://www.mercadopago.com.ar/developers/es/reference/online-payments/subscriptions/get-authorized-payment/get
