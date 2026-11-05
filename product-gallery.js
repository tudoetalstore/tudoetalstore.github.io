/* Public photo viewer. Gallery data is fetched only when a product is opened. */
(()=>{
 let dialog,stage,img,thumbs,status,counter,prev,next,zoomIn,zoomOut,trigger;
 let urls=[],index=0,scale=1,x=0,y=0,request=0,pinch=null,start=null;
 const pointers=new Map();
 const safe=url=>typeof url==='string'&&(/^(https?:\/\/|data:image\/(jpeg|png|webp);base64,)/i.test(url)||url==='assets/icon.svg');
 function transform(){
  const maxX=stage.clientWidth*(scale-1)/2,maxY=stage.clientHeight*(scale-1)/2;
  x=Math.max(-maxX,Math.min(maxX,x));y=Math.max(-maxY,Math.min(maxY,y));
  img.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
  zoomOut.disabled=scale<=1;zoomIn.disabled=scale>=4;
 }
 function zoom(value){scale=Math.max(1,Math.min(4,value));if(scale===1){x=0;y=0;}transform();}
 function show(n){
  if(!urls.length)return;index=(n+urls.length)%urls.length;x=y=0;scale=1;transform();
  img.src=urls[index];img.alt=dialog.querySelector('h2').textContent+' — foto '+(index+1);
  counter.textContent=(index+1)+' de '+urls.length;
  prev.disabled=next.disabled=urls.length<2;
  [...thumbs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 }
 function setImages(images){
  urls=[...new Set(images.filter(safe))].slice(0,6);if(!urls.length)urls=['assets/icon.svg'];
  thumbs.replaceChildren();urls.forEach((url,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Ver foto '+(i+1));const t=document.createElement('img');t.src=url;t.alt='';b.append(t);b.onclick=()=>show(i);thumbs.append(b);});show(0);
 }
 function close(){dialog.close();}
 function init(){
  if(dialog)return;
  dialog=document.createElement('dialog');dialog.className='product-gallery';dialog.setAttribute('aria-labelledby','galleryTitle');
  dialog.innerHTML='<div class="gallery-head"><div><p>VEJA DE PERTO</p><h2 id="galleryTitle"></h2></div><button type="button" data-close aria-label="Fechar fotos">✕</button></div><div class="gallery-stage"><img draggable="false" alt=""></div><div class="gallery-controls"><button type="button" data-prev aria-label="Foto anterior">‹</button><span role="status" data-counter></span><button type="button" data-next aria-label="Próxima foto">›</button><span class="gallery-spacer"></span><button type="button" data-out aria-label="Diminuir zoom">−</button><button type="button" data-in aria-label="Aumentar zoom">+</button></div><p class="gallery-help">Toque duas vezes ou use + para ampliar. Arraste para ver os detalhes.</p><div class="gallery-thumbs" aria-label="Fotos do produto"></div><p class="gallery-status" role="status"></p>';
  document.body.append(dialog);stage=dialog.querySelector('.gallery-stage');img=stage.querySelector('img');thumbs=dialog.querySelector('.gallery-thumbs');status=dialog.querySelector('.gallery-status');counter=dialog.querySelector('[data-counter]');
  prev=dialog.querySelector('[data-prev]');next=dialog.querySelector('[data-next]');zoomIn=dialog.querySelector('[data-in]');zoomOut=dialog.querySelector('[data-out]');
  prev.onclick=()=>show(index-1);next.onclick=()=>show(index+1);zoomIn.onclick=()=>zoom(scale+1);zoomOut.onclick=()=>zoom(scale-1);dialog.querySelector('[data-close]').onclick=close;
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  dialog.addEventListener('close',()=>{request++;document.body.classList.remove('gallery-open');pointers.clear();pinch=start=null;img.removeAttribute('src');thumbs.replaceChildren();trigger?.focus();});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();show(index+1);}if(e.key==='ArrowLeft'){e.preventDefault();show(index-1);}if(e.key==='+'||e.key==='='){e.preventDefault();zoom(scale+1);}if(e.key==='-'){e.preventDefault();zoom(scale-1);}});
  img.onerror=()=>{status.textContent='Não foi possível carregar esta foto. Tente outra imagem ou abra novamente.';};
  let lastTap=0;
  stage.onpointerdown=e=>{
   if(e.button&&e.pointerType==='mouse')return;
   stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pointers.size===1)start={x:e.clientX,y:e.clientY,time:Date.now()};
   if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale};start=null;}
  };
  stage.onpointermove=e=>{
   const old=pointers.get(e.pointerId);if(!old)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()];zoom(pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance));}
   else if(scale>1){x+=e.clientX-old.x;y+=e.clientY-old.y;transform();}
  };
  const end=e=>{
   if(!pointers.has(e.pointerId))return;
   if(pointers.size===1&&start){const dx=e.clientX-start.x,dy=e.clientY-start.y,elapsed=Date.now()-start.time;
    if(scale===1&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)show(index+(dx<0?1:-1));
    else if(Math.abs(dx)<12&&Math.abs(dy)<12&&elapsed<300){if(Date.now()-lastTap<350){zoom(scale>1?1:2);lastTap=0;}else lastTap=Date.now();}
   }
   pointers.delete(e.pointerId);pinch=start=null;
  };
  stage.onpointerup=end;stage.onpointercancel=e=>{pointers.delete(e.pointerId);pinch=start=null;};
 }
 window.openProductGallery=async(product,button)=>{
  init();trigger=button;const token=++request;dialog.querySelector('h2').textContent=product.name;
  status.textContent='Carregando fotos…';setImages([product.photo_url||'assets/icon.svg']);
  if(!dialog.open)dialog.showModal();document.body.classList.add('gallery-open');dialog.querySelector('[data-close]').focus();
  try{
   const result=await client.rpc('get_catalog_product_photos',{p_product_id:product.id});
   if(token!==request||!dialog.open)return;
   if(result.error)throw result.error;
   if(Array.isArray(result.data)&&result.data.length){setImages(result.data);status.textContent='';}
   else{setImages([]);status.textContent='Este produto não tem fotos disponíveis no momento.';}
  }catch(error){if(token===request&&dialog.open)status.textContent='Exibindo a capa. Não foi possível carregar as outras fotos; feche e tente novamente.';}
 };
})();
