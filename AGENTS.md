# VEXSTON — Instrucciones para Agentes

## Idioma
Responde siempre en español.

## Resumen del proyecto

- Sitio estático multipágina de una firma legal (sin frameworks, sin build pipeline).
- Arquitectura basada en el patrón de `attornia/` (referencia): `index.html` + 18 páginas de área en `areas/` + `404.html`, con CSS y JS externalizados.
- Abre `index.html` directamente en el navegador para previsualizar.

## Roles de archivos

| Archivo | Propósito |
|---------|-----------|
| `index.html` | Landing con todas las secciones (hero, la firma, método, evaluador, áreas, herramientas, compromiso, portal, vídeos, conocimiento, instalaciones, FAQ, zonas, cita). |
| `areas/*.html` | 18 páginas SEO individuales (una por área de práctica), solo en español. |
| `404.html` | Página de error personalizada. |
| `css/style.css` | Todos los estilos, incluidos los de las páginas de área, 404, abogados, vídeos, FAQ y zonas. |
| `js/data.js` | Datos: `AREAS` (18 × 3 idiomas), `UI`, `I18N`, `COURT`, `FMT`, `CTXT`, `LANG`, `VIDEOS`, `ABOGADOS`. Debe cargar antes que `app.js`. |
| `js/app.js` | Toda la lógica JS: renderizado de grilla/cintillo/mega-menú/select, i18n, hero, risk quiz, portal, calculadoras, chat, login, vídeos y el router de abogados (`?view=`). |
| `assets/images/` | Logo (claro/oscuro), favicons, imagen OG y galería. |
| `robots.txt`, `sitemap.xml`, `.htaccess` | SEO e infraestructura (dominio `www.vexston.com`). |

## Reglas críticas

1. **Orden de carga de scripts**: `js/data.js` DEBE preceder a `js/app.js`. `app.js` lee `AREAS`, `UI`, `I18N`, `COURT`, `CTXT`, `VIDEOS` y `ABOGADOS` definidos en `data.js`.
2. **Los datos viven en `data.js`**: al agregar o modificar texto visible traducible, añade la clave a `I18N` (es/en/pt). El español se captura automáticamente del HTML al cargar (`snapshot()`), pero en/pt deben añadirse a mano.
3. **Renderizado dinámico en HTML**: el cintillo rotativo, la grilla de áreas, el mega menú de áreas y el select de "Área de práctica" se construyen por JS desde `AREAS`. No hardcodees esto en HTML.
4. **Navegación de áreas**: las tarjetas de la grilla y los ítems del mega menú apuntan a `areas/<id>.html` (páginas reales). No existe ya el modal de detalle de área.
5. **Páginas de área**: se generan con el patrón de `areas/penal.html` (breadcrumb, h1 SEO, sub-servicios, FAQ, otras áreas, strip de contacto, CTA). Son solo en español.
6. **Funcionalidades placeholder**: el modal de login, el envío del formulario de cita, el chat, el buscador jurídico y las calculadoras son demos/placeholders. No hay backend real. El buscador y los formularios usan `preventDefault()` / no envían.
7. **Contactos placeholder**: los datos de contacto del sitio (teléfonos, WhatsApp, correo) son provisionales. Cualquier actualización debe replicarse en `index.html`, las 18 páginas de área y `404.html`.

## Contenido SEO de áreas

El contenido por área (título SEO, sub-servicios y FAQ) está redactado en el archivo auxiliar `gen_content.py` (fuera del repo, en `/var/folders/.../opencode`). Si editas el contenido de las páginas, edita también:
- El Schema `Service`/`FAQPage`/`BreadcrumbList` del `<head>` de cada página de área.
- El `@graph` de Services y el `FAQPage` en `index.html`.
- `sitemap.xml` si cambia la lista de URLs.