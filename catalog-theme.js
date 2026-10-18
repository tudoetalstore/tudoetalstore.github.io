/* Presentation only: never changes products, cart, prices or reservations. */
(()=>{
 'use strict';
 const presets={natal:{title:'Presentes de Natal',message:'Escolha um carinho para quem você ama.',eyebrow:'UM NATAL CHEIO DE CARINHO',seal:'Boas festas'},ano_novo:{title:'Um novo ano, novas escolhas',message:'Encontre seu próximo favorito.',eyebrow:'BEM-VINDOS A UM NOVO COMEÇO',seal:'Novos começos'}};
 window.TudoTalThemes=presets;
 const title=document.querySelector('.hero-copy h1'),message=document.querySelector('.hero-copy > p:last-child'),eyebrow=document.querySelector('.hero-copy .eyebrow'),seal=document.querySelector('.hero-seal');
 if(!title||!message)return;
 const original={title:title.textContent,message:message.textContent,eyebrow:eyebrow?.textContent,seal:seal?.innerHTML};
 function apply(theme,heading='',copy=''){
  const p=presets[theme];
  if(p)document.body.dataset.catalogTheme=theme;else delete document.body.dataset.catalogTheme;
  title.textContent=p?(heading||p.title):original.title;
  message.textContent=p?(copy||p.message):original.message;
  if(eyebrow)eyebrow.textContent=p?p.eyebrow:original.eyebrow;
  if(seal){if(p){seal.replaceChildren();const star=document.createElement('span');star.textContent='✧';const label=document.createElement('b');label.textContent=p.seal;seal.append(star,label);}else seal.innerHTML=original.seal;}
 }
 const params=new URLSearchParams(location.search),preview=params.get('preview_theme');
 if(preview!==null){
  apply(preview,params.get('title')?.slice(0,90),params.get('message')?.slice(0,180));
  const note=document.createElement('div');note.className='theme-preview-note';note.textContent='Prévia · não publicado · compras desativadas';document.body.prepend(note);
  document.addEventListener('click',e=>{if(e.target.closest('button,a,form')){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
  return;
 }
 let config=null,clock=0,loadedAt=0,busy=false;
 function render(){
  if(!config)return;
  const now=clock+(performance.now()-loadedAt),start=config.starts_at?Date.parse(config.starts_at):-Infinity,end=Date.parse(config.ends_at);
  apply(now>=start&&now<end?config.theme:'default',config.title,config.message);
 }
 async function refresh(){
  if(busy)return;busy=true;
  try{const {data,error}=await client.rpc('get_catalog_appearance');if(!error&&data){config=data;clock=Date.parse(data.server_time);loadedAt=performance.now();render();}}catch(e){/* Keep the known schedule during temporary outages. */}finally{busy=false;}
 }
 refresh();setInterval(()=>{render();if(document.visibilityState==='visible')refresh();},30000);
 setInterval(render,1000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){render();refresh();}});
})();
