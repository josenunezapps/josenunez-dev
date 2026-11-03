/* Norte Aberturas · Núcleo compartido por la tienda (index.html) y el panel (admin/).
   Catálogo publicado (catalogo.json), datos guardados en el navegador, migraciones y utilidades. */

/* Única fuente del número de versión: se muestra en la franja superior y nombra la caché del service worker. */
const NORTE_VERSION='r60';
{const build=document.getElementById('norte-app-build');if(build)build.textContent=NORTE_VERSION;}

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


(()=>{
'use strict';
// Carpeta raíz de la app, para que las rutas funcionen igual desde la tienda y desde /admin/.
const ROOT=new URL('../',document.currentScript.src);
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
const fresh=()=>DEFAULTS.filter(p=>p&&typeof p==='object').map(x=>({...x}));let products=[],cart={},filter='Puertas',favorites=new Set(),delayed=null,adminSelectedCategory='Puertas';
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
 const select=$('admin-category');
 if(select){
  const chosen=select.value;
  select.innerHTML=CATEGORIES.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
  select.value=CATEGORIES.includes(chosen)?chosen:(CATEGORIES.includes(adminSelectedCategory)?adminSelectedCategory:'Puertas');
 }
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
  const response=await fetch(new URL('catalogo.json',ROOT),{cache:'no-store'});
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
cleanCart();app.renderAll()}
function cleanCart(){const ids=new Set(products.map(p=>p.id));Object.keys(cart).forEach(k=>{if(!ids.has(k)||!cart[k]||!Number.isFinite(Number(cart[k].qty)))delete cart[k];else{cart[k]={qty:Math.max(1,Math.min(99,Math.floor(Number(cart[k].qty)))),note:String(cart[k].note||'').slice(0,180)}}});setStored(CART_STORE,cart)}
function toast(s){const el=$('toast');el.textContent=s;el.classList.add('visible');clearTimeout(delayed);delayed=setTimeout(()=>el.classList.remove('visible'),2900)}
const app={
 ROOT,PHONE,
 get products(){return products},set products(v){products=v},
 get cart(){return cart},set cart(v){cart=v},
 get filter(){return filter},set filter(v){filter=v},
 get favorites(){return favorites},set favorites(v){favorites=v},
 get adminSelectedCategory(){return adminSelectedCategory},set adminSelectedCategory(v){adminSelectedCategory=v},
 get publishedCategories(){return PUBLISHED_CATEGORIES.slice()},
 $,all,esc,safeImg,formatPrice,normalizeProductCode,isValidProductCode,productCodeText,hasDuplicateProductCodes,
 CATEGORIES,FIXED_CATEGORIES,STORE,CART_STORE,FAV_STORE,CATEGORY_STORE,fresh,cleanCategory,buildCategoryList,
 setCategories,syncAdminCategories,normalize,getStored,setStored,cleanCart,toast,
 // Cada página define cómo se redibuja y después llama a start().
 renderAll(){},
 start(){return load()}
};
window.NorteApp=app;
// Si el catálogo cambia en otra pestaña (por ejemplo, desde el panel), se recarga acá también.
window.addEventListener('storage',e=>{if(e.key===STORE||e.key===CATEGORY_STORE)load()});
})();
