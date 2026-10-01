import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), context);
const books = context.window.IL_BOOKS;
const origin = 'https://theidealabstudio.com';
const author = 'Kevin Dean Rosenkrans';
const email = 'mailto:donsol@theidealabstudio.com';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const icon = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

const cards = books.map(b => `<article class="book" data-shelf="${esc(b.shelf)}">
  <a class="cover artwork ${esc(b.id)}" href="/${b.slug}/" aria-label="About ${esc(b.title)}"><img src="${esc(b.cover)}" alt="${esc(b.title)} — cover by ${author}" width="600" height="900" loading="lazy" decoding="async"></a>
  <div class="book-copy"><h3 class="book-title"><a href="/${b.slug}/">${esc(b.title)}</a></h3><span class="status ${esc(b.group)}">${esc(b.status)}</span><p class="genre">${esc(b.kind)}</p><p>${esc(b.blurb)}</p>
  <div class="book-actions">${b.sample ? `<a class="btn primary small" href="/${esc(b.sample)}" aria-label="Read sample of ${esc(b.title)}">Read sample</a>` : `<span class="sample-pending">Opening chapter being recovered.</span><a class="btn primary small" href="/${b.slug}/">About the book</a>`}</div></div>
</article>`).join('\n');

let home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const block = `<!-- CATALOG:start --><div class="book-grid" id="bookGrid">${cards}</div><!-- CATALOG:end -->`;
if (home.includes('<!-- CATALOG:start -->')) home = home.replace(/<!-- CATALOG:start -->[\s\S]*?<!-- CATALOG:end -->/, block);
else home = home.replace('<div class="book-grid" id="bookGrid"></div>', block);
home = home.replace(/\s*<!-- Shown only when JavaScript[\s\S]*?<\/noscript>/, '');
const graph = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const structured = JSON.parse(home.match(graph)[1]);
structured['@graph'].find(n => n['@type'] === 'ItemList').itemListElement.forEach((item, i) => {
  item.item.url = `${origin}/${books[i].slug}/`;
  item.item.image = `${origin}/${books[i].cover}`;
});
home = home.replace(graph, `<script type="application/ld+json">${json(structured)}</script>`);
fs.writeFileSync(path.join(root, 'index.html'), home);

for (const b of books) {
  const url = `${origin}/${b.slug}/`;
  const image = `${origin}/${b.cover}`;
  const schema = {'@context':'https://schema.org','@type':'Book',name:b.title,url,image,author:{'@type':'Person',name:author,url:`${origin}/#studio`},description:b.blurb,inLanguage:'en',genre:b.kind};
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b.title)} — ${author}</title>
<meta name="description" content="${esc(b.blurb)}"><link rel="canonical" href="${url}"><meta name="theme-color" content="#12101a">
<link rel="icon" type="image/svg+xml" href="../favicon.svg"><link rel="stylesheet" href="../base.css?v=15"><link rel="stylesheet" href="../components.css?v=14">
<meta property="og:type" content="book"><meta property="og:site_name" content="The Idea Lab Studio"><meta property="og:title" content="${esc(b.title)} — ${author}"><meta property="og:description" content="${esc(b.blurb)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta property="og:image:alt" content="${esc(b.title)} book cover">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(b.title)} — ${author}"><meta name="twitter:description" content="${esc(b.blurb)}"><meta name="twitter:image" content="${image}">
<script type="application/ld+json">${json(schema)}</script></head><body>
<a class="skip" href="#main">Skip to content</a><header class="topbar"><a class="brand" href="../" aria-label="The Idea Lab Studio home"><span class="sunmark">${icon}</span><span>THE IDEA LAB <b>STUDIO</b></span></a><nav class="book-nav" aria-label="Primary"><a href="../#books">All books</a><a href="${email}">Contact</a></nav></header>
<main id="main"><article class="section book-detail"><div class="detail-art"><img src="../${b.cover}" width="600" height="900" alt="${esc(b.title)} — cover by ${author}"></div><div class="detail-copy"><p class="eyebrow">${esc(b.shelf === 'kids' ? 'FOR KIDS' : b.shelf === 'memoir' ? 'MEMOIR & PERSONAL GROWTH' : 'FICTION')}</p><h1>${esc(b.title)}</h1><p class="byline">By ${author}</p><span class="status ${b.group}">${esc(b.status)}</span><p class="genre">${esc(b.kind)}</p><p class="lede-sm">${esc(b.blurb)}</p>
${b.contentNote ? `<p class="content-note">${esc(b.contentNote)}</p>` : ''}
${b.id === 'harness' ? '<p>The feature screenplay is complete. The novel has a 38-chapter structure; its missing chapters are being recovered and assembled.</p>' : ''}
<div class="detail-actions">${b.sample ? `<a class="btn primary" href="../${b.sample}">Read sample</a><a class="pdf-link" href="../${b.samplePdf}" download>Download sample PDF</a>` : '<p class="sample-pending">The opening chapter is being recovered. A novel sample will appear here when it is available.</p>'}</div>
<div class="reader-contact"><h2>Want to hear more?</h2><p>Ask Don Sol about this book or its release.</p><a href="${email}?subject=${encodeURIComponent(b.title + ' — release news')}">donsol@theidealabstudio.com</a></div></div></article></main>
<footer><a href="../#books">Explore the catalog</a><small>© ${new Date().getFullYear()} ${author} · The Idea Lab Studio</small></footer></body></html>`;
  const directory = path.join(root, b.slug);
  fs.mkdirSync(directory, {recursive:true});
  fs.writeFileSync(path.join(directory, 'index.html'), html);
}
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url>${books.map(b => `<url><loc>${origin}/${b.slug}/</loc></url>`).join('')}</urlset>\n`);
console.log(`Built ${books.length} static catalog cards and book pages.`);
