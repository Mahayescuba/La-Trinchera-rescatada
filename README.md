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

## Estructura

- `index.html`: portada.
- `<slug>/index.html`: cada artículo o página (`/totalitarismo-en-cuba/` → `totalitarismo-en-cuba/index.html`).
- `category/`, `tag/`, `author/`, `page/`: listados del blog.
- `feed/index.xml`, `*-sitemap.xml`: feeds y mapas del sitio.
- `wp-content/`, `wp-includes/`: recursos estáticos del tema, plugins y subidas.

## Limitaciones

- Es una copia estática: buscador, comentarios, formularios y el área de administración de
  WordPress no funcionan.
- Solo está lo que Internet Archive llegó a capturar. Algunos recursos nunca fueron archivados
  (por ejemplo, el logotipo `wp-content/uploads/2018/01/Logo--e1533234718419.png`), y esos
  enlaces se dejaron apuntando al dominio original.
- Los recursos externos (Google Fonts, widgets de WordPress.com, Facebook, YouTube, etc.)
  siguen apuntando a sus servidores originales.
