/* Norte Aberturas · Panel de catálogo (autogestión), página admin/.
   No se enlaza desde la tienda. Usa el núcleo de js/nucleo.js (window.NorteApp). */
(function(app){
'use strict';
const {$,all,esc,safeImg,formatPrice,normalizeProductCode,isValidProductCode,hasDuplicateProductCodes,
 CATEGORIES,FIXED_CATEGORIES,STORE,CART_STORE,CATEGORY_STORE,fresh,cleanCategory,buildCategoryList,
 setCategories,syncAdminCategories,normalize,getStored,setStored,cleanCart,toast}=app;
const renderAll=()=>app.renderAll();
let editing=null,uploaded=null;
const adminOpenGroups=new Set(),adminVisibleLimits=new Map();
const ADMIN_SCREEN_TITLES={home:'Panel de catálogo',product:'Nuevo producto',category:'Crear apartado',data:'Administración de datos'};
let adminActiveScreen='home';
function setAdminScreen(screen){
 if(!Object.hasOwn(ADMIN_SCREEN_TITLES,screen))return;
 adminActiveScreen=screen;
 document.querySelectorAll('#admin-modal [data-admin-screen]').forEach(section=>{
  section.hidden=section.dataset.adminScreen!==screen;
 });
 $('admin-title').textContent=screen==='product'?$('admin-form-title').textContent:ADMIN_SCREEN_TITLES[screen];
 $('admin-back').hidden=screen==='home';
 $('admin-data-toggle').setAttribute('aria-expanded',String(screen==='data'));
 $('admin-data-manager').hidden=screen!=='data';
 $('admin-form').hidden=screen!=='product';
 $('admin-category-form').hidden=screen!=='category';
 const body=$('admin-modal').querySelector('.modalbody');
 if(body)body.scrollTop=0;
 if(screen==='home'&&!$('admin-modal').hidden)renderAdmin();
}
function adminReturnHome(){
 editing=null;uploaded=null;
 $('admin-category-name').value='';
 setAdminScreen('home');
}
function adminProductRows(items){
 if(!items.length)return '<p class="admin-empty-category">Este apartado todavía no tiene productos que coincidan.</p>';
 return items.map(p=>{
  const image=safeImg(p.image);
  return '<div class="admin-row"><div class="admin-thumb">'+(image?'<img loading="lazy" decoding="async" src="'+esc(image)+'" alt="">':'<div class="tile-placeholder">▦</div>')+'</div><div class="admin-title"><b>'+esc(p.name)+'</b><small>'+(p.code?'Código: '+esc(p.code)+' · ':'')+esc(p.category)+' · '+(p.price===null?'Sin precio':formatPrice(p.price))+'</small></div><button class="smallbtn" type="button" data-edit="'+esc(p.id)+'">Editar</button><button class="smallbtn danger" type="button" data-delete="'+esc(p.id)+'">Quitar</button></div>';
 }).join('');
}
function adminGroupContent(category,items,total,q){
 const fixed=FIXED_CATEGORIES.includes(category);
 const limit=adminVisibleLimits.get(category)||8,visible=items.slice(0,limit),remaining=items.length-visible.length;
 return '<div class="admin-group-actions"><button type="button" class="smallbtn strong" data-new-in="'+esc(category)+'">+ Agregar producto</button>'+(!fixed&&!total?'<button type="button" class="smallbtn danger" data-remove-category="'+esc(category)+'">Eliminar apartado vacío</button>':'')+'</div>'+adminProductRows(visible)+(remaining?'<button type="button" class="admin-show-more" data-admin-show-more="'+esc(category)+'">Ver '+Math.min(8,remaining)+' productos más <span>('+visible.length+' de '+items.length+')</span> ↓</button>':'');
}
function renderAdmin(){
 const box=$('admin-list'),q=$('admin-product-search').value.trim().toLocaleLowerCase('es-AR');
 const matches=app.products.filter(p=>[p.name,p.code,p.category,p.description].some(v=>String(v||'').toLocaleLowerCase('es-AR').includes(q)));
 $('admin-search-summary').textContent=(q?matches.length+' resultados':'Total: '+app.products.length+' productos')+' · '+CATEGORIES.length+' apartados'+(q?' · búsqueda activa':' · tocá un apartado para ver sus productos');
 const entries=CATEGORIES.map(category=>{
  const categoryProducts=app.products.filter(p=>p.category===category);
  const categoryMatches=category.toLocaleLowerCase('es-AR').includes(q);
  const visible=q?(categoryMatches?categoryProducts:categoryProducts.filter(p=>[p.name,p.code,p.description].some(v=>String(v||'').toLocaleLowerCase('es-AR').includes(q)))):categoryProducts;
  return{category,categoryProducts,visible};
 }).filter(group=>!q||group.visible.length>0||group.category.toLocaleLowerCase('es-AR').includes(q));
 box.innerHTML=entries.length?entries.map(({category,categoryProducts,visible})=>{
  const open=!!q||adminOpenGroups.has(category);
  // El contenido se genera solo al abrir un apartado; los cerrados no cargan imágenes.
  return '<details class="admin-category-group" data-admin-folder="'+esc(category)+'"'+(open?' open':'')+'><summary><span class="admin-folder" aria-hidden="true">▤</span><span class="admin-group-name"><strong>'+esc(category)+'</strong><small>Catálogo de '+esc(category.toLocaleLowerCase('es-AR'))+'</small></span><span class="admin-group-count">'+categoryProducts.length+' '+(categoryProducts.length===1?'producto':'productos')+'</span><span class="admin-group-arrow" aria-hidden="true"><svg viewBox="0 0 24 14" width="19" height="13" focusable="false"><path d="M3 3 L12 9 L21 3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></summary><div class="admin-group-body" data-admin-body>'+((open)?adminGroupContent(category,visible,categoryProducts.length,q):'')+'</div></details>';
 }).join(''):'<div class="admin-zero">No encontramos productos ni apartados que coincidan. Probá otro término.</div>';
 all('[data-admin-folder]',box).forEach(group=>group.addEventListener('toggle',()=>{
  if(q)return;
  const category=group.dataset.adminFolder,content=group.querySelector('[data-admin-body]');
  if(group.open){
   adminOpenGroups.add(category);app.adminSelectedCategory=category;
   // Evitar reconstruirlo dos veces si <details> dispara toggle al inicializar.
   if(!content.childElementCount){
    const items=app.products.filter(p=>p.category===category);
    content.innerHTML=adminGroupContent(category,items,items.length,'');
   }
  }else{
   adminOpenGroups.delete(category);
   content.replaceChildren();
  }
 }));
}
function createAdminCategory(e){
 e.preventDefault();
 const name=cleanCategory($('admin-category-name').value);
 if(!name)return toast('Ingresá un nombre válido para el apartado');
 if(CATEGORIES.some(c=>c.toLocaleLowerCase('es-AR')===name.toLocaleLowerCase('es-AR')))return toast('Ese apartado ya existe');
 if(CATEGORIES.length>=24)return toast('Máximo 24 apartados en esta demostración');
 const custom=CATEGORIES.slice(FIXED_CATEGORIES.length).concat(name);
 if(!setStored(CATEGORY_STORE,custom))return;
 CATEGORIES.push(name);app.adminSelectedCategory=name;adminOpenGroups.add(name);
 $('admin-product-search').value='';$('admin-category-name').value='';
 syncAdminCategories();$('admin-category').value=name;setAdminScreen('home');renderAll();toast('Apartado "'+name+'" creado en este dispositivo');
}
function removeAdminCategory(name){
 if(FIXED_CATEGORIES.includes(name)||!CATEGORIES.includes(name))return;
 if(app.products.some(p=>p.category===name))return toast('Quitá o trasladá los productos antes de eliminar este apartado');
 if(!confirm('¿Eliminar el apartado vacío "'+name+'"?'))return;
 const next=CATEGORIES.filter(c=>c!==name);
 if(!setStored(CATEGORY_STORE,next.slice(FIXED_CATEGORIES.length)))return;
 CATEGORIES.splice(0,CATEGORIES.length,...next);adminOpenGroups.delete(name);
 if(app.filter===name)app.filter='Puertas';
 syncAdminCategories();renderAll();toast('Apartado eliminado');
}
function editProduct(id){editing=id||null;uploaded=null;const p=app.products.find(x=>x.id===id);$('admin-form-title').textContent=p?'Editar producto':'Agregar producto';$('admin-name').value=p?.name||'';$('admin-code').value=p?.code||'';syncAdminCategories();$('admin-category').value=p?.category||(CATEGORIES.includes(app.adminSelectedCategory)?app.adminSelectedCategory:'Puertas');$('admin-price').value=p?.price??'';$('admin-description').value=p?.description||'';$('admin-image').value=p&&p.image&&!p.image.startsWith('data:')?p.image:'';$('admin-upload').value='';setAdminScreen('product');$('admin-name').focus()}
function deleteProduct(id){let p=app.products.find(x=>x.id===id);if(!p||!confirm('¿Quitar "'+p.name+'" del catálogo de demostración?'))return;const next=app.products.filter(x=>x.id!==id);if(!setStored(STORE,next))return;app.products=next;delete app.cart[id];cleanCart();renderAll();toast('Producto quitado del catálogo local')}
async function photoToDataURL(file){if(file.size>8*1024*1024)throw Error('La foto supera 8 MB');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Formato no admitido');return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('No se pudo leer la imagen'));reader.onload=()=>{const image=new Image();image.onerror=()=>reject(Error('Imagen inválida'));image.onload=()=>{let scale=Math.min(1,850/Math.max(image.width,image.height));const cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(image.width*scale));cv.height=Math.max(1,Math.round(image.height*scale));cv.getContext('2d').drawImage(image,0,0,cv.width,cv.height);resolve(cv.toDataURL('image/webp',.66))};image.src=reader.result};reader.readAsDataURL(file)})}
async function saveProduct(e){e.preventDefault();const nm=$('admin-name').value.trim();if(!nm)return toast('Completá el nombre del producto');if(!editing&&app.products.length>=150)return toast('Máximo 150 productos en la demo');
const rawCode=$('admin-code').value.trim();
const code=normalizeProductCode(rawCode);
if(rawCode.length>32||!isValidProductCode(code)){toast('Código inválido: hasta 32 caracteres, sin espacios ni símbolos especiales');$('admin-code').focus();return;}
if(code&&app.products.some(p=>p.id!==editing&&normalizeProductCode(p.code)===code)){toast('Este código ya está asignado a otro producto');$('admin-code').focus();return;}
const before=app.products.find(x=>x.id===editing);let image=$('admin-image').value.trim();if(image&&!safeImg(image))return toast('La foto debe tener una URL HTTPS válida');if(uploaded)image=uploaded;else if(before&&before.image.startsWith('data:')&&!image)image=before.image;else if(before&&!image)image=before.image;
if(!CATEGORIES.includes($('admin-category').value))return toast('Elegí un apartado válido');
let rawPrice=$('admin-price').value.trim(),p=normalize({id:editing||('p'+Date.now()+'_'+Math.random().toString(36).slice(2,8)),name:nm,code,category:$('admin-category').value,description:$('admin-description').value.trim(),price:rawPrice===''?null:Number(rawPrice),image});if(!p)return;const next=editing?app.products.map(x=>x.id===editing?p:x):[p,...app.products];if(!setStored(STORE,next))return;app.products=next;editing=null;uploaded=null;setAdminScreen('home');renderAll();toast('Producto guardado en este dispositivo')}
/* PDF de respaldo administrativo: genera un archivo legible sin alterar datos locales. */
let nortePdfLibraryPromise=null;
function norteLoadPdfLibrary(){
 if(window.jspdf&&window.jspdf.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
 if(nortePdfLibraryPromise)return nortePdfLibraryPromise;
 nortePdfLibraryPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=new URL('vendor/jspdf.umd.min.js',app.ROOT).href;
  script.async=true;
  script.onload=()=>window.jspdf?.jsPDF?resolve(window.jspdf.jsPDF):reject(Error('La biblioteca de PDF no se pudo iniciar'));
  script.onerror=()=>reject(Error('No se pudo cargar el generador de PDF. Revisá la conexión a Internet.'));
  document.head.appendChild(script);
 }).catch(err=>{nortePdfLibraryPromise=null;throw err;});
 return nortePdfLibraryPromise;
}
function nortePdfText(value){
 return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/[\u2012-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2022\u2026]/g,' ').replace(/[\ud800-\udfff]/g,'').trim();
}
async function nortePdfPhoto(src){
 if(!src||!(/^(https:\/\/|data:image\/)/i.test(src)))return null;
 return new Promise(resolve=>{
  const image=new Image();
  let finished=false;
  const finish=data=>{if(finished)return;finished=true;clearTimeout(timeout);image.onload=null;image.onerror=null;resolve(data);};
  const timeout=setTimeout(()=>finish(null),3200);
  image.crossOrigin='anonymous';
  image.onload=()=>{
   try{
    const canvas=document.createElement('canvas');
    const scale=Math.min(1,420/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height));
    canvas.width=Math.max(1,Math.round((image.naturalWidth||image.width)*scale));
    canvas.height=Math.max(1,Math.round((image.naturalHeight||image.height)*scale));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    finish({data:canvas.toDataURL('image/jpeg',.64),width:canvas.width,height:canvas.height});
   }catch{finish(null);}
  };
  image.onerror=()=>finish(null);
  image.src=src;
 });
}
async function nortePreparePdfPhotos(items){
 const photos=new Map();
 const entries=items.map(p=>[p.id,safeImg(p.image)]).filter(([,url])=>!!url);
 let next=0;
 await Promise.all(Array.from({length:Math.min(6,entries.length)},async()=>{
  while(next<entries.length){
   const [id,url]=entries[next++];
   photos.set(id,await nortePdfPhoto(url));
  }
 }));
 return photos;
}
async function exportPDF(){
 const button=$('export-pdf');
 if(button.disabled)return;
 const label=button.textContent;
 button.disabled=true;
 button.textContent='Preparando PDF…';
 try{
  const JsPDF=await norteLoadPdfLibrary();
  const reportProducts=app.products.map(p=>({...p}));
  const reportCategories=CATEGORIES.slice();
  const photos=await nortePreparePdfPhotos(reportProducts);
  const pdf=new JsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true,putOnlyUsedFonts:true});
  pdf.setProperties({title:'Norte Aberturas - Catálogo administrativo',subject:'Respaldo legible del catálogo de productos',author:'Norte Aberturas'});
  const W=210,H=297,M=17,R=W-M;
  const dark=[22,54,41],forest=[42,83,61],gold=[183,136,80],mute=[91,109,96];
  const rgb=c=>pdf.setTextColor(...c);
  const fill=c=>pdf.setFillColor(...c);
  const rule=(y)=>{pdf.setDrawColor(220,226,216);pdf.setLineWidth(.25);pdf.line(M,y,R,y);};
  const tx=(val,x,y,size=10,font='helvetica',weight='normal',color=dark)=>{
   pdf.setFont(font,weight);pdf.setFontSize(size);rgb(color);pdf.text(nortePdfText(val),x,y);
  };
  function pageHeader(category,index){
   fill(dark);pdf.rect(0,0,W,19,'F');
   tx('NORTE ABERTURAS',M,12,10,'helvetica','bold',[255,253,247]);
   pdf.setFont('helvetica','normal');pdf.setFontSize(8);rgb([225,211,190]);pdf.text('COPIA ADMINISTRATIVA · '+(index+1).toString().padStart(2,'0'),R,12,{align:'right'});
   pdf.setFont('times','normal');pdf.setFontSize(27);rgb(dark);
   const catLines=pdf.splitTextToSize(nortePdfText(category),175);
   pdf.text(catLines,M,37);
   const bottom=37+(catLines.length-1)*9;
   fill(gold);pdf.rect(M,bottom+4,19,1,'F');
   tx('FICHAS DE PRODUCTOS',M,bottom+12,8,'helvetica','bold',mute);
   return bottom+19;
  }
  // Carátula del informe.
  fill(dark);pdf.rect(0,0,W,78,'F');
  fill(gold);pdf.rect(M,19,25,1.1,'F');
  tx('NORTE ABERTURAS',M,31,12,'helvetica','bold',[255,253,247]);
  tx('CATÁLOGO',M,48,32,'times','normal',[255,253,247]);
  tx('ADMINISTRATIVO',M,62,22,'times','normal',[231,212,180]);
  tx('Documento de respaldo · Uso interno',M,72,9,'helvetica','normal',[226,229,217]);
  const when=new Date().toLocaleString('es-AR',{dateStyle:'medium',timeStyle:'short'});
  tx('Generado: '+when,M,91,9,'helvetica','normal',mute);
  rule(96);
  fill([240,245,237]);pdf.roundedRect(M,105,84,26,2,2,'F');
  fill([246,242,235]);pdf.roundedRect(M+92,105,84,26,2,2,'F');
  tx(String(reportCategories.length),M+9,118,19,'times','normal',dark);
  tx('APARTADOS',M+29,118,9,'helvetica','bold',mute);
  tx(String(reportProducts.length),M+101,118,19,'times','normal',dark);
  tx('PRODUCTOS',M+121,118,9,'helvetica','bold',mute);
  tx('ÍNDICE DE CATEGORÍAS',M,149,11,'helvetica','bold',dark);
  let indexY=160;
  reportCategories.forEach((cat,i)=>{
   if(indexY>264){pdf.addPage();indexY=35;tx('ÍNDICE DE CATEGORÍAS (CONTINUACIÓN)',M,22,11,'helvetica','bold',dark);}
   tx((i+1).toString().padStart(2,'0'),M,indexY,10,'helvetica','bold',gold);
   const category=pdf.splitTextToSize(nortePdfText(cat),112);
   tx(category[0]||cat,M+17,indexY,10,'helvetica','normal',dark);
   pdf.setFont('helvetica','normal');pdf.setFontSize(9);rgb(mute);pdf.text(String(reportProducts.filter(p=>p.category===cat).length)+' productos',R,indexY,{align:'right'});
   rule(indexY+3);indexY+=8;
  });
  // Fichas agrupadas, incluyendo categorías vacías.
  reportCategories.forEach((category,categoryIndex)=>{
   pdf.addPage();
   let y=pageHeader(category,categoryIndex);
   const group=reportProducts.filter(p=>p.category===category);
   if(!group.length){tx('Este apartado todavía no tiene productos cargados.',M,y+13,10,'helvetica','normal',mute);return;}
   group.forEach((product,i)=>{
    const titleLines=pdf.splitTextToSize(nortePdfText(product.name)||'Sin nombre',113);
    const description=String(product.description||'').trim();
    const descLines=pdf.splitTextToSize(nortePdfText(description)||'Sin descripción cargada',108);
    const photo=photos.get(product.id);
    const hasLink=/^https:\/\//i.test(String(product.image||''));
    const cardHeight=Math.max(79,56+titleLines.length*6+descLines.length*4.25+(hasLink?8:0));
    if(y+cardHeight>H-22){pdf.addPage();y=pageHeader(category,categoryIndex);}
    fill([250,251,247]);pdf.setDrawColor(217,227,216);pdf.setLineWidth(.3);
    pdf.roundedRect(M,y,R-M,cardHeight-5,2,2,'FD');
    fill(gold);pdf.rect(M+6,y+9,14,.8,'F');
    const imageX=M+7,imageY=y+16,imageW=45,imageH=42;
    fill([231,237,229]);pdf.roundedRect(imageX,imageY,imageW,imageH,1,1,'F');
    if(photo?.data){
     try{
      const ratio=photo.width/photo.height;let dw=imageW,dh=dw/ratio;
      if(dh>imageH){dh=imageH;dw=dh*ratio;}
      pdf.addImage(photo.data,'JPEG',imageX+(imageW-dw)/2,imageY+(imageH-dh)/2,dw,dh,undefined,'FAST');
     }catch{tx('IMAGEN',imageX+9,imageY+22,9,'helvetica','bold',mute);}
    }else{
     tx(product.image?'Foto de':'Sin imagen',imageX+5,imageY+19,9,'helvetica','normal',mute);
     if(product.image)tx('referencia',imageX+5,imageY+25,9,'helvetica','normal',mute);
    }
    const x=M+60;
    tx('ARTÍCULO '+String(i+1).padStart(2,'0'),x,y+14,8,'helvetica','bold',gold);
    pdf.setFont('helvetica','bold');pdf.setFontSize(12);rgb(dark);
    pdf.text(titleLines,x,y+22);
    let detailY=y+23+titleLines.length*6;
    tx('Código interno: '+(product.code||'Sin código'),x,detailY,9,'helvetica','normal',forest);detailY+=6;
    tx('Precio: '+(product.price==null?'A consultar':new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(product.price)),x,detailY,9,'helvetica','normal',forest);detailY+=7;
    tx('DESCRIPCIÓN',x,detailY,8,'helvetica','bold',mute);detailY+=5;
    pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);rgb(dark);
    pdf.text(descLines,x,detailY,{lineHeightFactor:1.24});
    detailY+=descLines.length*4.25+3;
    if(hasLink){
     tx('Abrir foto original (enlace)',x,detailY,8,'helvetica','normal',forest);
     pdf.link(x,detailY-4,108,6,{url:product.image});
    }
    y+=cardHeight+5;
   });
  });
  for(let page=1;page<=pdf.getNumberOfPages();page++){
   pdf.setPage(page);
   rule(H-16);
   tx('NORTE ABERTURAS · Respaldo interno. El archivo JSON permite restaurar los datos.',M,H-10,7,'helvetica','normal',mute);
   pdf.setFont('helvetica','normal');pdf.setFontSize(7);rgb(mute);pdf.text(page+' / '+pdf.getNumberOfPages(),R,H-10,{align:'right'});
  }
  pdf.save('norte-aberturas-catalogo-administrativo-'+new Date().toISOString().slice(0,10)+'.pdf');
  toast('Se descargó el catálogo completo en PDF');
 }catch(err){
  console.error('No se pudo exportar el catálogo a PDF',err);
  toast('Error al generar PDF. Revisá la conexión y volvé a intentar.');
  alert('No se pudo generar el PDF. '+(err?.message||'Volvé a intentar con conexión a Internet.')+' El respaldo JSON sigue disponible.');
 }finally{
  button.disabled=false;button.textContent=label;
 }
}


/* Excel (XLSX) local; no requiere CDN ni cambia datos durante la exportación. */
const NORTE_XLSX_FIELDS=['ID interno','Código','Producto','Categoría','Precio (ARS)','Descripción','Foto URL HTTPS'];
let norteXLSXPromise=null;
function norteGetXLSX(){
 if(window.XLSX?.utils&&window.XLSX?.writeFile)return Promise.resolve(window.XLSX);
 if(norteXLSXPromise)return norteXLSXPromise;
 norteXLSXPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=new URL('vendor/xlsx.full.min.js',app.ROOT).href;script.async=true;
  script.onload=()=>window.XLSX?.utils&&window.XLSX?.writeFile?resolve(window.XLSX):reject(Error('El lector Excel no inició'));
  script.onerror=()=>reject(Error('No se pudo cargar el lector Excel de la app'));
  document.head.appendChild(script);
 }).catch(err=>{norteXLSXPromise=null;throw err});
 return norteXLSXPromise;
}
const norteCell=x=>String(x??'').trim();
function nortePriceExcel(v){
 if(v==null||norteCell(v)==='')return null;
 if(typeof v==='number'){if(!Number.isFinite(v)||v<0||v>999999999)throw Error('Precio fuera de rango');return Math.round(v);}
 const text=norteCell(v).replace(/[$\s]/g,'');
 const fixed=text.includes(',')?text.replace(/\./g,'').replace(',','.'):
 (/^\d{1,3}(?:\.\d{3})+$/.test(text)?text.replace(/\./g,''):text);
 const value=Number(fixed);
 if(!Number.isFinite(value)||value<0||value>999999999)throw Error('Precio no válido: '+v);
 return Math.round(value);
}
function norteWorkbookExcel(XLSX,template){
 const book=XLSX.utils.book_new();
 const data=template?[]:app.products.map(p=>[p.id||'',p.code||'',p.name,p.category,p.price??'',p.description||'',String(p.image||'').startsWith('https://')?p.image:'']);
 const sheet=XLSX.utils.aoa_to_sheet([NORTE_XLSX_FIELDS,...(data.length?data:[['','','','','','','']])]);
 sheet['!cols']=[{wch:22},{wch:19},{wch:40},{wch:22},{wch:18},{wch:67},{wch:86}];
 if(data.length)sheet['!autofilter']={ref:'A1:G'+(data.length+1)};
 XLSX.utils.book_append_sheet(book,sheet,'Productos');
 const instructions=[
  ['NORTE ABERTURAS | GUÍA DE IMPORTACIÓN'],
  ['Editá solamente la hoja Productos y no modifiques sus encabezados.'],
  ['Para crear productos nuevos, dejá ID interno vacío. Para actualizar, conservá el ID.'],
  ['Código: opcional y único, hasta 32 caracteres; usá letras, números, guiones, barras, puntos o guion bajo.'],
  ['La columna Categoría acepta apartados nuevos; se crearán al importar (máximo 24).'],
  ['Precio (ARS): solo el número. En blanco indica precio a consultar.'],
  ['Foto URL HTTPS: poné el enlace público directo a la imagen. No pegues fotos dentro de las celdas.'],
  ['En una actualización, si Foto URL queda en blanco, la foto anterior se conserva.'],
  ['Para cargar fotos de archivos, usá Cargar fotos por código: por ejemplo PTA-001.jpg.'],
  ['Las fotos locales no se exportan dentro del Excel; usá JSON para un respaldo de los datos de la demo.'],
  ['La importación agrega o actualiza productos en el navegador actual; no sincroniza otros dispositivos.']
 ];
 const guide=XLSX.utils.aoa_to_sheet(instructions);guide['!cols']=[{wch:120}];
 XLSX.utils.book_append_sheet(book,guide,'Instrucciones');
 const cats=XLSX.utils.aoa_to_sheet([['Categorías disponibles'],...CATEGORIES.map(x=>[x])]);
 cats['!cols']=[{wch:35}];XLSX.utils.book_append_sheet(book,cats,'Categorias');
 return book;
}
async function norteDownloadExcel(template){
 const button=$(template?'template-excel':'export-excel');if(button.disabled)return;
 const name=button.textContent;button.disabled=true;button.textContent='Preparando Excel…';
 try{
  const xlsx=await norteGetXLSX();
  xlsx.writeFile(norteWorkbookExcel(xlsx,template),template?'norte-aberturas-plantilla.xlsx':'norte-aberturas-catalogo-'+new Date().toISOString().slice(0,10)+'.xlsx',{bookType:'xlsx',compression:true});
  toast(template?'Plantilla Excel preparada':'Catálogo Excel descargado');
 }catch(err){console.error(err);alert('No se pudo generar el Excel: '+err.message)}
 finally{button.disabled=false;button.textContent=name;}
}
function nortePlanExcelImport(rows,baseProducts=app.products,baseCategories=CATEGORIES){
 if(!rows?.length)throw Error('La hoja Productos está vacía');
 for(let i=0;i<NORTE_XLSX_FIELDS.length;i++)if(norteCell(rows[0][i])!==NORTE_XLSX_FIELDS[i])throw Error('No cambies los encabezados de la plantilla: '+NORTE_XLSX_FIELDS[i]);
 const entries=rows.slice(1).filter(row=>Array.isArray(row)&&row.some(v=>norteCell(v)!==''));
 if(!entries.length)throw Error('No hay productos para importar');
 if(entries.length>150)throw Error('Máximo 150 filas de productos');
 const pending=baseProducts.map(p=>({...p})),categories=baseCategories.slice(),touched=new Set();
 let created=0,updated=0,keptPhotos=0,linkedPhotos=0;
 for(let i=0;i<entries.length;i++){
  const values=entries[i],c=values.map(norteCell),num=i+2;
  const [id,rawCode,name,rawCategory,_,description,rawPhoto]=c;
  if(!name||name.length>100)throw Error('Fila '+num+': nombre obligatorio, máximo 100 caracteres');
  if(description.length>350)throw Error('Fila '+num+': descripción demasiado larga');
  const categoryName=cleanCategory(rawCategory);
  if(!categoryName||rawCategory.length>45)throw Error('Fila '+num+': categoría no válida');
  let category=categories.find(x=>x.toLocaleLowerCase('es-AR')===categoryName.toLocaleLowerCase('es-AR'));
  if(!category){if(categories.length>=24)throw Error('El catálogo permite 24 apartados como máximo');category=categoryName;categories.push(category);}
  const code=normalizeProductCode(rawCode);
  if(id.length>90||rawCode.length>32||!isValidProductCode(code))throw Error('Fila '+num+': ID o código inválido');
  const price=nortePriceExcel(values[4]);
  if(rawPhoto&&!/^https:\/\//i.test(rawPhoto))throw Error('Fila '+num+': la foto necesita URL HTTPS');
  if(rawPhoto&&!safeImg(rawPhoto))throw Error('Fila '+num+': URL de foto inválida');
  let index=id?pending.findIndex(p=>p.id===id):-1;
  if(index<0&&code)index=pending.findIndex(p=>normalizeProductCode(p.code)===code);
  if(index<0&&!id&&!code){
   const similar=pending.map((p,k)=>({p,k})).filter(v=>v.p.name.toLocaleLowerCase('es-AR')===name.toLocaleLowerCase('es-AR')&&v.p.category.toLocaleLowerCase('es-AR')===category.toLocaleLowerCase('es-AR'));
   if(similar.length===1)index=similar[0].k;
  }
  const before=index<0?null:pending[index];
  const finalId=before?.id||id||('excel_'+Date.now().toString(36)+'_'+i+'_'+Math.random().toString(36).slice(2,7));
  if(touched.has(finalId))throw Error('Fila '+num+': producto repetido dentro del Excel');
  touched.add(finalId);
  const image=rawPhoto?safeImg(rawPhoto):(before?.image||'');
  if(rawPhoto)linkedPhotos++;else if(before?.image)keptPhotos++;
  const item={id:finalId,name,code:code||before?.code||'',category,price,description,image};
  if(index>=0){pending[index]=item;updated++;}else{pending.push(item);created++;}
 }
 if(pending.length>150)throw Error('El catálogo resultante supera 150 productos');
 if(new Set(pending.map(p=>p.id)).size!==pending.length||hasDuplicateProductCodes(pending))throw Error('Hay IDs o códigos de producto duplicados');
 return {pending,categories,created,updated,keptPhotos,linkedPhotos};
}
async function norteImportExcel(e){
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(!/\.xlsx$/i.test(file.name)||file.size>6*1024*1024)return alert('Seleccioná un archivo .xlsx de hasta 6 MB');
 const btn=$('import-excel');if(btn.disabled)return;
 const label=btn.textContent;btn.disabled=true;btn.textContent='Leyendo Excel…';
 try{
  const XLSX=await norteGetXLSX();
  const book=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
  if(!book.Sheets.Productos)throw Error('La planilla necesita una hoja llamada Productos');
  const rows=XLSX.utils.sheet_to_json(book.Sheets.Productos,{header:1,defval:'',blankrows:false,raw:true});
  const plan=nortePlanExcelImport(rows);
  const message='Nuevos: '+plan.created+'. Actualizados: '+plan.updated+'. Apartados: '+plan.categories.length+'. Fotos conservadas: '+plan.keptPhotos+'. URL de fotos: '+plan.linkedPhotos+'.';
  if(!confirm('¿Importar Excel en este navegador?\n\n'+message+'\n\nTe recomendamos guardar una copia JSON antes.'))return;
  const beforeProducts=getStored(STORE),beforeCategories=getStored(CATEGORY_STORE);
  if(!setStored(STORE,plan.pending))throw Error('No hay espacio para guardar todos los productos');
  if(!setStored(CATEGORY_STORE,plan.categories.slice(FIXED_CATEGORIES.length))){
   try{if(beforeProducts===null)localStorage.removeItem(STORE);else localStorage.setItem(STORE,beforeProducts);
       if(beforeCategories===null)localStorage.removeItem(CATEGORY_STORE);else localStorage.setItem(CATEGORY_STORE,beforeCategories)}catch{}
   throw Error('No se pudieron guardar las categorías; se intentó restaurar el catálogo anterior');
  }
  setCategories(plan.categories,plan.pending);app.products=plan.pending;
  adminOpenGroups.clear();adminVisibleLimits.clear();$('admin-product-search').value='';
  syncAdminCategories();cleanCart();renderAll();
  toast('Excel importado: '+plan.created+' nuevos, '+plan.updated+' actualizados');
 }catch(err){console.error(err);alert('No se pudo importar el Excel:\n'+err.message)}
 finally{btn.disabled=false;btn.textContent=label;}
}
async function norteImportPhotos(e){
 const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length)return;
 if(files.length>40)return alert('Cargá hasta 40 fotos por vez para cuidar el espacio del navegador');
 const mapping=[],unmatched=[];
 for(const file of files){
  const key=normalizeProductCode(file.name.replace(/\.(jpe?g|png|webp)$/i,''));
  const product=app.products.find(p=>p.code&&normalizeProductCode(p.code)===key);
  if(product&&isValidProductCode(key))mapping.push({file,id:product.id});else unmatched.push(file.name);
 }
 if(!mapping.length)return alert('No coinciden los nombres de foto con los códigos. Ejemplo: PTA-001.jpg');
 if(new Set(mapping.map(m=>m.id)).size!==mapping.length)return alert('Hay dos fotos para el mismo código. Seleccioná solo una por producto.');
 if(!confirm('¿Asignar '+mapping.length+' fotos a los productos?'+(unmatched.length?'\nSe omitirán '+unmatched.length+' fotos sin código coincidente.':'')))return;
 const button=$('import-photos'),label=button.textContent;button.disabled=true;
 try{
  const changes=new Map();
  for(let i=0;i<mapping.length;i++){button.textContent='Procesando foto '+(i+1)+' / '+mapping.length;changes.set(mapping[i].id,await photoToDataURL(mapping[i].file));}
  const updated=app.products.map(p=>changes.has(p.id)?{...p,image:changes.get(p.id)}:p);
  if(!setStored(STORE,updated))throw Error('No hay espacio en este navegador; probá con menos fotos');
  app.products=updated;renderAll();
  toast(changes.size+' fotos asociadas por código'+(unmatched.length?' · '+unmatched.length+' omitidas':''));
 }catch(err){console.error(err);alert('No se pudieron cargar las fotos: '+err.message)}
 finally{button.disabled=false;button.textContent=label;}
}

function exportJSON(){const data={format:'zenix-norte-demo-v1',products:app.products,categories:CATEGORIES.slice(),exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});let u=URL.createObjectURL(blob);let a=document.createElement('a');a.href=u;a.download='norte-aberturas-catalogo-demo.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);toast('Se preparó el archivo de respaldo')}
async function importJSON(e){
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>8*1024*1024)return toast('Archivo demasiado grande para la demo');
 const before=CATEGORIES.slice();
 try{
  const data=JSON.parse(await file.text());
  if(data?.format!=='zenix-norte-demo-v1'||!Array.isArray(data.products)||data.products.length>150)throw Error('Formato inválido');
  if(data.categories!==undefined&&!Array.isArray(data.categories))throw Error('Apartados inválidos');
  const list=buildCategoryList(data.categories||[],data.products);
  if(list.length>=24&&data.products.some(x=>!list.includes(cleanCategory(x.category))))throw Error('Demasiados apartados');
  setCategories(list,data.products);
  const next=data.products.map(normalize);
  if(next.some(x=>!x))throw Error('Hay datos inválidos');
  if(new Set(next.map(x=>x.id)).size!==next.length)throw Error('Hay identificadores duplicados');
  if(data.products.some(p=>String(p.code??'').trim().length>32||!isValidProductCode(normalizeProductCode(p.code))))throw Error('Hay códigos de producto inválidos');
  if(hasDuplicateProductCodes(next))throw Error('Hay códigos de producto duplicados');
  if(!confirm('¿Reemplazar el catálogo y los apartados locales con '+next.length+' productos del archivo?')){setCategories(before,[]);return}
  if(!setStored(STORE,next)){setCategories(before,[]);return}
  if(!setStored(CATEGORY_STORE,CATEGORIES.slice(FIXED_CATEGORIES.length))){toast('Productos guardados, pero no se pudieron guardar los apartados');}
  app.products=next;adminOpenGroups.clear();adminVisibleLimits.clear();$('admin-product-search').value='';syncAdminCategories();cleanCart();renderAll();toast('Catálogo y apartados importados en este dispositivo');
 }catch(err){setCategories(before,[]);toast('No se pudo importar: '+err.message)}
}
$('add-new').addEventListener('click',()=>editProduct(null));
$('admin-back').addEventListener('click',adminReturnHome);
$('add-category').addEventListener('click',()=>{
 setAdminScreen('category');
 $('admin-category-name').focus();
});
$('cancel-category').addEventListener('click',adminReturnHome);
$('admin-category-form').addEventListener('submit',createAdminCategory);
let adminSearchTimer=0;
$('admin-product-search').addEventListener('input',()=>{
 clearTimeout(adminSearchTimer);
 adminVisibleLimits.clear();
 adminSearchTimer=setTimeout(renderAdmin,180);
});
$('admin-list').addEventListener('click',event=>{
 const button=event.target.closest('[data-edit],[data-delete],[data-new-in],[data-remove-category],[data-admin-show-more]');
 if(!button||!$('admin-list').contains(button))return;
 if(button.hasAttribute('data-edit'))editProduct(button.dataset.edit);
 else if(button.hasAttribute('data-delete'))deleteProduct(button.dataset.delete);
 else if(button.hasAttribute('data-new-in')){app.adminSelectedCategory=button.dataset.newIn;editProduct(null)}
 else if(button.hasAttribute('data-remove-category'))removeAdminCategory(button.dataset.removeCategory);
 else if(button.hasAttribute('data-admin-show-more')){
  const cat=button.dataset.adminShowMore,folder=button.closest('[data-admin-folder]'),body=folder?.querySelector('[data-admin-body]');
  if(!body||!CATEGORIES.includes(cat))return;
  const q=$('admin-product-search').value.trim().toLocaleLowerCase('es-AR');
  const allProducts=app.products.filter(p=>p.category===cat);
  const visible=!q||cat.toLocaleLowerCase('es-AR').includes(q)?allProducts:allProducts.filter(p=>[p.name,p.code,p.description].some(v=>String(v||'').toLocaleLowerCase('es-AR').includes(q)));
  adminVisibleLimits.set(cat,(adminVisibleLimits.get(cat)||8)+8);
  body.innerHTML=adminGroupContent(cat,visible,allProducts.length,q);
  body.querySelector('[data-admin-show-more]')?.focus();
 }
});
$('admin-clear-search').addEventListener('click',()=>{$('admin-product-search').value='';renderAdmin();$('admin-product-search').focus()});
$('cancel-edit').addEventListener('click',adminReturnHome);
$('admin-upload').addEventListener('change',async e=>{let file=e.target.files?.[0];if(!file)return;try{uploaded=await photoToDataURL(file);toast('Foto optimizada: guardala con el producto')}catch(err){uploaded=null;toast(err.message)}});
$('admin-form').addEventListener('submit',saveProduct);
$('admin-data-toggle').addEventListener('click',()=>setAdminScreen('data'));
$('export-json').addEventListener('click',exportJSON);
$('export-pdf').addEventListener('click',exportPDF);
$('export-excel').addEventListener('click',()=>norteDownloadExcel(false));
$('template-excel').addEventListener('click',()=>norteDownloadExcel(true));
$('import-excel').addEventListener('click',()=>$('excel-file').click());
$('excel-file').addEventListener('change',norteImportExcel);
$('import-photos').addEventListener('click',()=>$('photos-files').click());
$('photos-files').addEventListener('change',norteImportPhotos);
$('import-json').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',importJSON);
$('restore-defaults').addEventListener('click',()=>{if(!confirm('¿Restaurar los 64 artículos de demostración? Se perderán los cambios locales no exportados.'))return;const next=fresh();if(!setStored(STORE,next))return;if(!setStored(CATEGORY_STORE,[]))return;setCategories(app.publishedCategories,next);app.products=next;adminOpenGroups.clear();adminVisibleLimits.clear();app.adminSelectedCategory='Puertas';$('admin-product-search').value='';syncAdminCategories();app.cart={};setStored(CART_STORE,app.cart);$('admin-form').hidden=true;renderAll();toast('Catálogo de demostración restaurado')});

// En esta página el panel es lo único que se dibuja.
app.renderAll=()=>renderAdmin();
setAdminScreen('home');
app.start();
})(window.NorteApp);
