# Revisión desde el uso del entrenador — 16 de octubre de 2026

## Hallazgos y cambios

- El Centro del Partido mezclaba ambos equipos en sus porcentajes. Ahora el selector de equipo aplica a los indicadores, las muestras y los jugadores destacados. Se muestra el numerador y denominador de ataque.
- OPEN AI mezclaba equipos y elegía una prioridad automática desde tres acciones de un fundamento, incluso cuando era el único fundamento observado. Se retiró esa recomendación genérica. El resumen descriptivo y la evidencia corresponden al equipo seleccionado.
- El contexto de la consulta incluye el equipo seleccionado, el estado del registro y una instrucción explícita para distinguir observaciones de hipótesis y no asumir cobertura completa desde el marcador.
- Si hay menos acciones que puntos sumados en el marcador, se identifica el registro como parcial. Un número mayor de acciones **no** certifica cobertura completa: un rally puede tener muchos contactos. No se cambian marcadores ni registros históricos.
- El acceso al análisis ya no anuncia un informe listo sólo porque terminó el encuentro. El informe avanzado exige el mínimo de apertura existente (20 acciones), ahora por equipo y filtro de set. Ese mínimo no equivale a suficiencia estadística: cada sección conserva sus requisitos específicos.
- Se ajustaron los títulos principales para describir las funciones de OPEN VOLEY, retirando las atribuciones de metodología y estándar de terceros del recorrido revisado. La portada de IA distingue consultas y herramientas experimentales de video.

## Verificación

`npm run lint`, `npm run test:coach-review`, analytics, evidencia, contexto de OPEN AI, `npm run test:ai-generation`, `npm run build` y `npm run test:landing` pasaron.

La nueva regresión renderiza los componentes y prueba equipos con la misma camiseta, resultados de ataque diferentes, ausencia de consejo genérico con una muestra pequeña, advertencia de registro parcial, incertidumbre de cobertura con muchos contactos y bloqueo de informe del rival aunque el local supere el mínimo.

## Límite operativo

La última consulta real en producción devolvió saturación del servicio de IA. No hay una respuesta generada exitosa que permita validar ese servicio. Este cambio no modifica proveedor, modelo, credenciales, cobros ni persistencia. Los cambios de interfaz requieren sincronizar y publicar en AI Studio; resta verificarlos allí y durante un encuentro real en tablet.
