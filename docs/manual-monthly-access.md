# Habilitación mensual manual

Administración → historial de clientes incorpora **Habilitar 30 días**. La confirmación pide verificar el pago. Usa la extensión existente: si venció, otorga 30 días desde la habilitación; si queda saldo, lo conserva y agrega 30 días. Un error de guardado se informa y pide actualizar antes de reintentar.

La llamada histórica `resetDate: true` ahora inicia un período de 30 días sin cambiar `firstLoginDate` ni reiniciar la prueba gratuita. El botón Reset fue reemplazado por la extensión mensual para no quitar días vigentes. No se modifica ninguna cuenta hasta una acción administrativa.

La pantalla vencida diferencia la prueba inicial de 7 días de una renovación vencida, ofrece planes y el enlace público de Mercado Pago, y explica la verificación manual. **Actualizar acceso** obtiene el estado real del servidor; un click, un comprobante o una URL no habilitan la licencia. Se unifica el destino de pago en una constante pública. El modal de planes queda por encima de la pantalla de vencimiento.

El contador visual se actualiza cada 30 segundos y al recuperar foco para mostrar el vencimiento aunque la app siga abierta. La autorización del backend se mantiene, así como la excepción de administrador. Los datos de equipos, jugadores y partidos no se cambian. El pago por enlace no genera un aviso de acreditación dentro de OPEN VOLEY ni un débito automático.

## Validación

- `npm run test:manual-access`: cuenta vencida hace 100,5 días, 30 días exactos, límite final, saldo vigente de 5 + 30 días, compatibilidad de reset, conservación de fecha de alta y pantalla de renovación sin acreditación automática.
- Regresión del enlace externo, TypeScript, seguridad de lanzamiento y aislamiento de datos, build y landing.
- Sin pagos reales ni modificaciones a cuentas de producción. Pendiente publicación y prueba del flujo por un administrador en producción.
