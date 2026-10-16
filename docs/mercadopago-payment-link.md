# Enlace de cobro de Mercado Pago

Se agrega el enlace facilitado por el propietario, https://mpago.la/34czrYP, en Planes y precios → Pago por enlace de Mercado Pago. Se conserva el flujo de preferencias existente para los planes.

El enlace se ofrece a cuentas identificadas, con el correo de OPEN VOLEY visible para facilitar la conciliación con el comprobante. Abre una pestaña nueva con `noopener noreferrer` y explica que la administración debe verificar el pago antes de activar el acceso. No ejecuta el callback de pago aprobado, no cambia licencias y no interpreta visitas o parámetros de retorno como prueba de pago.

No se pudo consultar el destino con la herramienta de búsqueda: no se verificaron importe, moneda, titular, concepto ni condiciones del cobro. Por eso no se vincula este enlace a ninguno de los precios/planes del catálogo. No se hicieron pagos reales. La app no configura cobros recurrentes mediante esta opción.

Validación: regresión SSR del enlace para usuario identificado/anónimo y ausencia de activación, TypeScript, compilación de producción y comprobaciones de landing.
