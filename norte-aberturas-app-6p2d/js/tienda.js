/* Norte Aberturas · Tienda (catálogo, carrito, ficha y consultas por WhatsApp).
   Datos iniciales: catalogo.json · Panel de autogestión: js/admin.js (se carga al abrirlo). */

/* Única fuente del número de versión: se muestra en la franja superior y nombra la caché del service worker. */
const NORTE_VERSION='r59';
document.getElementById('norte-app-build').textContent=NORTE_VERSION;

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

/* ---------- Dibujos de referencia de versiones anteriores de la demo ---------- */
function referenceArt(key){
 const match=/^refsvg:(door|window|hardware|custom)-([1-9]|1[0-9])$/.exec(String(key||''));if(!match)return '';
 const kind=match[1],variant=Number(match[2]),j=variant%5;
 const shades=[['#e9eee8','#99795c','#3f6652'],['#e6ede9','#927561','#4f6e65'],['#efeee7','#776c5e','#30564a'],['#e6eae2','#ac8e6b','#48645a']][variant%4];
 const [bg,wood,metal]=shades;
 let shape='';
 if(kind==='door'){
 let detail=j===0?'<rect x="262" y="134" width="233" height="323" fill="#b8d5d2" stroke="#466a5d" stroke-width="11"/><path d="M379 133V458M262 295H495" stroke="#466a5d" stroke-width="10"/>':j===1?'<path d="M247 177H504M247 252H504M247 327H504M247 402H504" stroke="#e1c6a3" stroke-opacity=".55" stroke-width="12"/>':j===2?'<rect x="250" y="130" width="258" height="133" fill="#bfd9d4" stroke="#456b5f" stroke-width="9"/><rect x="250" y="303" width="258" height="120" fill="none" stroke="#d4b896" stroke-width="7"/>':j===3?'<path d="M375 94V497" stroke="#41594a" stroke-width="10"/><rect x="252" y="132" width="95" height="308" fill="none" stroke="#e9d9bc" stroke-width="8"/><rect x="402" y="132" width="95" height="308" fill="none" stroke="#e9d9bc" stroke-width="8"/>':'<rect x="255" y="126" width="246" height="316" fill="none" stroke="#e7d0b0" stroke-width="9"/><path d="M280 194H472M280 275H472M280 353H472" stroke="#e9d5b2" stroke-width="7"/>';
 shape='<rect x="183" y="77" width="398" height="456" fill="#dcded4" stroke="#abb9ab" stroke-width="14"/><rect x="223" y="96" width="320" height="405" fill="'+wood+'" stroke="'+metal+'" stroke-width="13"/>'+detail+'<rect x="519" y="307" width="8" height="53" rx="3" fill="#e2d2b8"/>';
 }else if(kind==='window'){
 const lines=j===0?'<path d="M380 121V467M196 297H558"/>':j===1?'<path d="M314 122V468M440 122V468"/>':j===2?'<path d="M197 300H562"/>':j===3?'<path d="M378 122V468"/>':'<path d="M195 226H565M195 367H565M380 120V467"/>';
 shape='<rect x="153" y="101" width="452" height="415" fill="#b8d3cf" stroke="'+metal+'" stroke-width="18"/><path d="M175 470L554 147" stroke="#f7fff7" stroke-opacity=".5" stroke-width="27"/><g fill="none" stroke="'+metal+'" stroke-width="13">'+lines+'</g><rect x="151" y="517" width="456" height="18" rx="2" fill="#a3aba1"/>';
 }else if(kind==='hardware'){
 const shapes=j===0?'<rect x="347" y="164" width="65" height="324" rx="28"/><path d="M321 211H438M321 433H438"/>':j===1?'<rect x="321" y="186" width="92" height="140" rx="15"/><path d="M369 330V437H473"/><circle cx="367" cy="247" r="16"/>':j===2?'<path d="M224 284H539M289 236V333M470 236V333"/><circle cx="289" cy="284" r="25"/><circle cx="470" cy="284" r="25"/>':j===3?'<rect x="301" y="181" width="151" height="252" rx="13"/><rect x="339" y="212" width="79" height="69" rx="5"/><circle cx="380" cy="367" r="24"/>':'<path d="M285 194V427M452 194V427M285 194H452M285 427H452"/><circle cx="285" cy="193" r="22"/><circle cx="451" cy="427" r="22"/>';
 shape='<rect x="185" y="97" width="395" height="427" rx="11" fill="'+wood+'" fill-opacity=".23"/><g fill="#becdc3" stroke="'+metal+'" stroke-width="17" stroke-linecap="round" stroke-linejoin="round">'+shapes+'</g>';
 }else{
 shape='<rect x="162" y="110" width="430" height="407" fill="#f4f6ef" stroke="'+metal+'" stroke-width="12"/><rect x="199" y="151" width="357" height="320" fill="#bbd9d0" stroke="'+metal+'" stroke-width="10"/><path d="M377 151V471" stroke="'+metal+'" stroke-width="12"/><g stroke="#a58558" stroke-width="5" stroke-dasharray="9 8" fill="none"><path d="M127 85H628M128 88V535M629 85V534M127 557H629"/></g><g stroke="#a58558" stroke-width="5"><path d="M127 85l16 -12m-16 12l16 12m485 -12l-16 -12m16 12l-16 12M127 557l16 -12m-16 12l16 12M628 557l-16 -12m16 12l-16 12"/></g>';
 }
 const category={door:'PUERTAS',window:'VENTANAS',hardware:'ACCESORIOS',custom:'A MEDIDA'}[kind];
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 660"><rect width="760" height="660" fill="'+bg+'"/><rect x="65" y="49" width="631" height="550" rx="11" fill="#ffffff" fill-opacity=".5"/><ellipse cx="379" cy="555" rx="248" ry="21" fill="#394d3b" fill-opacity=".08"/>'+shape+'<rect x="58" y="575" width="644" height="64" fill="#234938"/><text x="380" y="614" text-anchor="middle" fill="#fff9ef" font-family="Arial,sans-serif" font-weight="bold" font-size="18" letter-spacing="3">'+category+' - IMAGEN ILUSTRATIVA</text></svg>';
 return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}

/* ---------- Tienda ---------- */
(()=>{
'use strict';
const PHONE='5492901535229',STORE='zenix_norte_app_demo_products_v1',CART_STORE='zenix_norte_app_demo_cart_v1',FAV_STORE='zenix_norte_app_demo_favorites_v1',CATEGORY_STORE='zenix_norte_app_demo_categories_v1',CATEGORIES=['Puertas','Ventanas','Accesorios','A medida'];
const FIXED_CATEGORIES=CATEGORIES.slice();
const LEGACY_DEMO_IMAGES={"p1":"https://images.unsplash.com/photo-1646146361482-fd2374db66da?auto=format&fit=crop&w=900&q=80","p2":"https://images.unsplash.com/photo-1542354642-233af003db87?auto=format&fit=crop&w=900&q=80","p3":"https://images.unsplash.com/photo-1776417091038-df7f71687a1e?auto=format&fit=crop&w=900&q=80","p4":"https://images.unsplash.com/photo-1552602989-715150494024?auto=format&fit=crop&w=900&q=80","p5":"https://images.unsplash.com/photo-1646872686934-cf4c910fc219?auto=format&fit=crop&w=900&q=80","p6":"https://images.unsplash.com/photo-1569216961559-fd512349ebba?auto=format&fit=crop&w=900&q=80","p7":"https://images.unsplash.com/photo-1646146361482-fd2374db66da?auto=format&fit=crop&w=900&q=80","p8":"https://images.unsplash.com/photo-1552602989-715150494024?auto=format&fit=crop&w=900&q=80","p9":"https://images.unsplash.com/photo-1569216961559-fd512349ebba?auto=format&fit=crop&w=900&q=80","p10":"https://images.unsplash.com/photo-1776417091038-df7f71687a1e?auto=format&fit=crop&w=900&q=80","p11":"https://images.unsplash.com/photo-1487755738157-c32022897246?auto=format&fit=crop&w=900&q=80","p12":"https://images.unsplash.com/photo-1542354642-233af003db87?auto=format&fit=crop&w=900&q=80"};
const $=id=>document.getElementById(id),all=(s,root=document)=>Array.from(root.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeImg=s=>{let u=String(s||'').trim();if(/^refsvg:(door|window|hardware|custom)-([1-9]|1[0-9])$/.test(u))return referenceArt(u);if(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(u))return u;try{let p=new URL(u);return p.protocol==='https:'?p.href:''}catch{return ''}};
const formatPrice=x=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(x);
const normalizeProductCode=value=>String(value??'').trim().toUpperCase().slice(0,32);
const isValidProductCode=code=>!code||/^[A-Z0-9][A-Z0-9._\/-]{0,31}$/.test(code);
const productCodeText=p=>p.code?' (Código: '+p.code+')':'';
const hasDuplicateProductCodes=items=>{
 const codes=items.map(p=>normalizeProductCode(p.code)).filter(Boolean);
 return new Set(codes).size!==codes.length;
};
// Catálogo publicado (catalogo.json). Se completa en load() antes del primer dibujo.
let DEFAULTS=[],PUBLISHED_CATEGORIES=[];
const fresh=()=>DEFAULTS.filter(p=>p&&typeof p==='object').map(x=>({...x}));let products=[],cart={},filter='Puertas',query='',sortMode='default',favorites=new Set(),detailId=null,delayed=null,installPrompt=null,adminSelectedCategory='Puertas';
function cleanCategory(value){
 const v=String(value||'').trim().replace(/\s+/g,' ').slice(0,45);
 if(!v||v.toLocaleLowerCase('es-AR')==='favoritos'||v.toLocaleLowerCase('es-AR')==='todas'||v.toLocaleLowerCase('es-AR')==='todos')return '';
 return v;
}
function buildCategoryList(custom=[],items=[]){
 const list=FIXED_CATEGORIES.slice();
 for(const item of [...(Array.isArray(custom)?custom:[]),...(Array.isArray(items)?items.map(x=>x?.category):[])]){
  const name=cleanCategory(item);
  if(name&&!list.some(v=>v.toLocaleLowerCase('es-AR')===name.toLocaleLowerCase('es-AR'))&&list.length<24)list.push(name);
 }
 return list;
}
function setCategories(custom,items){
 const categoryList=buildCategoryList(custom,items);
 CATEGORIES.splice(0,CATEGORIES.length,...categoryList);
}
function syncAdminCategories(){
 const select=$('admin-category'),chosen=select.value;
 select.innerHTML=CATEGORIES.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
 select.value=CATEGORIES.includes(chosen)?chosen:(CATEGORIES.includes(adminSelectedCategory)?adminSelectedCategory:'Puertas');
 const slot=$('site-custom-categories');
 if(slot)slot.innerHTML=CATEGORIES.slice(FIXED_CATEGORIES.length).map(c=>'<button type="button" class="site-menu-link site-menu-category" data-site-category="'+esc(c)+'" aria-pressed="'+String(filter===c)+'"><span class="site-menu-icon">▦</span>'+esc(c)+'<span class="site-menu-count" data-site-count="'+esc(c)+'">'+products.filter(p=>p.category===c).length+'</span><span class="site-menu-end">›</span></button>').join('');
}

function normalize(x){if(!x||typeof x!=='object')return null;const name=String(x.name||'').trim().slice(0,100);if(!name)return null;let val=x.price==null||x.price===''?null:Number(x.price);if(val!==null&&(!Number.isFinite(val)||val<0||val>999999999))val=null;return{id:String(x.id||('p'+Date.now()+Math.random())).slice(0,90),name,category:CATEGORIES.includes(x.category)?x.category:'Puertas',description:String(x.description||'').slice(0,350),price:val===null?null:Math.round(val),image:(/^refsvg:(door|window|hardware|custom)-([1-9]|1[0-9])$/.test(String(x.image||''))||(String(x.image||'').startsWith('data:image/svg+xml')&&String(x.image||'').includes('IMAGEN%20ILUSTRATIVA')))?String(x.image):safeImg(x.image),code:normalizeProductCode(x.code)}}
function getStored(k){try{return localStorage.getItem(k)}catch{return null}}
function setStored(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{toast('No se pudo guardar: almacenamiento lleno o bloqueado.');return false}}
async function loadPublishedCatalog(){
 // Mismo formato que "Guardar copia JSON" del panel: para publicar cambios para todos,
 // se exporta la copia desde el panel y se reemplaza catalogo.json.
 try{
  const response=await fetch('./catalogo.json',{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();
  if(data?.format!=='zenix-norte-demo-v1'||!Array.isArray(data.products))throw Error('Formato inválido');
  DEFAULTS=data.products.filter(p=>p&&typeof p==='object'&&p.id&&p.name).slice(0,150);
  PUBLISHED_CATEGORIES=Array.isArray(data.categories)?data.categories:[];
 }catch(err){
  console.error('No se pudo cargar catalogo.json',err);
  toast('No se pudo cargar el catálogo. Revisá la conexión y recargá la página.');
 }
}
async function load(){
 await loadPublishedCatalog();
 products=fresh();
 const raw=getStored(STORE);let localProducts=null,custom=[];
 if(raw!==null){try{const a=JSON.parse(raw);if(Array.isArray(a)&&a.length<=150)localProducts=a}catch{}}
 try{const saved=JSON.parse(getStored(CATEGORY_STORE)||'[]');if(Array.isArray(saved))custom=saved}catch{}
 setCategories(PUBLISHED_CATEGORIES.concat(custom),localProducts||DEFAULTS);
 if(localProducts)products=localProducts.map(normalize).filter(Boolean);
 syncAdminCategories();
 const c=getStored(CART_STORE);if(c){try{const t=JSON.parse(c);if(t&&typeof t==='object'&&!Array.isArray(t)){cart=t}}catch{}}const storedFav=getStored(FAV_STORE);if(storedFav){try{const f=JSON.parse(storedFav);if(Array.isArray(f))favorites=new Set(f.filter(id=>products.some(p=>p.id===id)))}catch{}}let upgraded=false;
for(const p of products){
 const d=DEFAULTS.find(d=>d.id===p.id);
 if(d&&p.name===d.name&&LEGACY_DEMO_IMAGES[p.id]&&p.image===LEGACY_DEMO_IMAGES[p.id]){p.image=d.image;upgraded=true;}
 // Migrar fotos de muestra antiguas sin sobrescribir imagenes personales.
 // Versiones previas guardaban tanto la clave refsvg: como el SVG convertido en data:.
 const oldPhoto=String(p.image||'');
 const legacyDrawing=/^refsvg:(door|window|hardware|custom)-([1-9]|1[0-9])$/.test(oldPhoto)
   || (oldPhoto.startsWith('data:image/svg+xml')&&oldPhoto.includes('IMAGEN%20ILUSTRATIVA'));
 if(d&&/^p(?:1[3-9]|[2-5][0-9]|6[0-4])$/.test(p.id)&&legacyDrawing){
  p.image=d.image;upgraded=true;
 }
 if(d&&p.id==='p5'&&p.name===d.name&&p.image==='https://zenix.com.ar/norte-aberturas-recursos/barral-puerta.svg'){p.image=d.image;upgraded=true;}
}
for(const p of products){
   if(['p35','p41','p63'].includes(p.id)&&p.image==="https://images.pexels.com/photos/32756058/pexels-photo-32756058.jpeg?auto=compress&cs=tinysrgb&w=900&q=80"){
    const def=DEFAULTS.find(x=>x.id===p.id);
    if(def&&def.name===p.name){p.image=def.image;upgraded=true;}
   }
  }
  if(upgraded)setStored(STORE,products);
if(raw!==null&&products.length>0&&products.length<=12&&products.every(p=>DEFAULTS.slice(0,12).some(d=>d.id===p.id))){
 const existing=new Set(products.map(p=>p.id));
 const additions=DEFAULTS.slice(12).filter(p=>!existing.has(p.id)).map(p=>({...p}));
 if(additions.length){const combined=products.concat(additions);if(setStored(STORE,combined))products=combined;}
}
cleanCart();renderAll()}
function cleanCart(){const ids=new Set(products.map(p=>p.id));Object.keys(cart).forEach(k=>{if(!ids.has(k)||!cart[k]||!Number.isFinite(Number(cart[k].qty)))delete cart[k];else{cart[k]={qty:Math.max(1,Math.min(99,Math.floor(Number(cart[k].qty)))),note:String(cart[k].note||'').slice(0,180)}}});setStored(CART_STORE,cart)}
function toast(s){const el=$('toast');el.textContent=s;el.classList.add('visible');clearTimeout(delayed);delayed=setTimeout(()=>el.classList.remove('visible'),2900)}

function renderAppShowcase(){
 const groups=[
   {id:'shop-featured-app-rail',preferred:['p1','p4','p10','p6','p13','p27','p42','p57'],offset:0},
   {id:'shop-new-app-rail',preferred:['p15','p31','p49','p58','p23','p34','p46','p63'],offset:4}
 ];
 for(const group of groups){
  const container=$(group.id);if(!container)continue;
  const saved=container.scrollLeft;
  const unique=group.preferred.map(id=>products.find(p=>p.id===id)).filter(Boolean);
  if(unique.length<4){for(const product of products.slice(group.offset)){if(unique.length===4)break;if(!unique.some(p=>p.id===product.id))unique.push(product)}}
  container.removeAttribute('data-static-gallery');
  container.innerHTML=unique.map(p=>{
   const photo=safeImg(p.image);
   const placeholder=p.category==='Puertas'?'🚪':p.category==='Ventanas'?'🪟':p.category==='Accesorios'?'🔩':'📐';
   return '<article class="shop-item" data-category="'+esc(p.category)+'"><div class="shop-img">'+(photo?'<img loading="lazy" src="'+esc(photo)+'" alt="Referencia de '+esc(p.name)+'">':'<div class="tile-placeholder">'+placeholder+'</div>')+'<small>'+esc(p.category)+'</small></div><div class="shop-cardbody"><small>CATÁLOGO DEMOSTRATIVO</small><h3>'+esc(p.name)+'</h3>'+'<div class="shop-price">'+(p.price===null?'Precio a consultar':formatPrice(p.price))+'</div><div class="shop-actions"><button type="button" class="shop-add" data-shop-app-add="'+esc(p.id)+'">🛒 Agregar</button><button type="button" class="shop-detail" data-shop-app-category="'+esc(p.category)+'" aria-label="Ver catálogo de '+esc(p.category)+'">Ver catálogo ↗</button></div></div></article>';
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
 filter='Todas';
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
 if(!catalogHasRendered||filter!=='Todas'||query||!$('catalog').childElementCount){
  query='';
  $('shop-search-app').value='';
  $('product-search').value='';
  filter='Todas';
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
  const total=products.filter(p=>p.category===category).length;
  const number=String(index+1).padStart(2,'0');
  return '<button class="shop-all-category" type="button" data-explore-category="'+esc(category)+'" aria-label="Ver '+esc(category)+', '+total+' '+(total===1?'producto':'productos')+'"><span class="shop-all-category-index">COLECCIÓN '+number+'</span><span class="shop-all-category-name">'+esc(category)+'</span><span class="shop-all-category-footer"><span>'+total+' '+(total===1?'producto':'productos')+'</span><span aria-hidden="true">↗</span></span></button>';
 }).join('');
}

function syncShopCategoryCounts(){
 const captions={Puertas:'Entradas con diseño y presencia',Ventanas:'Luz y ventilación para cada ambiente',Accesorios:'Herrajes y detalles de calidad','A medida':'Soluciones para proyectos especiales'};
 document.querySelectorAll('[data-shop-category-count]').forEach(el=>{
  const cat=el.dataset.shopCategoryCount;
  const n=products.filter(p=>p.category===cat).length;
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
 // No dibujar el panel oculto: puede tener cientos de fotos.
 if(!$('admin-modal').hidden)window.NorteAdmin?.render();
}


const CATALOG_PAGE_SIZE=12;
let catalogVisibleLimit=CATALOG_PAGE_SIZE;
let selectedViewKey='';
function syncCategorySidebar(){
  const active=filter;
  document.querySelectorAll('[data-site-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.siteCategory===active)));
  document.querySelectorAll('[data-site-count]').forEach(el=>{
    const category=el.dataset.siteCount;
    el.textContent=category==='Favoritos'?products.filter(p=>favorites.has(p.id)).length:products.filter(p=>p.category===category).length;
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
 filter=(CATEGORIES.includes(category)||category==='Todas'||category==='Favoritos')?category:'Todas';
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
 let visible=products.filter(p=>(filter==='Todas'||(filter==='Favoritos'?favorites.has(p.id):p.category===filter))&&[p.name,p.category,p.description].some(s=>s.toLocaleLowerCase('es-AR').includes(q)));
 if(sortMode==='az')visible.sort((a,b)=>a.name.localeCompare(b.name,'es-AR'));
 else if(sortMode==='za')visible.sort((a,b)=>b.name.localeCompare(a.name,'es-AR'));
 else if(sortMode==='category')visible.sort((a,b)=>a.category.localeCompare(b.category,'es-AR')||a.name.localeCompare(b.name,'es-AR'));
 syncCategorySidebar();syncCatalogMore(visible.length);$('result-count').textContent=visible.length+' '+(visible.length===1?'producto':'productos');
 const shownProducts=visible.slice(0,catalogVisibleLimit);
 $('empty-search').hidden=visible.length!==0;
 $('catalog').innerHTML=shownProducts.map(p=>{
 const image=safeImg(p.image);
 const label=p.category==='Puertas'?'🚪':p.category==='Ventanas'?'🪟':p.category==='Accesorios'?'🔩':'📐';
 return '<article class="tile"><div class="tile-picture">'+(image?'<img loading="lazy" src="'+esc(image)+'" alt="Imagen de referencia de '+esc(p.name)+'">':'<div class="tile-placeholder" aria-hidden="true">'+label+'</div>')+'<span class="demo-tag">Referencia</span><button type="button" class="tile-fav" data-favorite="'+esc(p.id)+'" aria-label="'+(favorites.has(p.id)?'Quitar de favoritos: ':'Guardar como favorito: ')+esc(p.name)+'" aria-pressed="'+favorites.has(p.id)+'">'+(favorites.has(p.id)?'♥':'♡')+'</button></div><div class="tileinfo"><span class="category">'+esc(p.category)+'</span><h3>'+esc(p.name)+'</h3>'+'<p>'+esc(p.description)+'</p><div class="tilebottom"><span class="price'+(p.price===null?' unspecified':'')+'">'+(p.price===null?'Precio a consultar':formatPrice(p.price))+'</span></div><button class="tile-details" type="button" data-detail="'+esc(p.id)+'">Ver detalles ↗</button><button class="btn btn-primary tile-add" type="button" data-add="'+esc(p.id)+'">🛒 Agregar al carrito</button></div></article>'
 }).join('');
 all('[data-add]',$('catalog')).forEach(b=>b.addEventListener('click',()=>addToCart(b.dataset.add)));
 all('[data-detail]',$('catalog')).forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.detail)));
 all('[data-favorite]',$('catalog')).forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.favorite;if(favorites.has(id))favorites.delete(id);else favorites.add(id);setStored(FAV_STORE,[...favorites]);renderCatalog();toast(favorites.has(id)?'Guardado en favoritos':'Quitado de favoritos')}));
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
       favorites.has(id)?favorites.delete(id):favorites.add(id);
       setStored(FAV_STORE,[...favorites]);renderCatalog();
       toast(favorites.has(id)?'Guardado en favoritos':'Quitado de favoritos');
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
 if(!products.some(p=>p.id===id))return;
 const wasEmpty=!Object.entries(cart).some(([key,entry])=>products.some(p=>p.id===key)&&Number(entry?.qty)>0);
 const item=cart[id]||{qty:0,note:''};
 item.qty=Math.min(99,item.qty+1);
 cart[id]=item;
 setStored(CART_STORE,cart);
 renderCart();
 toast(wasEmpty?'¡Producto agregado al carrito!':'¡Agregado! Podés seguir eligiendo productos.');
 if(wasEmpty)showPanel('cart-drawer');
}
function renderCart(){let items=Object.entries(cart).map(([id,item])=>({p:products.find(p=>p.id===id),item})).filter(x=>x.p);let sum=items.reduce((n,x)=>n+x.item.qty,0);$('cart-count').textContent=sum;$('sticky-cart-count').textContent=sum+(sum===1?' producto':' productos');$('sticky-cart').hidden=sum===0;$('cart-form').hidden=items.length===0;
$('cart-items').innerHTML=items.length?items.map(({p,item})=>'<div class="cartitem"><div class="cart-thumb">'+(safeImg(p.image)?'<img src="'+esc(safeImg(p.image))+'" alt="">':'<div class="tile-placeholder">🚪</div>')+'</div><div class="cartitem-info"><strong>'+esc(p.name)+'</strong>'+'<small>'+esc(p.category)+'</small><div class="qty-controls"><button type="button" aria-label="Quitar una unidad de '+esc(p.name)+'" data-qty="-1" data-id="'+esc(p.id)+'">−</button><span>'+item.qty+'</span><button type="button" aria-label="Agregar una unidad de '+esc(p.name)+'" data-qty="1" data-id="'+esc(p.id)+'">+</button><button type="button" class="remove" data-remove="'+esc(p.id)+'">Quitar</button></div><input class="item-note" type="text" maxlength="180" data-note="'+esc(p.id)+'" placeholder="Medidas o detalles (opcional)" value="'+esc(item.note)+'"></div></div>').join(''):'<div class="emptycart"><b>Tu carrito está vacío.</b>Explorá productos y agregalos para preparar tu pedido.</div>';
const valued=items.filter(x=>x.p.price!==null);const total=valued.reduce((s,x)=>s+x.p.price*x.item.qty,0);
$('cart-estimate').textContent=valued.length===0?'A consultar':formatPrice(total)+(valued.length<items.length?' + a consultar':'');
$('send-quote').disabled=items.length===0;
all('[data-qty]',$('cart-items')).forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.id;cart[id].qty=Math.min(99,cart[id].qty+Number(b.dataset.qty));if(cart[id].qty<=0)delete cart[id];setStored(CART_STORE,cart);renderCart()}));
all('[data-remove]',$('cart-items')).forEach(b=>b.addEventListener('click',()=>{delete cart[b.dataset.remove];setStored(CART_STORE,cart);renderCart()}));
all('[data-note]',$('cart-items')).forEach(b=>b.addEventListener('input',()=>{if(cart[b.dataset.note]){cart[b.dataset.note].note=b.value.slice(0,180);setStored(CART_STORE,cart)}}));
}
function openWhatsApp(message){const a=document.createElement('a');a.href='https://wa.me/'+PHONE+'?text='+encodeURIComponent(message);a.target='_blank';a.rel='noopener noreferrer';document.body.append(a);a.click();a.remove()}
function submitQuote(){const items=Object.entries(cart).map(([id,item])=>({p:products.find(p=>p.id===id),item})).filter(x=>x.p);if(!items.length)return toast('Primero agregá al menos un producto.');let name=$('customer-name').value.trim().slice(0,80),city=$('customer-location').value.trim().slice(0,100);let text='¡Hola! 👋 Estuve viendo el catálogo de Norte Aberturas y quisiera consultar por los siguientes productos:\n\n'+items.map(({p,item},i)=>(i+1)+'. '+p.name+productCodeText(p)+' — cantidad: '+item.qty+(item.note?'\n   Medidas/detalles: '+item.note:'')).join('\n')+'\n\n';if(name)text+='Nombre: '+name+'\n';if(city)text+='Ciudad/provincia: '+city+'\n';text+='¿Podrían confirmarme disponibilidad, opciones y presupuesto? ¡Muchas gracias!';openWhatsApp(text)}
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

function hidePanels(){$('overlay').hidden=true;$('cart-drawer').hidden=true;$('admin-modal').hidden=true;$('detail-modal').hidden=true;$('consulta-modal').hidden=true;document.body.style.overflow=''}
function showPanel(which){hidePanels();$('overlay').hidden=false;$(which).hidden=false;document.body.style.overflow='hidden';if(which==='admin-modal')window.NorteAdmin?.setScreen('home');$(which).querySelector('button:not([hidden])')?.focus()}
function openDetail(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 detailId=id;const image=safeImg(p.image);
 $('detail-photo').innerHTML=image?'<img src="'+esc(image)+'" alt="Imagen de referencia de '+esc(p.name)+'">':'<div class="detail-placeholder">'+(p.category==='Puertas'?'🚪':p.category==='Ventanas'?'🪟':'🔩')+'</div>';
 $('detail-cat').textContent=p.category;$('detail-title').textContent=p.name;
 $('detail-desc').textContent=(p.description||'Consultá por modelos, medidas y terminaciones disponibles.')+' Los productos reales se confirman con Norte Aberturas.';
 $('detail-price').textContent=p.price===null?'A consultar':formatPrice(p.price);
 const related=products.filter(x=>x.category===p.category&&x.id!==id).slice(0,3);
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
all('.chip').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;all('.chip').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCatalog()}));
$('product-search').addEventListener('input',e=>{query=e.target.value.trim();renderCatalog()});$('product-sort').addEventListener('change',e=>{sortMode=e.target.value;renderCatalog()});
$('reset-search').addEventListener('click',()=>{$('product-search').value='';query='';filter='Todas';sortMode='default';$('product-sort').value='default';all('.chip').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='Todas')));renderCatalog()});
['cart-open','mobile-list','sticky-cart-open'].forEach(id=>{const button=$(id);if(button)button.addEventListener('click',()=>showPanel('cart-drawer'))});$('continue-shopping').addEventListener('click',()=>{hidePanels();window.norteEnsureCatalog();window.norteScrollCatalog()});
['admin-open','mobile-admin'].forEach(id=>{const button=$(id);if(button)button.addEventListener('click',openAdmin)});
$('cta-list').addEventListener('click',()=>{showPanel('consulta-modal');$('consulta-name').focus()});
$('consulta-form').addEventListener('submit',sendGeneralInquiry);
['cart-close','admin-close','detail-close','consulta-close','overlay'].forEach(id=>$(id).addEventListener('click',hidePanels));
document.addEventListener('keydown',e=>{if(e.key==='Escape')hidePanels()});
$('send-quote').addEventListener('click',submitQuote);$('detail-add').addEventListener('click',()=>{if(detailId)addToCart(detailId)});$('detail-wa').addEventListener('click',()=>{const p=products.find(x=>x.id===detailId);if(p)openWhatsApp('¡Hola! Vi el catálogo de Norte Aberturas y quisiera consultar por '+p.name+'. ¿Podrían enviarme modelos, medidas y precios disponibles? ¡Gracias!')});
const mobileCatalogMedia=window.matchMedia('(max-width:760px)');
mobileCatalogMedia.addEventListener('change',()=>{if(document.body.classList.contains('catalog-browsing'))renderCatalog()});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});
$('mobile-home').addEventListener('click',()=>{document.getElementById('inicio').scrollIntoView({behavior:'smooth'})});
$('mobile-catalog').addEventListener('click',()=>{window.norteEnsureCatalog();window.norteScrollCatalog()});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{}));
// El panel de autogestión se descarga recién cuando alguien lo abre.
const app={
 get products(){return products},set products(v){products=v},
 get cart(){return cart},set cart(v){cart=v},
 get filter(){return filter},set filter(v){filter=v},
 get adminSelectedCategory(){return adminSelectedCategory},set adminSelectedCategory(v){adminSelectedCategory=v},
 get installPrompt(){return installPrompt},set installPrompt(v){installPrompt=v},
 get publishedCategories(){return PUBLISHED_CATEGORIES.slice()},
 $,all,esc,safeImg,formatPrice,normalizeProductCode,isValidProductCode,hasDuplicateProductCodes,
 CATEGORIES,FIXED_CATEGORIES,STORE,CART_STORE,CATEGORY_STORE,fresh,cleanCategory,buildCategoryList,
 setCategories,syncAdminCategories,normalize,getStored,setStored,cleanCart,renderAll,toast
};
window.NorteApp=app;
let adminLoader=null;
function loadAdmin(){
 if(window.NorteAdmin)return Promise.resolve(window.NorteAdmin);
 if(!adminLoader)adminLoader=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='./js/admin.js';
  script.onload=()=>window.NorteAdmin?resolve(window.NorteAdmin):reject(Error('El panel no inició'));
  script.onerror=()=>reject(Error('No se pudo descargar el panel'));
  document.head.appendChild(script);
 }).catch(err=>{adminLoader=null;throw err});
 return adminLoader;
}
function openAdmin(){
 loadAdmin().then(admin=>{admin.render();showPanel('admin-modal')})
  .catch(err=>{console.error(err);toast('No se pudo abrir el panel. Revisá la conexión y volvé a intentar.')});
}
initCategorySidebar();load();
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
