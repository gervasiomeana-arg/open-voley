# Activar el guardado permanente de OPEN VOLEY

El código está preparado para Supabase PostgreSQL, pero no está activo hasta completar la configuración y comprobar una migración real. No se crean proyectos ni se cargan claves automáticamente. Se conserva el inicio de sesión Google actual.

## Antes de actualizar la publicación

1. Cada entrenador debe descargar su respaldo en Configuración → Exportaciones & Respaldo. Los equipos, partidos y acciones locales no se eliminan ni se escanean desde otras cuentas durante el cambio.
2. El administrador debe guardar las cuentas actuales **antes de publicar**, porque los archivos del servidor actual pueden perderse con una nueva instancia de Cloud Run. Con la web abierta e iniciada con su cuenta administradora, este fragmento en la consola del navegador descarga el endpoint administrativo ya existente:

```js
const response = await fetch('/api/clients', {credentials:'same-origin'});
if (!response.ok) throw new Error('No se pudo exportar: confirmá la sesión administradora.');
const backup = await response.json();
const url = URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
const link = document.createElement('a');
link.href=url;link.download='OPEN_VOLEY_Migracion_Servidor.json';link.click();URL.revokeObjectURL(url);
```

La copia contiene datos privados de clientes: conservarla fuera de GitHub. Este formato preserva IDs, fechas de prueba, licencias y pagos de las cuentas. Las preferencias comerciales adicionales del servidor se exportan con el nuevo panel; no se puede garantizar recuperarlas después de perder la instancia antigua. Anotar también los precios y exportar interesados antes de publicar.

## Supabase y activación

1. Crear un proyecto exclusivo para OPEN VOLEY. Ejecutar completo `supabase/migrations/20261013_durable_storage.sql` en SQL Editor. Las tablas privadas tienen RLS; las funciones solo admiten `service_role`. El navegador nunca recibe la clave de servicio.
2. Configurar en los secretos del servidor AI Studio / Cloud Run `SUPABASE_URL` (URL HTTPS del proyecto) y `SUPABASE_SECRET_KEY` (la clave privada `sb_secret_...` de Secret keys; solo servidor). No utilizar prefijo `VITE_`. Mantener todavía sin activar `OPENVOLEY_PERSISTENCE`.
3. Publicar el código y abrir Administración → Preparar el almacenamiento permanente. Importar la copia previa de cuentas. Si la base ya contiene registros diferentes, se detiene la importación sin sobrescribirlos. Es una migración inicial, no una restauración destructiva.
4. Exportar también la copia del servidor disponible y migrarla, revisando cualquier conflicto. Cuando hay conflictos de cuentas creadas después del despliegue, detenerse y revisar IDs; no borrar la base ni forzar sobrescrituras.
5. Configurar `OPENVOLEY_PERSISTENCE=supabase` y volver a publicar. Si falla Supabase, el servidor rechaza operaciones; no vuelve a una base efímera ni registra un guardado exitoso.
6. Ingresar con cada cuenta de prueba. La copia local de esa misma cuenta se prepara para subir. Los datos históricos sin dueño o de otro ID requieren revisión manual; no se asignan automáticamente a una persona.
7. Verificar que el indicador muestra «Datos confirmados en la nube», guardar un equipo y un partido, abrir la misma cuenta en otro navegador y confirmar sus registros. Revisar conflictos explícitos; los borrados se almacenan como versiones nulas y no se resucitan automáticamente.
8. Reiniciar/republicar y repetir la comprobación con dos cuentas independientes. Probar también una restauración desde Respaldos por sección.

## Respaldos automáticos

Cada actualización guarda versiones anteriores en PostgreSQL en la misma transacción que el dato. Se conservan 10 versiones recientes y copias diarias de hasta 30 días; el recorte diario ocurre al escribir. Resolver un conflicto usando la nube archiva primero la edición local. Estos historiales protegen contra reemplazos y borrados accidentales, pero están dentro de la misma base.

La copia externa se prepara con `.github/workflows/durable-backup.yml`. En GitHub → Settings → Secrets and variables → Actions:

- Secrets: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPENVOLEY_BACKUP_ENCRYPTION_KEY` (una clave independiente aleatoria de 32+ caracteres; guardarla también fuera de GitHub).
- Variable: `OPENVOLEY_BACKUPS_ENABLED=true`.

El flujo queda apagado hasta configurar esa variable. Ejecutar primero **Run workflow** y confirmar su éxito. Después se programa diariamente a las 06:30 UTC (03:30 Argentina); GitHub puede demorar ejecuciones programadas. No se garantiza ejecución puntual. El snapshot de registros y versiones se crea de forma consistente en PostgreSQL y se exporta por páginas. Cada página y el manifiesto se cifran con AES-256-GCM antes de subirse como artifact, con retención de 30 días. No se escriben datos personales en texto claro en el job. Nunca subir un JSON sin cifrar al repositorio público. Las tablas temporales de exportación se eliminan al terminar; cualquier exportación incompleta pendiente se limpia al preparar una nueva copia después de dos días.

Para revisar una página descargada, usar `node scripts/decryptDurableBackup.mjs archivo.ovbak salida-nueva.json`, con la clave de cifrado en el entorno. El comando no sobrescribe una salida existente y verifica integridad criptográfica. Una restauración completa de desastre requiere revisar el manifiesto, mantener los IDs y reimportar explícitamente a un proyecto de recuperación; no es automática. Conservar también el esquema SQL del repositorio. Antes de vender, comprobar una recuperación completa en un proyecto separado. La copia externa no está «operativa» hasta tener credenciales, un primer artifact y una recuperación verificada.

Los backups gestionados nativos de Supabase dependen del plan contratado. No se presupone que el plan gratuito tenga un historial diario restaurable.

## Alcance y límites

Se guardan cuentas, licencias y pagos de las cuentas; datos comerciales; equipos y jugadores; partidos guardados y activos; acciones; entrenamientos; montajes y pizarras. La identidad se obtiene de la sesión Google verificada, no de un ID enviado por el cliente. La cabecera de cuenta esperada evita subir una cola de una persona después de cambiar la sesión en otra pestaña.

Los **archivos originales de vídeo** no se suben: se preservan registros, cortes y referencias. Las URL `blob:` corresponden al dispositivo y no sirven en otro navegador; hay que volver a adjuntar ese archivo. No prometer respaldo de los MP4 originales con esta etapa.

La primera copia local sigue sujeta a la cuota del navegador. Un fallo de espacio o conexión se informa; el indicador no certifica la nube antes de recibir la confirmación. Los cambios pendientes sobreviven a recargas y se reintentan al recuperar conectividad. No se fusionan silenciosamente dos versiones diferentes de una misma sección. No hay colaboración de varios usuarios sobre el mismo plantel en esta etapa.

## Verificación técnica

`npm run test:durable-storage` usa PostgreSQL real embebido mediante PGlite para validar migración SQL, permisos, CAS, rollback transaccional, aislamiento, restauración, historial, snapshot consistente, cifrado autenticado y reinicio. Pruebas HTTP validan sesión, cuenta esperada y lectura por cuenta vencida. Las pruebas del cliente cubren cola offline, cambios simultáneos, conflictos, copia local archivada, preferencias y borrados. No reemplazan una prueba de Supabase ni del despliegue real.

Ejecutar también lint, build, seguridad, pagos, recuperación, readiness y sincronización heredada. El driver por defecto permanece local durante la preparación. No marcar el punto como activado o garantizado hasta completar la migración y pruebas reales anteriores.

Compatibilidad: se mantiene `SUPABASE_SERVICE_ROLE_KEY` como alternativa para instalaciones heredadas. La nueva clave tiene prioridad si ambas están presentes. Las claves `sb_secret_...` se envían únicamente en `apikey`, sin tratarlas como un JWT en Authorization.

## Si Google no permite ingresar en la vista previa

El dueño del proyecto puede preparar la migración desde el entorno servidor de AI Studio sin una sesión del navegador. No se debilita la autenticación Google ni se habilita una ruta pública.

Adjuntar el archivo privado de cuentas en AI Studio, guardarlo fuera del código publicado, preferentemente `private-migration/OPEN_VOLEY_Cuentas.json`, y ejecutar primero:

```sh
node --import tsx scripts/importServerMigration.ts private-migration/OPEN_VOLEY_Cuentas.json --check
```

El comando valida el JSON, comprueba la conexión y el esquema y detecta conflictos, sin escribir registros. Si responde `success:true`, ejecutar:

```sh
node --import tsx scripts/importServerMigration.ts private-migration/OPEN_VOLEY_Cuentas.json --apply
```

Solo informa cantidades; no imprime cuentas ni secretos. Mantener `OPENVOLEY_PERSISTENCE` desactivado: el comando se detiene si ya está activo. Una segunda ejecución con el mismo archivo es idempotente. Conservar el archivo original descargado fuera de AI Studio; no subirlo a GitHub ni a la carpeta `public`. La importación inicial sigue sin sobrescribir registros diferentes. Comprobar en Supabase la cuenta importada y sus fechas antes de activar o publicar.
