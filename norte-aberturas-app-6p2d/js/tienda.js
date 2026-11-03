/* Norte Aberturas · Tienda (catálogo, carrito, ficha y consultas por WhatsApp).
   Usa el núcleo de js/nucleo.js. El panel de autogestión vive aparte, en admin/. */

/* ---------- Menú lateral ---------- */
(function(){
'use strict';
const button=document.getElementById('site-menu-toggle'),panel=document.getElementById('site-menu-panel'),backdrop=document.getElementById('site-menu-backdrop'),closeButton=document.getElementById('site-menu-close');
if(!button||!panel||!backdrop||!closeButton)return;
let priorFocus=null;
const isOpen=()=>panel.classList.contains('is-open');
function close(restore){
 if(!isOpen())return;
 if(restore||panel.contains(document.activeElement))(priorFocus?.isConnected?priorFocus:button).focus();
 panel.classList.remove('is-open');backdrop.classList.remove('is-open');
 panel.inert=true;panel.setAttribute('inert','');panel.setAttribute('aria-hidden','true');
 button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Abrir menú de navegación');
 document.body.classList.remove('site-menu-locked');
}
function open(){
 priorFocus=document.activeElement;
 panel.inert=false;panel.removeAttribute('inert');panel.setAttribute('aria-hidden','false');
 panel.classList.add('is-open');backdrop.classList.add('is-open');
 button.setAttribute('aria-expanded','true');button.setAttribute('aria-label','Cerrar menú de navegación');
 document.body.classList.add('site-menu-locked');closeButton.focus();
}
button.addEventListener('click',()=>isOpen()?close(true):open());
closeButton.addEventListener('click',()=>close(true));
backdrop.addEventListener('click',()=>close(true));
document.addEventListener('keydown',e=>{
 if(!isOpen())return;
 if(e.key==='Escape'){e.preventDefault();close(true)}
 else if(e.key==='Tab'){
  const focusable=[...panel.querySelectorAll('a[href],button:not([disabled])')];
  if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable[focusable.length-1].focus()}
  else if(!e.shiftKey&&document.activeElement===focusable[focusable.length-1]){e.preventDefault();focusable[0].focus()}
 }
});
panel.querySelectorAll('[data-site-nav]').forEach(link=>link.addEventListener('click',()=>{
 if(link.getAttribute('href')==='#catalogo')document.body.classList.add('catalog-browsing');
 close(false);
}));
panel.addEventListener('click',event=>{
 const el=event.target.closest('[data-site-category]');if(!el||!panel.contains(el))return;
 const cat=el.dataset.siteCategory;close(false);
 if(typeof window.norteSelectCategory==='function')window.norteSelectCategory(cat);
 else{document.body.classList.add('catalog-browsing');location.hash='catalogo'}
});
panel.querySelectorAll('[data-site-action]').forEach(el=>el.addEventListener('click',()=>{
 const act=el.dataset.siteAction;close(false);
 document.getElementById(act==='cart'?'cart-open':act==='admin'?'admin-open':'')?.click();
}));
})();

/* ---------- Carruseles estáticos (funcionan aunque el catálogo dinámico no cargue) ---------- */
// Los enlaces estáticos abren el catálogo aunque haya errores en otros módulos.
document.addEventListener('click',function(event){
 if(event.target.closest('a.shop-static-link'))document.body.classList.add('catalog-browsing');
},true);
// Las flechas siguen funcionando si el catálogo dinámico no termina de cargar.
document.addEventListener('click',function(event){
 const arrow=event.target.closest('[data-app-dir]');
 if(!arrow)return;
 const rail=document.getElementById(arrow.dataset.appShelf+'-rail');
 if(!rail||!rail.hasAttribute('data-static-gallery'))return;
 const card=rail.querySelector('.shop-item');
 if(card)rail.scrollBy({left:Number(arrow.dataset.appDir)*(card.getBoundingClientRect().width+16),behavior:'smooth'});
});

/* ---------- Tienda ---------- */
(()=>{
'use strict';
const app=window.NorteApp;
const {$,all,esc,safeImg,formatPrice,productCodeText,CATEGORIES,FIXED_CATEGORIES,CART_STORE,FAV_STORE,setStored,toast,PHONE}=app;
let query='',sortMode='default',detailId=null;
function renderAppShowcase(){
 const groups=[
   {id:'shop-featured-app-rail',preferred:['p1','p4','p10','p6','p13','p27','p42','p57'],offset:0},
   {id:'shop-new-app-rail',preferred:['p15','p31','p49','p58','p23','p34','p46','p63'],offset:4}
 ];
 // Cada carrusel muestra 8 productos: primero los elegidos y, si alguno se borró desde el panel,
 // se completa con otros del catálogo sin repetir los que ya aparecen en el carrusel anterior.
 const RAIL_SIZE=8,used=new Set();
 for(const group of groups){
  const container=$(group.id);if(!container)continue;
  const saved=container.scrollLeft;
  const unique=group.preferred.map(id=>app.products.find(p=>p.id===id)).filter(p=>p&&!used.has(p.id));
  for(const product of app.products.slice(group.offset).concat(app.products.slice(0,group.offset))){
   if(unique.length>=RAIL_SIZE)break;
   if(!used.has(product.id)&&!unique.some(p=>p.id===product.id))unique.push(product);
  }
  unique.forEach(p=>used.add(p.id));
  container.removeAttribute('data-static-gallery');
  container.innerHTML=unique.map(p=>{
   const photo=safeImg(p.image);
   const placeholder=p.category==='Puertas'?'🚪':p.category==='Ventanas'?'🪟':p.category==='Accesorios'?'🔩':'📐';
   return '<article class="shop-item" data-category="'+esc(p.category)+'"><div class="shop-img">'+(photo?'<img loading="lazy" src="'+esc(photo)+'" alt="'+esc(p.name)+'">':'<div class="tile-placeholder">'+placeholder+'</div>')+'<small>'+esc(p.category)+'</small></div><div class="shop-cardbody"><small>CATÁLOGO DEMOSTRATIVO</small><h3>'+esc(p.name)+'</h3>'+'<div class="shop-price">'+(p.price===null?'Precio a consultar':formatPrice(p.price))+'</div><div class="shop-actions"><button type="button" class="shop-add" data-shop-app-add="'+esc(p.id)+'">🛒 Agregar</button><button type="button" class="shop-detail" data-shop-app-category="'+esc(p.category)+'" aria-label="Ver catálogo de '+esc(p.category)+'">Ver catálogo ↗</button></div></div></article>';
  }).join('');
  if(saved)container.scrollLeft=saved;
  container.querySelectorAll('[data-shop-app-add]').forEach(b=>b.addEventListener('click',()=>addToCart(b.dataset.shopAppAdd)));
  container.querySelectorAll('[data-shop-app-category]').forEach(b=>b.addEventListener('click',()=>window.norteSelectCategory(b.dataset.shopAppCategory)));
 }
}
function submitShopAppSearch(e){
 e.preventDefault();
 document.body.classList.add('catalog-browsing');
 query=$('shop-search-app').value.trim();
 $('product-search').value=query;
 app.filter='Todas';
 all('.chip').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='Todas')));
 renderCatalog();
 $('shop-search-app').blur();
 window.norteScrollCatalog();
}

window.norteScrollCatalog=()=>{
 requestAnimationFrame(()=>{
  const target=$('catalogo');
  if(!target||target.hidden)return;
  // Colocar el encabezado del catálogo justo debajo de la barra fija.
  // Así entran en pantalla las fotos y los nombres de los primeros productos.
  const heading=target.querySelector('.sectiontop .micro')||target;
  const sticky=document.querySelector('.sitehead');
  const stickyBottom=sticky?Math.max(0,sticky.getBoundingClientRect().bottom):0;
  const offset=heading.getBoundingClientRect().top-(stickyBottom+6);
  if(Math.abs(offset)>2)window.scrollTo({top:Math.max(0,window.scrollY+offset),behavior:'instant'});
 });
};

window.norteEnsureCatalog=()=>{
 document.body.classList.add('catalog-browsing');
 // Abrir el catálogo completo requiere mostrar todos los productos.
 if(!catalogHasRendered||app.filter!=='Todas'||query||!$('catalog').childElementCount){
  query='';
  $('shop-search-app').value='';
  $('product-search').value='';
  app.filter='Todas';
  renderCatalog();
 }
};
function renderAllCategoriesExplorer(){
 const count=$('shop-all-categories-count');
 const grid=$('shop-all-categories-grid');
 if(!count||!grid)return;
 const additional=Math.max(0,CATEGORIES.length-FIXED_CATEGORIES.length);
 count.textContent=CATEGORIES.length+' categorías disponibles'+(additional?' · '+additional+' '+(additional===1?'nueva':'nuevas'):'');
 grid.innerHTML=CATEGORIES.map((category,index)=>{
  const total=app.products.filter(p=>p.category===category).length;
  const number=String(index+1).padStart(2,'0');
  return '<button class="shop-all-category" type="button" data-explore-category="'+esc(category)+'" aria-label="Ver '+esc(category)+', '+total+' '+(total===1?'producto':'productos')+'"><span class="shop-all-category-index">COLECCIÓN '+number+'</span><span class="shop-all-category-name">'+esc(category)+'</span><span class="shop-all-category-footer"><span>'+total+' '+(total===1?'producto':'productos')+'</span><span aria-hidden="true">↗</span></span></button>';
 }).join('');
}

function syncShopCategoryCounts(){
 const captions={Puertas:'Entradas con diseño y presencia',Ventanas:'Luz y ventilación para cada ambiente',Accesorios:'Herrajes y detalles de calidad','A medida':'Soluciones para proyectos especiales'};
 document.querySelectorAll('[data-shop-category-count]').forEach(el=>{
  const cat=el.dataset.shopCategoryCount;
  const n=app.products.filter(p=>p.category===cat).length;
  el.textContent=captions[cat]+' · '+n+' '+(n===1?'producto':'productos');
 });
}

function renderAll(){
 syncShopCategoryCounts();
 renderAppShowcase();
 renderAllCategoriesExplorer();
 // El catálogo completo no se monta hasta que el visitante lo pide.
 if(document.body.classList.contains('catalog-browsing'))renderCatalog();
 else syncCategorySidebar();
 renderCart();
}


const CATALOG_PAGE_SIZE=12;
let catalogVisibleLimit=CATALOG_PAGE_SIZE;
let selectedViewKey='';
function syncCategorySidebar(){
  const active=app.filter;
  document.querySelectorAll('[data-site-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.siteCategory===active)));
  document.querySelectorAll('[data-site-count]').forEach(el=>{
    const category=el.dataset.siteCount;
    el.textContent=category==='Favoritos'?app.products.filter(p=>app.favorites.has(p.id)).length:app.products.filter(p=>p.category===category).length;
  });
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===active)));
  const view=active+'|'+query+'|'+sortMode;
  if(selectedViewKey!==view){catalogVisibleLimit=CATALOG_PAGE_SIZE;selectedViewKey=view;}
}
function syncCatalogMore(count){
  const button=$('catalog-show-more');
  const remaining=Math.max(0,count-catalogVisibleLimit);
  button.hidden=remaining===0;
  button.textContent=remaining?'Mostrar más productos · '+remaining+' restantes ↓':'Mostrar más productos ↓';
}

window.norteSelectCategory=category=>{
 document.body.classList.add('catalog-browsing');
 $('product-search').value='';
 $('shop-search-app').value='';
 query='';
 app.filter=(CATEGORIES.includes(category)||category==='Todas'||category==='Favoritos')?category:'Todas';
 renderCatalog();
 window.norteScrollCatalog();
};
function initCategorySidebar(){
  $('catalog-show-more').addEventListener('click',()=>{
    catalogVisibleLimit+=CATALOG_PAGE_SIZE;
    renderCatalog();
  });
}

let catalogHasRendered=false;
function renderCatalog(){
 document.body.classList.add('catalog-browsing');
 catalogHasRendered=true;
 const q=query.toLocaleLowerCase('es-AR');
 let visible=app.products.filter(p=>(app.filter==='Todas'||(app.filter==='Favoritos'?app.favorites.has(p.id):p.category===app.filter))&&[p.name,p.category,p.description].some(s=>s.toLocaleLowerCase('es-AR').includes(q)));
 if(sortMode==='az')visible.sort((a,b)=>a.name.localeCompare(b.name,'es-AR'));
 else if(sortMode==='za')visible.sort((a,b)=>b.name.localeCompare(a.name,'es-AR'));
 else if(sortMode==='category')visible.sort((a,b)=>a.category.localeCompare(b.category,'es-AR')||a.name.localeCompare(b.name,'es-AR'));
 syncCategorySidebar();syncCatalogMore(visible.length);$('result-count').textContent=visible.length+' '+(visible.length===1?'producto':'productos');
 const shownProducts=visible.slice(0,catalogVisibleLimit);
 $('empty-search').hidden=visible.length!==0;
 $('catalog').innerHTML=shownProducts.map(p=>{
 const image=safeImg(p.image);
 const label=p.category==='Puertas'?'🚪':p.category==='Ventanas'?'🪟':p.category==='Accesorios'?'🔩':'📐';
 return '<article class="tile"><div class="tile-picture">'+(image?'<img loading="lazy" src="'+esc(image)+'" alt="'+esc(p.name)+'">':'<div class="tile-placeholder" aria-hidden="true">'+label+'</div>')+'<span class="demo-tag">Referencia</span><button type="button" class="tile-fav" data-favorite="'+esc(p.id)+'" aria-label="'+(app.favorites.has(p.id)?'Quitar de favoritos: ':'Guardar como favorito: ')+esc(p.name)+'" aria-pressed="'+app.favorites.has(p.id)+'">'+(app.favorites.has(p.id)?'♥':'♡')+'</button></div><div class="tileinfo"><span class="category">'+esc(p.category)+'</span><h3>'+esc(p.name)+'</h3>'+'<p>'+esc(p.description)+'</p><div class="tilebottom"><span class="price'+(p.price===null?' unspecified':'')+'">'+(p.price===null?'Precio a consultar':formatPrice(p.price))+'</span></div><button class="tile-details" type="button" data-detail="'+esc(p.id)+'">Ver detalles ↗</button><button class="btn btn-primary tile-add" type="button" data-add="'+esc(p.id)+'">🛒 Agregar al carrito</button></div></article>'
 }).join('');
 all('[data-add]',$('catalog')).forEach(b=>b.addEventListener('click',()=>addToCart(b.dataset.add)));
 all('[data-detail]',$('catalog')).forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.detail)));
 all('[data-favorite]',$('catalog')).forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.favorite;if(app.favorites.has(id))app.favorites.delete(id);else app.favorites.add(id);setStored(FAV_STORE,[...app.favorites]);renderCatalog();toast(app.favorites.has(id)?'Guardado en favoritos':'Quitado de favoritos')}));
 if(window.matchMedia('(max-width:760px)').matches)renderMobileCarousels(shownProducts);
 else if($('swipe-catalog').childElementCount)$('swipe-catalog').replaceChildren();
}


const swipeOffsets={};
function renderMobileCarousels(visible){
 const holder=$('swipe-catalog'),cards=new Map();
 all('[data-add]',$('catalog')).forEach(b=>cards.set(b.dataset.add,b.closest('.tile')));
 const categories=CATEGORIES.filter(c=>visible.some(p=>p.category===c));
 holder.innerHTML=categories.map((cat,i)=>{
   const count=visible.filter(p=>p.category===cat).length, arrows=count>1, trackId='swipe-app-'+i;
   return '<section class="swipe-category" aria-label="Catálogo de '+esc(cat)+'"><div class="swipe-category-head"><h3>'+esc(cat)+'</h3>'+(arrows?'<div class="swipe-actions"><span class="swipe-hint">Deslizá para ver más →</span><button class="swipe-arrow" data-direction="-1" data-for="'+trackId+'" aria-label="Anterior producto de '+esc(cat)+'" disabled>‹</button><button class="swipe-arrow" data-direction="1" data-for="'+trackId+'" aria-label="Siguiente producto de '+esc(cat)+'">›</button></div>':'')+'</div><div class="swipe-track" id="'+trackId+'" role="region" aria-label="Desplazá los productos de '+esc(cat)+'" tabindex="0"></div></section>';
 }).join('');
 categories.forEach((cat,i)=>{
   const track=$('swipe-app-'+i);
   visible.filter(p=>p.category===cat).forEach(p=>{
     const source=cards.get(p.id);if(!source)return;
     const node=source.cloneNode(true);track.append(node);
     all('[data-add]',node).forEach(b=>b.addEventListener('click',()=>addToCart(b.dataset.add)));
     all('[data-detail]',node).forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.detail)));
     all('[data-favorite]',node).forEach(b=>b.addEventListener('click',()=>{
       const id=b.dataset.favorite;
       app.favorites.has(id)?app.favorites.delete(id):app.favorites.add(id);
       setStored(FAV_STORE,[...app.favorites]);renderCatalog();
       toast(app.favorites.has(id)?'Guardado en favoritos':'Quitado de favoritos');
     }));
   });
   if(swipeOffsets[cat])track.scrollLeft=swipeOffsets[cat];
   const buttons=all('[data-for="'+track.id+'"]',holder);
   function update(){
     const prev=buttons.find(b=>b.dataset.direction==='-1'),next=buttons.find(b=>b.dataset.direction==='1');
     if(prev)prev.disabled=track.scrollLeft<=3;
     if(next)next.disabled=track.clientWidth>0&&track.scrollLeft+track.clientWidth>=track.scrollWidth-3;
   }
   track.addEventListener('scroll',()=>{swipeOffsets[cat]=track.scrollLeft;update()},{passive:true});
   buttons.forEach(b=>b.addEventListener('click',()=>{
     const tile=track.querySelector('.tile');
     if(tile)track.scrollBy({left:Number(b.dataset.direction)*(tile.getBoundingClientRect().width+12),behavior:'smooth'});
   }));
   update();
 });
}

function addToCart(id){
 if(!app.products.some(p=>p.id===id))return;
 const wasEmpty=!Object.entries(app.cart).some(([key,entry])=>app.products.some(p=>p.id===key)&&Number(entry?.qty)>0);
 const item=app.cart[id]||{qty:0,note:''};
 item.qty=Math.min(99,item.qty+1);
 app.cart[id]=item;
 setStored(CART_STORE,app.cart);
 renderCart();
 toast(wasEmpty?'¡Producto agregado al carrito!':'¡Agregado! Podés seguir eligiendo productos.');
 if(wasEmpty)showPanel('cart-drawer');
}
function renderCart(){let items=Object.entries(app.cart).map(([id,item])=>({p:app.products.find(p=>p.id===id),item})).filter(x=>x.p);let sum=items.reduce((n,x)=>n+x.item.qty,0);$('cart-count').textContent=sum;$('sticky-cart-count').textContent=sum+(sum===1?' producto':' productos');$('sticky-cart').hidden=sum===0;$('cart-form').hidden=items.length===0;
$('cart-items').innerHTML=items.length?items.map(({p,item})=>'<div class="cartitem"><div class="cart-thumb">'+(safeImg(p.image)?'<img src="'+esc(safeImg(p.image))+'" alt="">':'<div class="tile-placeholder">🚪</div>')+'</div><div class="cartitem-info"><strong>'+esc(p.name)+'</strong>'+'<small>'+esc(p.category)+'</small><div class="qty-controls"><button type="button" aria-label="Quitar una unidad de '+esc(p.name)+'" data-qty="-1" data-id="'+esc(p.id)+'">−</button><span>'+item.qty+'</span><button type="button" aria-label="Agregar una unidad de '+esc(p.name)+'" data-qty="1" data-id="'+esc(p.id)+'">+</button><button type="button" class="remove" data-remove="'+esc(p.id)+'">Quitar</button></div><input class="item-note" type="text" maxlength="180" data-note="'+esc(p.id)+'" placeholder="Medidas o detalles (opcional)" value="'+esc(item.note)+'"></div></div>').join(''):'<div class="emptycart"><b>Tu carrito está vacío.</b>Explorá productos y agregalos para preparar tu pedido.</div>';
const valued=items.filter(x=>x.p.price!==null);const total=valued.reduce((s,x)=>s+x.p.price*x.item.qty,0);
$('cart-estimate').textContent=valued.length===0?'A consultar':formatPrice(total)+(valued.length<items.length?' + a consultar':'');
$('send-quote').disabled=items.length===0;
all('[data-qty]',$('cart-items')).forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.id;app.cart[id].qty=Math.min(99,app.cart[id].qty+Number(b.dataset.qty));if(app.cart[id].qty<=0)delete app.cart[id];setStored(CART_STORE,app.cart);renderCart()}));
all('[data-remove]',$('cart-items')).forEach(b=>b.addEventListener('click',()=>{delete app.cart[b.dataset.remove];setStored(CART_STORE,app.cart);renderCart()}));
all('[data-note]',$('cart-items')).forEach(b=>b.addEventListener('input',()=>{if(app.cart[b.dataset.note]){app.cart[b.dataset.note].note=b.value.slice(0,180);setStored(CART_STORE,app.cart)}}));
}
function openWhatsApp(message){const a=document.createElement('a');a.href='https://wa.me/'+PHONE+'?text='+encodeURIComponent(message);a.target='_blank';a.rel='noopener noreferrer';document.body.append(a);a.click();a.remove()}
function submitQuote(){const items=Object.entries(app.cart).map(([id,item])=>({p:app.products.find(p=>p.id===id),item})).filter(x=>x.p);if(!items.length)return toast('Primero agregá al menos un producto.');let name=$('customer-name').value.trim().slice(0,80),city=$('customer-location').value.trim().slice(0,100);let text='¡Hola! 👋 Estuve viendo el catálogo de Norte Aberturas y quisiera consultar por los siguientes productos:\n\n'+items.map(({p,item},i)=>(i+1)+'. '+p.name+productCodeText(p)+' — cantidad: '+item.qty+(item.note?'\n   Medidas/detalles: '+item.note:'')).join('\n')+'\n\n';if(name)text+='Nombre: '+name+'\n';if(city)text+='Ciudad/provincia: '+city+'\n';text+='¿Podrían confirmarme disponibilidad, opciones y presupuesto? ¡Muchas gracias!';openWhatsApp(text)}
function sendGeneralInquiry(event){
 event.preventDefault();
 const form=$('consulta-form');
 if(!form.reportValidity())return;
 const name=$('consulta-name').value.trim().slice(0,80);
 const city=$('consulta-location').value.trim().slice(0,100);
 const category=$('consulta-category').value.trim();
 const qty=$('consulta-quantity').value.trim();
 const measures=$('consulta-measures').value.trim().slice(0,120);
 const details=$('consulta-details').value.trim().slice(0,650);
 if(!category||!details||!/^\d+$/.test(qty)||Number(qty)<1||Number(qty)>999){
   toast('Completá el producto, la cantidad y los detalles de tu consulta.');
   return;
 }
 const parts=[
   '¡Hola! 👋 Vi la app de Norte Aberturas y quisiera consultar por un proyecto.',
   '',
   'Tipo de abertura: '+category,
   'Cantidad aproximada: '+qty
 ];
 if(measures)parts.push('Medidas aproximadas: '+measures);
 parts.push('Detalles: '+details);
 if(name)parts.push('Nombre: '+name);
 if(city)parts.push('Ciudad/provincia: '+city);
 parts.push('', '¿Podrían asesorarme sobre modelos, disponibilidad, precios y envío? ¡Gracias!');
 openWhatsApp(parts.join('\n'));
}

function hidePanels(){$('overlay').hidden=true;$('cart-drawer').hidden=true;$('detail-modal').hidden=true;$('consulta-modal').hidden=true;document.body.style.overflow=''}
function showPanel(which){hidePanels();$('overlay').hidden=false;$(which).hidden=false;document.body.style.overflow='hidden';$(which).querySelector('button:not([hidden])')?.focus()}
function openDetail(id){
 const p=app.products.find(x=>x.id===id);if(!p)return;
 detailId=id;const image=safeImg(p.image);
 $('detail-photo').innerHTML=image?'<img src="'+esc(image)+'" alt="'+esc(p.name)+'">':'<div class="detail-placeholder">'+(p.category==='Puertas'?'🚪':p.category==='Ventanas'?'🪟':'🔩')+'</div>';
 $('detail-cat').textContent=p.category;$('detail-title').textContent=p.name;
 $('detail-desc').textContent=(p.description||'Consultá por modelos, medidas y terminaciones disponibles.')+' Los productos reales se confirman con Norte Aberturas.';
 $('detail-price').textContent=p.price===null?'A consultar':formatPrice(p.price);
 const related=app.products.filter(x=>x.category===p.category&&x.id!==id).slice(0,3);
 $('detail-related').innerHTML=related.length?'<strong>También te puede interesar</strong>'+related.map(x=>'<button type="button" data-related="'+esc(x.id)+'">'+esc(x.name)+' ↗</button>').join(''):'';
 all('[data-related]',$('detail-related')).forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.related)));
 showPanel('detail-modal');
}
// En el catálogo, el buscador de la cabecera filtra sin saltar la pantalla.
// Búsqueda superior a demanda: escribir o borrar no reconstruye
// el catálogo ni altera la altura del documento (evita saltos).
// r36: conservar la posición visible al editar el buscador del encabezado.
const headerSearchInput=$('shop-search-app');
let headerSearchPinnedY=null;
let headerScrollRestore=false;
const restoreHeaderScroll=()=>{
 if(headerSearchPinnedY===null||document.activeElement!==headerSearchInput)return;
 if(Math.abs(window.scrollY-headerSearchPinnedY)>1){
  window.scrollTo({top:headerSearchPinnedY,behavior:'instant'});
 }
};
headerSearchInput.addEventListener('pointerdown',()=>{
 headerSearchPinnedY=window.scrollY;
},true);
headerSearchInput.addEventListener('focus',()=>{
 if(headerSearchPinnedY===null)headerSearchPinnedY=window.scrollY;
},true);
for(const eventName of ['input','search']){
 headerSearchInput.addEventListener(eventName,event=>{
  // Solo el botón Buscar aplica filtros. El valor del campo sigue cambiando.
  event.stopImmediatePropagation();
  requestAnimationFrame(restoreHeaderScroll);
 },true);
}
headerSearchInput.addEventListener('blur',()=>{headerSearchPinnedY=null},true);
window.addEventListener('scroll',()=>{
 if(headerSearchPinnedY===null||document.activeElement!==headerSearchInput||headerScrollRestore)return;
 if(Math.abs(window.scrollY-headerSearchPinnedY)<=1)return;
 headerScrollRestore=true;
 restoreHeaderScroll();
 requestAnimationFrame(()=>{headerScrollRestore=false});
},{passive:true});
$('shop-search-app-form').addEventListener('submit',submitShopAppSearch);
$('shop-all-categories-toggle').addEventListener('click',()=>{
 const button=$('shop-all-categories-toggle'),panel=$('shop-all-categories-panel');
 const opening=button.getAttribute('aria-expanded')!=='true';
 button.setAttribute('aria-expanded',String(opening));
 panel.hidden=!opening;
});
$('shop-all-categories-grid').addEventListener('click',event=>{
 const choice=event.target.closest('[data-explore-category]');
 if(!choice)return;
 const category=choice.dataset.exploreCategory;
 if(CATEGORIES.includes(category))window.norteSelectCategory(category);
});
all('[data-shop-app-cat]').forEach(b=>b.addEventListener('click',()=>window.norteSelectCategory(b.dataset.shopAppCat)));
all('[data-app-shelf]').forEach(b=>b.addEventListener('click',()=>{const rail=$(b.dataset.appShelf+'-rail');const item=rail?.querySelector('.shop-item');if(item)rail.scrollBy({left:Number(b.dataset.appDir)*(item.getBoundingClientRect().width+16),behavior:'smooth'})}));
all('.chip').forEach(b=>b.addEventListener('click',()=>{app.filter=b.dataset.filter;all('.chip').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCatalog()}));
$('product-search').addEventListener('input',e=>{query=e.target.value.trim();renderCatalog()});$('product-sort').addEventListener('change',e=>{sortMode=e.target.value;renderCatalog()});
$('reset-search').addEventListener('click',()=>{$('product-search').value='';query='';app.filter='Todas';sortMode='default';$('product-sort').value='default';all('.chip').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='Todas')));renderCatalog()});
['cart-open','mobile-list','sticky-cart-open'].forEach(id=>{const button=$(id);if(button)button.addEventListener('click',()=>showPanel('cart-drawer'))});$('continue-shopping').addEventListener('click',()=>{hidePanels();window.norteEnsureCatalog();window.norteScrollCatalog()});
$('cta-list').addEventListener('click',()=>{showPanel('consulta-modal');$('consulta-name').focus()});
$('consulta-form').addEventListener('submit',sendGeneralInquiry);
['cart-close','detail-close','consulta-close','overlay'].forEach(id=>$(id).addEventListener('click',hidePanels));
document.addEventListener('keydown',e=>{if(e.key==='Escape')hidePanels()});
$('send-quote').addEventListener('click',submitQuote);$('detail-add').addEventListener('click',()=>{if(detailId)addToCart(detailId)});$('detail-wa').addEventListener('click',()=>{const p=app.products.find(x=>x.id===detailId);if(p)openWhatsApp('¡Hola! Vi el catálogo de Norte Aberturas y quisiera consultar por '+p.name+'. ¿Podrían enviarme modelos, medidas y precios disponibles? ¡Gracias!')});
const mobileCatalogMedia=window.matchMedia('(max-width:760px)');
mobileCatalogMedia.addEventListener('change',()=>{if(document.body.classList.contains('catalog-browsing'))renderCatalog()});
$('mobile-home').addEventListener('click',()=>{document.getElementById('inicio').scrollIntoView({behavior:'smooth'})});
$('mobile-catalog').addEventListener('click',()=>{window.norteEnsureCatalog();window.norteScrollCatalog()});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v='+NORTE_VERSION,{scope:'./',updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{}));
app.renderAll=renderAll;
initCategorySidebar();app.start();
})();

/* ---------- Fotos caídas y navegación al catálogo ---------- */
/* Si una fotografía externa deja de estar disponible, se reemplaza por otra foto de la misma categoría. */
document.addEventListener('error',ev=>{
 const target=ev.target;
 if(!target||target.tagName!=='IMG'||target.dataset.norteFallback==='yes')return;
 const host=target.closest('.tile,.shop-cat,.shop-item,.detail-photo,.cart-thumb');
 if(!host)return;
 const category=host.dataset.category||host.dataset.shopAppCat
   ||host.querySelector('.category')?.textContent?.trim()
   ||(host.classList.contains('detail-photo')?document.getElementById('detail-cat')?.textContent?.trim():null)
   ||(host.classList.contains('cart-thumb')?host.closest('.cartitem')?.querySelector('.cartitem-info small')?.textContent?.split(' · ')[0]?.trim():null)
   ||'A medida';
 target.dataset.norteFallback='yes';
 const fallbackPhoto={Puertas:'https://images.unsplash.com/photo-1646146361482-fd2374db66da?auto=format&fit=crop&w=900&q=75',Ventanas:'https://images.unsplash.com/photo-1755378402362-40cbb72abb63?auto=format&fit=crop&w=900&q=75',Accesorios:'https://images.unsplash.com/photo-1776417091038-df7f71687a1e?auto=format&fit=crop&w=900&q=75','A medida':'https://images.unsplash.com/photo-1764592119348-0aaeab50e2d0?auto=format&fit=crop&w=900&q=75'};
 target.src=fallbackPhoto[category]||fallbackPhoto['A medida'];
},true);


// A single catalog initializer and a single, immediate scroll per navigation.
function showCatalogForBrowsing(){
 if(typeof window.norteEnsureCatalog==='function')window.norteEnsureCatalog();
 else document.body.classList.add('catalog-browsing');
}
document.addEventListener('click',e=>{
 const catalogLink=e.target.closest('a[href="#catalogo"]');
 if(catalogLink){
  e.preventDefault();
  showCatalogForBrowsing();
  if(location.hash!=='#catalogo'&&window.history?.replaceState)window.history.replaceState(null,'','#catalogo');
  window.norteScrollCatalog?.();
 } else if(e.target.closest('[data-shop-app-cat]')){
  document.body.classList.add('catalog-browsing');
 }
},true);
if(location.hash==='#catalogo'){showCatalogForBrowsing();window.norteScrollCatalog?.()}
window.addEventListener('hashchange',()=>{
 if(location.hash==='#catalogo'){showCatalogForBrowsing();window.norteScrollCatalog?.()}
});
