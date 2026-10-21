# Avisos de nuevas pruebas en Android

OPEN VOLEY puede enviar notificaciones Web Push al administrador cuando una cuenta nueva, que no sea administradora, inicia su prueba mediante Google. Una visita anónima o el regreso de una cuenta existente no generan un nuevo aviso.

## Activación

1. Sincronizar el repositorio en AI Studio y publicar la actualización.
2. Abrir la web publicada desde Chrome en el Android que recibirá los avisos.
3. Ingresar con la cuenta administradora y abrir Administración comercial.
4. En «Avisos al celular · Sin WhatsApp», pulsar «Activar avisos en este dispositivo» y permitir notificaciones.
5. Pulsar «Enviar prueba» y confirmar que aparece la notificación en el celular.

No requiere WhatsApp, otro número, un proveedor de mensajería de pago ni introducir claves manualmente. Necesita conexión a Internet y permisos de Chrome y Android. El ahorro de batería, No molestar o restricciones del sistema pueden retrasar u ocultar avisos. La prueba de entrega real queda pendiente hasta confirmarla en el teléfono.

El texto de nuevos clientes es «OPEN VOLEY: Un nuevo cliente activó su prueba». No incluye nombres ni correos en la pantalla bloqueada. Cada administrador puede registrar hasta cinco dispositivos y desactivar cada uno desde el mismo navegador. No se envían avisos de altas anteriores al registro del dispositivo.

## Almacenamiento y seguridad

- Las claves VAPID se generan una sola vez en el servidor y se conservan en el almacenamiento persistente existente, namespace `commercial`, propietario `admin-push`. La clave privada nunca se devuelve al navegador. En desarrollo sin almacenamiento durable se usa `.openvoley-push.json`, excluido de Git.
- Las suscripciones son datos privados de administración. Los endpoints requieren sesión administradora, las escrituras conservan la protección de origen y tienen límite de frecuencia. Solo se aceptan servicios push conocidos por HTTPS y claves de curva válidas.
- Cada envío vuelve a comprobar que el propietario del dispositivo sigue siendo administrador y no está bloqueado. Las suscripciones vencidas se eliminan.
- El alta guarda su evento junto con la cuenta. Las reservas de envío usan control de revisiones para evitar duplicados entre instancias. Una respuesta incierta no se reenvía automáticamente; un rechazo explícito por límite del proveedor puede reintentarse en un ingreso posterior, tras un minuto. No hay promesa de entrega exactamente una vez ni de entrega garantizada.
- Una respuesta aceptada acredita aceptación del servicio push, no que Android haya mostrado el aviso. Una falla de notificación no bloquea el acceso del cliente.
- El service worker solo maneja notificaciones y abre la página principal. No intercepta peticiones ni almacena información del partido.

## Verificación

`npm run test:admin-push` comprueba el alta Google, aislamiento de administradores, protección de origen, suscripciones inválidas, persistencia, conflictos entre instancias, duplicados, dispositivos vencidos, privacidad del aviso y conservación de los demás datos. Usa almacenamiento temporal y proveedor simulado; no sustituye la prueba en el celular.
