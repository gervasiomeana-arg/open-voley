# Acceso con Google sin ventanas emergentes

El ingreso habitual por popup sigue disponible. El botón **Ingresar sin ventana emergente** abre `/ingresar`, una página independiente que usa el flujo oficial de Google Identity Services `ux_mode: redirect`.

## Configuración de Google (una vez)

En Google Cloud Console, abrir el cliente OAuth web existente de OPEN VOLEY (el mismo `GOOGLE_CLIENT_ID`, sin crear otro cliente). En **URIs de redireccionamiento autorizados**, agregar exactamente:

```
https://open-voley-2026.ai.studio/api/auth/google/redirect
```

Guardar. Conservar los orígenes JavaScript autorizados existentes. No agregar `agent.tinyfish.ai`: Google autentica a OPEN VOLEY, no a la plataforma que muestra el navegador. No se necesita un nuevo secreto ni cambiar `SESSION_SECRET`.

Si la aplicación también se sirve directamente desde otro origen (sin redirigir al dominio anterior), autorizar el mismo callback en ese origen. El callback debe coincidir exactamente, incluido esquema y ruta, como exige Google:
https://developers.google.com/identity/gsi/web/reference/js-reference#login_uri

## Publicación y prueba

1. Sincronizar este código en AI Studio y publicar.
2. En la configuración del perfil de Tinyfish, abrir `https://open-voley-2026.ai.studio/ingresar`.
3. Pulsar el botón oficial de Google, completar la autenticación y la verificación de identidad solicitada por Google.
4. Comprobar que regresa al panel de OPEN VOLEY. Guardar el perfil de Tinyfish únicamente después de entrar.

Google puede seguir solicitando segundo factor. Esta corrección no desactiva ni reemplaza ese control. Una restricción de Google a un navegador remoto debe resolverse mediante sus métodos admitidos; no se debe eludir con cookies de sesión copiadas, tokens fabricados ni accesos especiales.

## Seguridad y límites de validación

El backend valida el doble envío de `g_csrf_token`, verifica el token de identidad con `OAuth2Client.verifyIdToken` y la audiencia `GOOGLE_CLIENT_ID`, y emite la misma sesión HttpOnly existente. Respeta bloqueo de cuentas y fechas de prueba previas. Los tokens nunca viajan en la URL de retorno; la salida es fija `/` con HTTP 303. El callback comparte límites de tamaño y frecuencia con el acceso por popup.

`npm run test:google-redirect` cubre CSRF, token rechazado, coincidencia de cuenta Google, cuenta bloqueada, continuidad de prueba, retorno seguro y límites compartidos. Estas pruebas no equivalen a una autenticación real en Google: esta última requiere la configuración del cliente OAuth, publicación y una sesión completada por el usuario.
