import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// añade loading="lazy"/decoding="async" a todas las imágenes del cuerpo (markdown)
function rehypeLazyImages(){
  return (tree)=>{
    const walk=(node)=>{
      if(node.tagName==='img'){
        node.properties=node.properties||{};
        if(node.properties.loading==null) node.properties.loading='lazy';
        if(node.properties.decoding==null) node.properties.decoding='async';
      }
      (node.children||[]).forEach(walk);
    };
    walk(tree);
  };
}

export default defineConfig({
  site: 'https://bloglatrinchera.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: { rehypePlugins: [rehypeLazyImages] },
});
