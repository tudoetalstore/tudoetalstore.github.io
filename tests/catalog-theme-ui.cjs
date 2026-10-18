const {JSDOM}=require('jsdom');const fs=require('fs');const assert=require('node:assert/strict');
const root=__dirname+'/../';
function page(url){return new JSDOM('<body><header class="catalog-top"><a class="catalog-brand"><img src="assets/icon.svg"></a><button id="cartButton">Buy</button></header><main><section class="catalog-hero"><div class="hero-copy"><p class="eyebrow">ORIGINAL</p><h1>Original title</h1><p>Original copy</p></div><div class="hero-seal"><b>Original seal</b></div></section><nav id="catalogSections"></nav><section class="catalog-tools"><div class="search-wrap"><input id="catalogSearch"></div></section><div id="catalogGrid">Unchanged products</div></main>',{url,runScripts:'outside-only',pretendToBeVisual:true});}
(async()=>{
 const preview=page('https://example.invalid/?preview_theme=natal&title=%3Cimg%20src=x%20onerror=alert(1)%3E');
 preview.window.eval(fs.readFileSync(root+'catalog-theme.js','utf8'));
 assert.equal(preview.window.document.body.dataset.catalogTheme,'natal');assert.equal(preview.window.document.querySelector('h1 img'),null);
 let clicks=0;preview.window.document.querySelector('button').onclick=()=>clicks++;preview.window.document.querySelector('button').click();assert.equal(clicks,0);preview.window.close();
 const dom=page('https://example.invalid/'),w=dom.window,intervals=[];let data={theme:'natal',title:'',message:'',starts_at:null,ends_at:new Date(Date.now()+10000).toISOString(),server_time:new Date().toISOString()};
 w.setInterval=f=>{intervals.push(f);return intervals.length;};w.client={rpc:async()=>({data})};w.eval(fs.readFileSync(root+'catalog-theme.js','utf8'));await new Promise(r=>setTimeout(r,0));assert.equal(w.document.body.dataset.catalogTheme,'natal');assert.equal(w.document.querySelector('.search-wrap').parentElement.className,'catalog-top');assert.equal(w.document.querySelector('#catalogSections').nextElementSibling.className,'catalog-hero');
 data={...data,server_time:new Date(Date.now()+20000).toISOString()};intervals[0]();await new Promise(r=>setTimeout(r,0));
 assert.equal(w.document.body.dataset.catalogTheme,undefined);assert.equal(w.document.querySelector('.search-wrap').parentElement.className,'catalog-tools');assert.equal(w.document.querySelector('.catalog-brand img').getAttribute('src'),'assets/icon.svg');assert.equal(w.document.querySelector('h1').textContent,'Original title');assert.equal(w.document.querySelector('.hero-seal').textContent,'Original seal');assert.equal(w.document.querySelector('#catalogGrid').textContent,'Unchanged products');w.close();
 console.log('PASS: preview blocks purchases, text escaped, server-clock expiration restores original, products unchanged');
})().catch(e=>{console.error(e);process.exitCode=1});
