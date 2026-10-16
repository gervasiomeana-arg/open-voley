# Revisión funcional de OPEN VOLEY — 15/10/2026 (Argentina)

Estado: revisión técnica completada; producto completo no certificado al 100 %.

Continuación: [correcciones de competiciones, vídeo e IA del 16/10 UTC](functional-followup-20261016.md). Los pendientes de este informe describen su fecha original.

## Comprobaciones realizadas

- [x] Último main revisado: 3a622f5, sin cambios posteriores al PR #67.
- [x] Publicación responde HTTP 200, tiene un H1 e incorpora la entrada pública separada.
- [x] /api/health responde 200. Cuentas, sesión y datos privados rechazan acceso anónimo con JSON 401.
- [x] Tipado, compilación y comprobaciones de portada pasan.
- [x] Las 34 suites existentes pasan. Con las dos nuevas regresiones pasan 36 suites.
- [x] Pruebas de rotaciones, sets, líberos, sustituciones, correcciones de dorsales, estadísticas, Player 360, contexto de IA, evidencia y entrenamiento pasan con fixtures locales.
- [x] Pruebas de sesiones, administración, licencias, aislamiento, conflictos, recuperación y sincronización offline pasan en entorno aislado.
- [x] La copia real de GitHub Actions 38463346105 se descifró en memoria, se validaron manifiesto/páginas y se restauró en PostgreSQL PGlite aislado. Coinciden valores y revisiones de 9 registros y 5 versiones, incluida una cuenta y datos de un usuario. No se escribió en Supabase ni se imprimieron identidades/valores privados. Los archivos cifrados temporales se eliminaron después.
- [x] Se consultaron las versiones exactas del bun.lock contra el servicio de avisos del registro npm. Tras actualizar source-map-js a 1.2.2, no devolvió avisos para las 290 versiones consultadas. No es garantía de ausencia de vulnerabilidades ni prueba del árbol instalado en Cloud Run.

## Errores corregidos

1. El panel de preparación exigía SQLite aunque el driver activo fuera Supabase. Ahora la API y el CLI verifican el RPC de disponibilidad y el esquema esperado; configurar un adaptador no basta para marcarlo correcto. Los respaldos externos siguen siendo una comprobación separada.
2. El estudio de tarjetas sustituía ceros por cifras de muestra, mezclaba rivales con el mismo dorsal y usaba porcentajes, resultado y trayectorias fijos. Ahora calcula sobre acciones del equipo/jugador seleccionado, conserva ceros, informa denominadores ausentes y muestra zonas realmente registradas.
3. Los sets ganados ya no se infieren por estar ganando un set incompleto. El marcador y parciales se obtienen del partido; no se presenta un partido en curso como resultado final oficial.
4. Descargar Tarjeta HD solo mostraba un alert. Ahora prepara una imagen SVG con los datos reales y genera un PNG descargable en formato vertical, cuadrado u horizontal. El resumen realmente se copia al portapapeles y no informa éxito si falla.
5. La pizarra sobre imágenes no se redibujaba al abrir su pestaña. Se agregó esa dependencia y un mensaje de error al exportar una imagen que el navegador no permite leer.
6. Cargar el vídeo de ejemplo reemplazaba cortes existentes sin confirmación. Se solicita confirmación cuando hay cortes guardados.
7. La opción comercial de transferencia enviaba a un WhatsApp de ejemplo. Se reemplazó por un formulario con consentimiento que registra la consulta para administración; no cobra ni activa licencias y no envía correo automáticamente.
8. Se actualizó source-map-js 1.2.1 a 1.2.2 por el aviso GHSA-68fv-2mgg-jv7q. También se incorporó al lockfile la dependencia de pruebas PGlite que ya estaba declarada en package.json pero faltaba en bun.lock.

Pruebas DOM adicionales con servicios simulados: tarjetas sin valores ficticios, enlace de descarga PNG (codificador canvas simulado), copia real del resumen, marcador en curso, zonas vacías y envío de consulta por transferencia. Estas pruebas no sustituyen la exportación gráfica en Chrome/tablet real.

## Bloqueos y verificaciones que siguen pendientes

- [ ] Mercado Pago: la publicación devuelve isConfigured:false. La lógica de pagos pasa pruebas, pero todavía no se probó compra real/sandbox con el proveedor desplegado. Mobbex y débito mensual automático no están integrados.
- [ ] Competiciones es una demostración con datos de ejemplo y estado en memoria. Crear un torneo no persiste al salir. Se identifica explícitamente en pantalla; no se considera terminado ni listo para gestionar una liga real.
- [ ] Probar Google real, cuenta nueva, vencimiento a 7 días, bloqueo y renovación con dos cuentas independientes en la publicación actual. No aceptar datos del navegador como prueba de identidad.
- [ ] Reemplazar las claves de Supabase y respaldo que quedaron expuestas en capturas/chat mediante un cambio coordinado. Conservar las claves históricas que sean necesarias para descifrar copias anteriores; actualizar consumidores antes de revocar la clave de servicio anterior.
- [ ] Confirmar datos de ambos entrenadores y cuentas de origen; la copia restaurada contiene una cuenta y no acredita una migración de todos los pilotos.
- [ ] La restauración real realizada es local y aislada sobre la copia del 13/10. Falta ensayar recuperación operativa a un proyecto Supabase separado y verificar el respaldo programado más reciente.
- [ ] Probar un partido completo en celular/tablet reales, incluidos controles táctiles, orientación, PDF/impresión, guardado y reapertura.
- [ ] Confirmar credencial/modelo y consulta real de IA en producción. Las pruebas verifican contexto y cálculos, no disponibilidad del proveedor ni exactitud de una respuesta generada.
- [ ] Verificar FFmpeg desplegado y generar un MP4 real. Fuentes de vídeo y renders siguen usando archivos temporales del servidor y no están incluidos en el respaldo PostgreSQL. Las referencias a vídeos locales requieren volver a adjuntar el original en otro dispositivo.
- [ ] Verificar contacto de soporte, privacidad/condiciones, entrega de consultas y que todas las prestaciones anunciadas por los planes, especialmente equipos/licencias institucionales y accesos simultáneos, correspondan al producto operativo.
- [ ] Publicar estas correcciones desde AI Studio y repetir las verificaciones afectadas. Integrar código en GitHub no actualiza por sí solo la publicación.

No se atribuye un porcentaje global ni se presenta una prueba simulada como operación real.
