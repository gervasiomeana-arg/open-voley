# OPEN VOLEY: Visión de juego

Approved direction: sports editorial + illustrated product. Navy (#080e1a), warm ivory (#f6f0e5), golden yellow (#ffbf24), condensed Barlow headlines. Layout variance 7, motion intensity 4, visual density 3. Native CSS and existing React/Lucide dependencies; no new runtime packages.

The previous landing used green/lime tokens and a static product drawing. This redesign follows the owner's approved navy/yellow concept, retains existing section anchors, Google login/trial callbacks, plans callback, visitor event and demo form fields/consent.

## Animation

The public court illustrates serve, reception, attack and point. It uses sample data only, does not read a user's roster or match, and never records actions. Three front-row players face the shared net on each side. Setters are yellow and liberos are outside the endlines. There is a pause control. The timer stops offscreen and is disabled for reduced motion; media listeners, observer and timers are cleaned up. Entry and section reveals respect reduced motion and leave server-rendered content visible before JavaScript.

The backdrop is a generated illustration and is not presented as an actual customer match. It is served locally as an approximately 48 KB WebP. Barlow Condensed is self-hosted, with its SIL Open Font License included.

## Public HTML and index files

The production build pre-renders the same public landing component into index.html. The existing client App replaces the initial public markup after loading, then retains its established session and account flows. This is build-time public rendering, not per-account server rendering; no account data or credentials are embedded. Exactly one H1 remains in the document. The build fails if the root placeholder or H1 invariant changes.

Canonical, sitemap and structured data use the current actual serving URL, https://open-voley-2026.ai.studio/. openvoley.com currently forwards to that address. If the custom domain later serves the app directly, update all three consistently. robots.txt excludes API paths from crawling; this is not an access control. Public JSON-LD describes a WebApplication without invented reviews or hardcoded prices.

## Validation

Run npm run lint, npm run build, npm run test:landing, npm run test:launch-security and npm run test:readiness. Validate sitemap as XML and production HTTP content types. Build-time checks cover initial headings/content, consent, canonical/schema consistency, local asset resolution and index files.

Browser visual QA and Lighthouse need to be completed on the deployment: mobile 360/390px, tablet portrait/landscape, desktop, pause and reduced-motion behavior, Google account selection, plans and successful demo submission. Browser control is unavailable in this managed environment. No new loading-speed score is claimed: the audit's approximately 23-second HTTP request and the unavailable PageSpeed run remain separate follow-up measurements. The app bundle still triggers Vite's large-chunk warning.
