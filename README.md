# La Trinchera (rescatada)

Copia estática del sitio **La Trinchera** (`www.trincheracuba.com`), rescatada desde el
[Wayback Machine](https://web.archive.org/web/20221204123508/https://www.trincheracuba.com/)
de Internet Archive.

## Qué contiene

- Todas las páginas HTML que Internet Archive tenía guardadas del dominio
  (artículos, categorías, etiquetas, autores, paginación, feeds RSS, sitemaps).
- Las imágenes, hojas de estilo, scripts y fuentes que estaban archivadas, incluyendo
  imágenes que solo existían en el CDN de WordPress (`i0.wp.com`, `i1.wp.com`, `i2.wp.com`).
- Para cada URL se eligió la captura más cercana al **4 de diciembre de 2022**.

## Cómo se preparó

1. Se listaron todas las URLs con la API CDX de Internet Archive.
2. Se descargó el contenido original de cada captura (modo `id_`, sin la barra del Wayback Machine).
3. Se reescribieron los enlaces absolutos a `trincheracuba.com` y al CDN `i*.wp.com` como rutas
   relativas, de modo que el sitio se puede navegar abriendo `index.html` en el navegador o
   publicándolo con GitHub Pages.
4. Los enlaces a recursos que Internet Archive no tenía se dejaron apuntando al Wayback Machine
   (`https://web.archive.org/web/20221204123508/https://www.trincheracuba.com/...`).
5. Algunos archivos venían comprimidos en gzip tal cual los guardó el archivo; se descomprimieron.
6. A 75 páginas les faltaba una hoja de estilo agregada por el plugin Autoptimize (cada versión
   tiene un hash distinto y no todas se archivaron); se sustituyó por la versión archivada
   equivalente más usada, así que esas páginas se ven con el mismo tema.

## Estructura

- `index.html`: portada.
- `<slug>/index.html`: cada artículo o página (`/totalitarismo-en-cuba/` → `totalitarismo-en-cuba/index.html`).
- `category/`, `tag/`, `author/`, `page/`: listados del blog.
- `feed/index.xml`, `*-sitemap.xml`: feeds y mapas del sitio.
- `wp-content/`, `wp-includes/`: recursos estáticos del tema, plugins y subidas.

## Limitaciones

- Es una copia estática: buscador, comentarios, formularios y el área de administración de
  WordPress no funcionan.
- Solo está lo que Internet Archive llegó a capturar. Nunca se archivaron, por ejemplo, el
  logotipo `wp-content/uploads/2018/01/Logo--e1533234718419.png`, las páginas de autor
  (`/author/hayesmartinez/`), el feed de comentarios y unas pocas imágenes de artículos.
  Esos enlaces apuntan al Wayback Machine.
- Las variantes de página con parámetros (`?shared=email`, `?replytocom=`) se omitieron a propósito.
- Los recursos externos (Google Fonts, widgets de WordPress.com, Facebook, YouTube, etc.)
  siguen apuntando a sus servidores originales.

## Segunda tanda: rescate desde el dominio sucesor

El sitio resucitó más tarde bajo el dominio **`desdetutrinchera.com`**, con las mismas rutas de
artículo. El Internet Archive sí capturó muchos artículos bajo ese dominio nuevo que nunca había
guardado del dominio original. Gracias a eso se recuperaron **136 artículos adicionales** que en
la primera pasada figuraban como perdidos.

- De los ~1.000 artículos publicados, quedan **111 sin recuperar** (`articulos-no-recuperados.md`):
  no existen en ninguna copia accesible de Internet Archive, bajo ninguno de los dos dominios.
- El dominio `desdetutrinchera.com` sigue vivo pero está protegido por Cloudflare, así que no se
  puede acceder a su contenido en vivo desde este entorno.

## Tercera tanda: rescate desde reposts, Medium y Telegram

De los 111 artículos que no estaban en ningún archivo web, se recuperaron **17 más** desde
copias externas accesibles (ver `articulos-rescatados.html`):

- **Reposts de terceros**: rebelión (rebelion.org) y La Joven Cuba, que republicaron con permiso
  varios textos, sobre todo los de economía y marxismo de Miguel Alejandro Hayes.
- **Espejo en Medium** del propio medio (`medium.com/la-trinchera-ahora`).
- **Versiones Telegraph** que La Trinchera publicaba en su canal de Telegram (`t.me/trincheracuba`)
  como vista instantánea de cada artículo.

Cada artículo rescatado se guardó como página propia con una nota de procedencia y el enlace a su
fuente. El texto es el que devolvió literalmente cada copia, sin resumir ni completar nada.

Quedan **94 artículos irrecuperables** (`articulos-no-recuperados.md`): sin archivo web, sin repost
accesible y sin espejo en Telegram. El sitio sucesor sigue vivo pero tras Cloudflare, inaccesible
desde este entorno.

### Balance final del rescate

De los ~1.000 artículos publicados por La Trinchera:

- **753** rescatados del Internet Archive (dominio original).
- **136** rescatados del Internet Archive (dominio sucesor `desdetutrinchera.com`).
- **17** rescatados de reposts, Medium y Telegram.
- **94** sin copia accesible en ninguna parte.

Total recuperado: **906 de ~1.000 artículos (más del 90 %).**
