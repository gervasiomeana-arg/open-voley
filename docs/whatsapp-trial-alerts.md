# Aviso al administrador: nueva prueba

Estado: integración implementada, requiere configuración y prueba real antes de declarar envío operativo.

## Evento

Solo una cuenta NUEVA, no administrativa, creada mediante Google verificado genera `trialWhatsAppAlert` al persistir la cuenta. Se guarda junto con el alta, antes de intentar enviar. Funciona tanto con popup como con redirección. Las cuentas anteriores no se notifican retrospectivamente. Una visita anónima o una solicitud de demo no activa el evento.

No cambia equipos, jugadores, partidos, pagos, licencia ni fechas de prueba. No modifica esquema de Supabase: usa el registro de cuenta existente, con control de revisión para cada cambio del aviso.

## Meta y secretos

El WhatsApp personal del administrador es el DESTINO. No desvincularlo ni migrarlo como emisor. Hace falta un emisor de Cloud API autorizado, token del servidor con permiso de mensajería y plantilla aprobada. El número de test y token temporal sirven para pruebas controladas, no constituyen configuración definitiva.

Configurar en AI Studio/Cloud Run, sin prefijo VITE_:

- `WHATSAPP_TRIAL_ALERTS_ENABLED=true` (solo al estar listo).
- `WHATSAPP_ACCESS_TOKEN`: token del sistema para el emisor; nunca pegarlo en chat, GitHub ni frontend.
- `WHATSAPP_PHONE_NUMBER_ID`: identificador del emisor (no su número de teléfono).
- `WHATSAPP_ADMIN_TO`: destinatario verificado, en formato internacional de solo dígitos. Usar el formato que Meta haya aceptado para la prueba, no modificarlo automáticamente.
- `WHATSAPP_TRIAL_TEMPLATE`: nombre exacto de plantilla aprobada.
- `WHATSAPP_TEMPLATE_LANGUAGE`: idioma exacto de esa plantilla (por defecto `es_AR`).
- `WHATSAPP_GRAPH_VERSION`: versión soportada en la app Meta (por defecto `v25.0`, observada en su panel).

Plantilla sugerida `open_voley_nueva_prueba`, con TRES variables posicionales de texto en el cuerpo, en este orden:

```
OPEN VOLEY: se activó una nueva prueba.
Nombre: {{1}}
Correo: {{2}}
Prueba disponible hasta: {{3}}
Revisá el registro en Administración de OPEN VOLEY.
```

La aprobación/categoría y el costo dependen de Meta. No usar la plantilla de confirmación de pedido del ejemplo como aviso de clientes: sus variables y finalidad son diferentes. El administrador debe autorizar recibir estos avisos. No se envían mensajes al cliente.

## Uso y seguridad

En Configuración → Administración comercial aparece «Avisos de nuevas pruebas por WhatsApp». Muestra campos faltantes, destino enmascarado y los últimos 100 avisos. Solo una sesión de administrador puede consultar o procesarlos. Los secretos no se devuelven al navegador. La dirección de Graph es fija, no acepta URL/destino desde peticiones del cliente.

El alta intenta el envío con un límite de 8 segundos; un fallo del proveedor no rechaza el acceso Google. Los pendientes pueden enviarse al siguiente ingreso de esa misma cuenta o con «Enviar hasta 5 pendientes / rechazados» desde Administración. No se promete un trabajador en segundo plano: no depende de temporizadores que Cloud Run pueda suspender.

Antes del HTTP se reclama el aviso mediante revisión optimista. Un aceptado no vuelve a enviarse. Un 429 queda pendiente con espera de al menos un minuto. Un rechazo explícito 4xx queda rechazado y admite reintento manual. Timeout, 5xx, respuesta ambigua o interrupción después del inicio se consideran inciertos/en curso: no se reintentan automáticamente para reducir duplicados. Revisar Meta antes de repetir manualmente; no hay garantía absoluta de exactamente una entrega porque la API no ofrece una transacción con nuestra base.

«Aceptado por Meta» significa que Graph devolvió ID de mensaje, NO entrega confirmada. El envío saliente no requiere webhook; un webhook firmado para estados de entrega puede incorporarse por separado. No inventar una URL de webhook en Meta antes de implementarla.

## Verificación de producción

1. Publicar el código, registrar emisor, aprobar plantilla y configurar secretos.
2. Revisar estado habilitado en Administración y destinatario correcto.
3. Crear una cuenta de prueba Google NUEVA, distinta del administrador; debe llegar un único aviso con nombre, correo y vencimiento.
4. Volver a ingresar con esa cuenta: no debe llegar otro aviso.
5. Comprobar «Aceptado por Meta» y recepción real en el teléfono; no considerar suficiente el estado del servidor.
6. Comprobar datos anteriores sin cambios. No borrar cuentas ni partidos para provocar una prueba.

Las pruebas automatizadas simulan Graph y Google; no envían WhatsApp reales ni tocan datos de producción.
