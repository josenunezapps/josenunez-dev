const revealElements = [...document.querySelectorAll('.reveal')];
const observer = new IntersectionObserver((entries)=>{
  entries.forEach((entry)=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
},{threshold:0.08, rootMargin:'0px 0px -6% 0px'});

// Give desktop browsers one painted frame before observing, so the transition
// always starts from the hidden state instead of being skipped on fast loads.
requestAnimationFrame(()=>{
  requestAnimationFrame(()=>{
    revealElements.forEach((el,index)=>{
      el.style.setProperty('--reveal-delay', Math.min(index % 4, 3) * 55 + 'ms');
      observer.observe(el);
    });
  });
});

const header = document.querySelector('.site-header');
window.addEventListener('scroll',()=>{
  const y = window.scrollY;
  header.style.background = y > 60 ? 'rgba(17,14,12,.88)' : 'transparent';
  header.style.backdropFilter = y > 60 ? 'blur(14px)' : 'none';
});

// v13 interactive cart
(() => {
  const CART_KEY = 'machis-demo-cart-v1';
  const money = (value) => '$' + Number(value).toLocaleString('es-AR');
  const parsePrice = (text='') => Number(text.replace(/[^0-9]/g,'')) || 0;

  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}'); } catch(e) { cart = {}; }

  const cartButton = document.createElement('button');
  cartButton.className = 'cart-fab';
  cartButton.type = 'button';
  cartButton.setAttribute('aria-label','Abrir carrito');
  cartButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4H3V2H8.4L9.3 4H21.2L18.6 13.2C18.4 13.9 17.8 14.3 17.1 14.3H10.3L9.7 16H19V18H9.3C8.1 18 7.3 16.8 7.8 15.7L8.6 13.6 5.6 6H4V4H7Zm3.2 8.3h6.5L18.5 6H8l2.2 6.3ZM10 19.5A1.5 1.5 0 1 1 7 19.5a1.5 1.5 0 0 1 3 0Zm9 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>
    <span class="cart-fab-copy"><small>Tu pedido</small><strong>Carrito</strong></span>
    <b class="cart-count">0</b>`;
  document.body.appendChild(cartButton);

  const backdrop = document.createElement('div');
  backdrop.className = 'cart-backdrop';
  document.body.appendChild(backdrop);

  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.setAttribute('aria-label','Carrito de pedido');
  drawer.innerHTML = `
    <div class="cart-head">
      <div><small>TU PEDIDO</small><h3>Carrito</h3></div>
      <button class="cart-close" type="button" aria-label="Cerrar carrito">×</button>
    </div>
    <div class="cart-items"></div>
    <div class="cart-empty">Todavía no agregaste productos.</div>
    <div class="cart-summary">
      <div><span>Total estimado</span><strong class="cart-total">$0</strong></div>
      <button class="cart-whatsapp" type="button">Enviar pedido por WhatsApp</button>
      <small>Demo comercial. El pedido se envía como mensaje y debe ser confirmado por el local.</small>
    </div>`;
  document.body.appendChild(drawer);

  const openCart = () => {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('cart-open');
  };
  const closeCart = () => {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('cart-open');
  };
  cartButton.addEventListener('click', openCart);
  backdrop.addEventListener('click', closeCart);
  drawer.querySelector('.cart-close').addEventListener('click', closeCart);

  function save() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    render();
  }

  function addProduct(name, price) {
    const key = name + '|' + price;
    if (!cart[key]) cart[key] = {name, price, qty:0};
    cart[key].qty += 1;
    save();
    cartButton.classList.remove('bump');
    void cartButton.offsetWidth;
    cartButton.classList.add('bump');
  }

  function render() {
    const items = Object.entries(cart).filter(([,item]) => item.qty > 0);
    const itemsBox = drawer.querySelector('.cart-items');
    const empty = drawer.querySelector('.cart-empty');
    const summary = drawer.querySelector('.cart-summary');
    const count = items.reduce((a,[,i]) => a + i.qty, 0);
    const total = items.reduce((a,[,i]) => a + i.price*i.qty, 0);

    cartButton.querySelector('.cart-count').textContent = count;
    cartButton.classList.toggle('has-items', count > 0);
    drawer.querySelector('.cart-total').textContent = money(total);

    empty.style.display = items.length ? 'none' : 'block';
    summary.classList.toggle('disabled', !items.length);

    itemsBox.innerHTML = items.map(([key,item]) => `
      <div class="cart-line" data-key="${encodeURIComponent(key)}">
        <div class="cart-line-main">
          <strong>${item.name}</strong>
          <span>${money(item.price)}</span>
        </div>
        <div class="cart-qty">
          <button type="button" data-action="minus" aria-label="Quitar uno">−</button>
          <b>${item.qty}</b>
          <button type="button" data-action="plus" aria-label="Agregar uno">+</button>
        </div>
        <strong class="cart-line-total">${money(item.price*item.qty)}</strong>
      </div>`).join('');

    itemsBox.querySelectorAll('.cart-line').forEach(line => {
      const key = decodeURIComponent(line.dataset.key);
      line.querySelector('[data-action="minus"]').addEventListener('click', () => {
        cart[key].qty -= 1;
        if (cart[key].qty <= 0) delete cart[key];
        save();
      });
      line.querySelector('[data-action="plus"]').addEventListener('click', () => {
        cart[key].qty += 1;
        save();
      });
    });
  }

  function addButtons() {
    document.querySelectorAll('.pizza-card, .visual-product-card').forEach(card => {
      if (card.querySelector('.add-cart-btn')) return;
      const nameEl = card.querySelector('h3, h4');
      const priceEl = card.querySelector('.pizza-price, .visual-product-copy > strong');
      if (!nameEl || !priceEl) return;

      const name = nameEl.textContent.trim();
      const priceText = priceEl.textContent.trim();
      const price = parsePrice(priceText);
      if (!price) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'add-cart-btn inline';
      button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4H3V2H8.4L9.3 4H21.2L18.6 13.2C18.4 13.9 17.8 14.3 17.1 14.3H10.3L9.7 16H19V18H9.3C8.1 18 7.3 16.8 7.8 15.7L8.6 13.6 5.6 6H4V4H7Zm3.2 8.3h6.5L18.5 6H8l2.2 6.3Z"/></svg>
        <span>Agregar pedido</span>`;
      button.addEventListener('click', () => {
        addProduct(name, price);
        button.classList.add('added');
        button.querySelector('span').textContent = 'Agregado';
        setTimeout(() => {
          button.classList.remove('added');
          button.querySelector('span').textContent = 'Agregar pedido';
        }, 900);
      });
      const target = card.querySelector('.pizza-card-body, .visual-product-copy');
      const buyRow = document.createElement('div');
      buyRow.className = 'product-buy-row';
      priceEl.parentNode.insertBefore(buyRow, priceEl);
      buyRow.appendChild(priceEl);
      buyRow.appendChild(button);
    });
  }

  drawer.querySelector('.cart-whatsapp').addEventListener('click', () => {
    const items = Object.values(cart).filter(item => item.qty > 0);
    if (!items.length) return;
    const total = items.reduce((a,i) => a+i.price*i.qty,0);
    const lines = items.map(i => `• ${i.qty} x ${i.name} — ${money(i.price*i.qty)}`);
    const message = [
      "Hola Machi's, quisiera hacer este pedido:",
      '',
      ...lines,
      '',
      'Total estimado: ' + money(total),
      '',
      '¿Me confirman disponibilidad y forma de entrega?'
    ].join('\n');
    window.open('https://wa.me/542901653500?text='+encodeURIComponent(message),'_blank','noopener');
  });

  addButtons();
  render();
})();


// v15 compact mobile menu navigation
(() => {
  const fullMenu = document.querySelector('.visual-menu');
  if (!fullMenu || fullMenu.querySelector('.mobile-menu-tabs')) return;

  const categories = [...fullMenu.querySelectorAll(':scope > .visual-category')];
  if (!categories.length) return;

  const tabs = document.createElement('div');
  tabs.className = 'mobile-menu-tabs';
  tabs.setAttribute('aria-label','Categorías del menú');

  categories.forEach((category,index)=>{
    category.dataset.mobileCategory = index;
    const title = category.querySelector('.menu-block-title h3')?.textContent.trim() || ('Categoría '+(index+1));
    const labelMap = {
      'Pizzas enteras':'Enteras',
      'Medias pizzas':'Medias',
      'Medianas':'Medianas',
      'Promos y adicionales':'Promos',
      'Cervezas':'Cervezas',
      'Gaseosas y aguas':'Bebidas'
    };
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-menu-tab' + (index===0 ? ' active' : '');
    button.textContent = labelMap[title] || title;
    button.dataset.target = index;
    button.addEventListener('click',()=>{
      tabs.querySelectorAll('.mobile-menu-tab').forEach(b=>b.classList.toggle('active',b===button));
      categories.forEach((cat,i)=>cat.classList.toggle('mobile-active',i===index));
      category.scrollIntoView({behavior:'smooth',block:'start'});
    });
    tabs.appendChild(button);
  });

  const firstCategory = categories[0];
  firstCategory.parentNode.insertBefore(tabs,firstCategory);
  categories.forEach((cat,i)=>cat.classList.toggle('mobile-active',i===0));

  const syncMode = () => {
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    categories.forEach((cat,i)=>{
      if (!mobile) cat.classList.remove('mobile-hidden');
      else cat.classList.toggle('mobile-hidden',!cat.classList.contains('mobile-active'));
    });
  };

  tabs.addEventListener('click',()=>{
    categories.forEach(cat=>cat.classList.toggle('mobile-hidden',!cat.classList.contains('mobile-active')));
  });
  window.addEventListener('resize',syncMode,{passive:true});
  syncMode();
})();