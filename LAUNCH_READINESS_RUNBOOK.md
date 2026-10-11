# Comprobación del despliegue

## Preparar y actualizar

1. Obtener el código de main y guardar una copia verificable de los datos antes del cambio. Mantener el volumen persistente de SQLite, cuentas y vídeos; no sustituirlo por el directorio temporal del build.
2. Configurar los secretos del servidor según .env.example. Usar Node 22.16 o superior. En producción son obligatorios SESSION_SECRET de 32+ caracteres, GOOGLE_CLIENT_ID, ADMIN_EMAILS con correos completos y APP_URL HTTPS. Mercado Pago e IA requieren sus credenciales para esas funciones.
3. Configurar VITE_GOOGLE_CLIENT_ID antes de compilar. Debe coincidir con GOOGLE_CLIENT_ID. Un cambio posterior de la variable del navegador requiere compilar otra vez.
4. Ejecutar `npm run build`. Publicar dist junto con server-build/server.cjs y server-build/client-build.json. El archivo de metadatos contiene fecha e identificador público de Google, nunca secretos. Mantenerlo fuera de la carpeta pública. El servidor debe poder leerlo.
5. Iniciar con `npm start`, NODE_ENV=production, configuración y volumen persistente. Desactivar ALLOW_IFRAME_PREVIEW en el dominio público; solo el valor literal true activa la excepción para vistas previas.
6. Ejecutar `npm run check:launch` desde la carpeta de la aplicación, con sus fuentes, dependencias y variables del despliegue. El comando usa el estado del repositorio de entrenamientos y puede abrir/inicializar SQLite como el servidor. Un resultado correcto comprueba configuración, no conexión o validez de servicios externos.
7. Ingresar con Google y abrir Configuración → Ventas & PRD → Administración y precios → Preparación para demos y ventas. Repetir pruebas reales y registrar solo las que se realizaron.

La integración de un PR en GitHub no prueba que AI Studio haya recompilado o actualizado la aplicación publicada. Estas instrucciones deben ejecutarse en el despliegue utilizado. No se incluyen claves, correos administrativos reales ni valores privados en la documentación.

## Qué detecta el panel

Comprueba modo producción, presencia/longitud de firma de sesión, Google en servidor y coincidencia con el cliente compilado, formato de correos administradores, URL HTTPS, presencia de credenciales de Mercado Pago/IA y secreto de webhook, protección de frames y estado SQLite de entrenamientos.

No revela los valores de esas variables. No consulta Google, Mercado Pago ni Gemini para comprobarlas. Una clave presente puede ser inválida o del entorno incorrecto. El estado SQLite no demuestra que exista un volumen persistente. El chequeo no reemplaza la auditoría de dependencias ni las pruebas externas.

## Registro de pruebas

Las pruebas de dos cuentas, pago sandbox, webhook/reversión, reinicio/redeploy, restauración externa, privacidad/soporte, dispositivos, dependencias y funciones de planes comienzan pendientes. Marcar las realizadas y describir el ensayo sin secretos en las notas. El registro se guarda en SQLite con fecha, cuenta administradora y fecha del build.

Cuando cambia la fecha del build, la pantalla deja las casillas pendientes para repetir las pruebas; conserva la fecha y notas anteriores como referencia. Los cambios de secretos, permisos del proveedor o volumen sin recompilar también requieren repetir pruebas, aunque el build sea el mismo. El registro es una declaración del administrador, no evidencia automática de que los ensayos ocurrieron ni una habilitación de ventas.

Los servicios siguen disponibles según sus propios controles. La pantalla no publica la app ni habilita cobros de forma automática. Para una apertura comercial faltan las validaciones reales marcadas como pendientes en LAUNCH_CHECKLIST.md.
