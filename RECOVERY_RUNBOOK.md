# Recuperación de OPEN VOLEY

Requiere Node 22.16 o superior (se probó con Node 24). Ejecutar desde la carpeta de la aplicación con sus dependencias instaladas. Las herramientas no publican cambios ni restauran encima de datos existentes.

## Datos antiguos del navegador

Con la cuenta administradora, abrir Configuración → Ventas & PRD → Administración y precios → Recuperar datos anteriores de este navegador. Descargar primero una copia y revisar las categorías. Confirmar la pertenencia e importar la selección. Solo se importan categorías conocidas; los identificadores existentes se conservan. Reemplazar el partido activo requiere marcarlo expresamente. Recargar para ver el resultado.

Los originales sin propietario siguen intactos. La recuperación no reconoce automáticamente quién creó esos datos: el administrador debe comprobar su pertenencia. Es local al navegador y perfil donde estaban guardados; no importa datos de otros dispositivos ni archivos de vídeo. El archivo descargado sirve de respaldo revisable; esta entrega no incorpora un importador de archivos externos. Deshacer restaura las categorías locales de la última importación, pero no elimina entrenamientos o montajes ya sincronizados al servidor.

## Copia completa del servidor

Detener la aplicación y sus procesos de render/carga antes de copiar. La API de SQLite conserva los cambios del WAL, pero se necesita detener escrituras para que cuentas, SQLite y vídeos representen el mismo momento. `--offline-confirmed` registra esta confirmación del operador; no detiene ni detecta procesos por sí mismo.

```sh
npm run recovery -- backup --source /srv/openvoley --output /backups/openvoley-2026-10-11 --offline-confirmed
npm run recovery -- verify --input /backups/openvoley-2026-10-11
```

La salida debe ser una carpeta nueva fuera del directorio fuente. Se incluyen `clients_db.json`, `visitors_db.json`, los JSON de entrenamientos/montajes si existen, `openvoley.db` y `.openvoley-video-renders`. Si la base está en otra ruta, configurar `OPENVOLEY_DB_PATH` con su ruta absoluta al ejecutar. Se rechazan enlaces simbólicos. Las carpetas creadas tienen permisos 700 y los archivos 600. No se copia `.env`, código ni secretos del despliegue.

El manifiesto registra tamaño y SHA-256 de cada archivo; la verificación también comprueba integridad SQLite y lectura de los JSON. Los hashes detectan corrupción, no acreditan autenticidad frente a quien pueda modificar la copia y el manifiesto. La copia contiene datos personales y comerciales: protegerla, cifrarla al almacenarla externamente y restringir accesos. Guardar secretos y configuración por separado, en el gestor de secretos del despliegue.

## Restauración de ensayo

```sh
npm run recovery -- restore --input /backups/openvoley-2026-10-11 --output /restore/openvoley-test --offline-confirmed
```

La herramienta verifica todo antes de escribir y exige un destino inexistente. No reemplaza el servidor publicado. Cambia la versión de sesión de las cuentas para que los tokens previos no recuperen acceso. La copia original no se altera.

Para ensayar o activar lo restaurado, usar una copia del código correspondiente, una carpeta de trabajo que contenga estos datos y dependencias, y `OPENVOLEY_DB_PATH` apuntando a la base restaurada. Los JSON y vídeos se leen desde la carpeta de trabajo del servidor. Configurar un `SESSION_SECRET` nuevo y las variables requeridas sin incluirlas en el respaldo. Antes de activar, revisar fechas de acceso, usuarios bloqueados y pagos/reembolsos ocurridos después de la copia; la restauración no consulta ni reconcilia automáticamente Mercado Pago.

Comprobar inicio de sesión de dos cuentas, separación de datos, precios, registro de interesados, entrenamientos/montajes y reproducción de vídeos. Solo después, con el servidor detenido, activar el directorio de datos restaurado y reiniciar. Mantener una copia del estado anterior.

## Pendiente en el despliegue

Esta entrega prueba recuperación con datos sintéticos. Todavía deben configurarse almacenamiento persistente, copias externas, retención y frecuencia, y realizar una restauración real supervisada. Las copias del servidor no incluyen partidos, equipos ni pizarras que existan únicamente en el navegador: respaldar esos datos por separado. No habilitar múltiples instancias mientras las cuentas y otros almacenes JSON dependan de archivos locales.

Referencia de la API de copia: https://nodejs.org/api/sqlite.html#sqlitebackupsource-db-path-options
