// Sistema de Poké Mart (Loja Pokémon dos Jogos Clássicos)
const SHOP_ITEMS = [
  {
    id: 'poke',
    category: 'ball',
    name: 'Poké Ball',
    price: 200,
    sellPrice: 100,
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    desc: 'Dispositivo clássico da Silph Co. para capturar Pokémon na natureza (Multiplicador 1.0x).'
  },
  {
    id: 'great',
    category: 'ball',
    name: 'Great Ball',
    price: 600,
    sellPrice: 300,
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
    desc: 'Cápsula de alta performance com taxa de captura ampliada (Multiplicador 1.5x).'
  },
  {
    id: 'ultra',
    category: 'ball',
    name: 'Ultra Ball',
    price: 1200,
    sellPrice: 600,
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
    desc: 'Pokébola de ultra precisão para espécimes raros e velozes (Multiplicador 2.2x).'
  },
  {
    id: 'master',
    category: 'ball',
    name: 'Master Ball',
    price: 8000,
    sellPrice: 4000,
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',
    desc: 'A lendária e infalível Pokébola suprema. Captura qualquer Pokémon com 100% de sucesso.'
  },
  {
    id: 'razz',
    category: 'berry',
    name: 'Fruta Frambo',
    price: 300,
    sellPrice: 150,
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/razz-berry.png',
    desc: 'Fruta doce e perfumada. Acalma o monstrinho e concede +40% de chance na próxima jogada.'
  },
  {
    id: 'nanab',
    category: 'berry',
    name: 'Fruta Ananás',
    price: 450,
    sellPrice: 225,
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/nanab-berry.png',
    desc: 'Fruta tropical tranquilizante. Acalma o Pokémon selvagem impedindo que ele fuja da batalha.'
  }
];

class ShopManager {
  constructor() {
    this.money = this.loadMoney();
    this.activeMode = 'buy'; // 'buy' | 'sell'
    this.quantities = {};
    SHOP_ITEMS.forEach(item => {
      this.quantities[item.id] = 1;
    });
  }

  loadMoney() {
    const saved = localStorage.getItem('pokeif_money');
    if (saved !== null) {
      return parseInt(saved, 10) || 0;
    }
    // Saldo inicial de boas-vindas para novos treinadores
    const initial = 2500;
    localStorage.setItem('pokeif_money', initial);
    return initial;
  }

  saveMoney() {
    localStorage.setItem('pokeif_money', this.money);
    this.updateMoneyDisplays();
  }

  addMoney(amount, reason = '') {
    this.money += amount;
    this.saveMoney();
    if (reason && typeof app !== 'undefined' && app.showToast) {
      app.showToast(`💰 +₽ ${amount.toLocaleString('pt-BR')} (${reason})`);
    }
  }

  updateMoneyDisplays() {
    const formatted = `₽ ${this.money.toLocaleString('pt-BR')}`;
    const sideCounter = document.getElementById('side-shop-counter');
    const userMoneyEl = document.getElementById('shop-user-balance');
    const headerMoney = document.getElementById('header-money-display');

    if (sideCounter) sideCounter.textContent = formatted;
    if (userMoneyEl) userMoneyEl.textContent = formatted;
    if (headerMoney) headerMoney.textContent = formatted;
  }

  setMode(mode) {
    audio.playClick();
    this.activeMode = mode;
    
    document.querySelectorAll('.shop-tab-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-mode') === mode);
    });

    this.render();
  }

  setQuantity(itemId, qty) {
    const parsed = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
    this.quantities[itemId] = parsed;
    
    // Atualiza o subtotal e o botão desse cartão
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const subtotalEl = document.getElementById(`subtotal-${itemId}`);
    if (subtotalEl) {
      const unitPrice = this.activeMode === 'buy' ? item.price : item.sellPrice;
      const total = unitPrice * parsed;
      subtotalEl.textContent = `₽ ${total.toLocaleString('pt-BR')}`;
    }

    const inputEl = document.getElementById(`qty-input-${itemId}`);
    if (inputEl && inputEl.value !== String(parsed)) {
      inputEl.value = parsed;
    }
  }

  adjustQuantity(itemId, delta) {
    audio.playClick();
    const current = this.quantities[itemId] || 1;
    this.setQuantity(itemId, current + delta);
  }

  // Obter estoque atual do inventário
  getItemStock(item) {
    if (!capture || !capture.inventory) return 0;
    if (item.category === 'ball') {
      return capture.inventory.balls[item.id] || 0;
    } else {
      return capture.inventory.berries[item.id] || 0;
    }
  }

  // Comprar item
  buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const qty = this.quantities[itemId] || 1;
    const totalCost = item.price * qty;

    if (this.money < totalCost) {
      audio.playFlee();
      app.showToast(`❌ Fundos insuficientes! Você precisa de ₽ ${totalCost.toLocaleString('pt-BR')}.`);
      return;
    }

    // Deduz o dinheiro
    this.money -= totalCost;
    this.saveMoney();

    // Adiciona ao inventário da captura
    if (item.category === 'ball') {
      capture.inventory.balls[item.id] = (capture.inventory.balls[item.id] || 0) + qty;
    } else {
      capture.inventory.berries[item.id] = (capture.inventory.berries[item.id] || 0) + qty;
    }
    capture.saveInventory();
    capture.updateInventoryBadges();

    // Som de compra
    audio.playBuy();
    app.showToast(`🛍️ Comprou ${qty}x ${item.name} por ₽ ${totalCost.toLocaleString('pt-BR')}!`);

    // Atualiza interface da loja
    this.render();
  }

  // Vender item
  sellItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const qty = this.quantities[itemId] || 1;
    const currentStock = this.getItemStock(item);

    if (currentStock < qty) {
      audio.playFlee();
      app.showToast(`❌ Você só tem ${currentStock}x ${item.name} na bolsa.`);
      return;
    }

    const totalRevenue = item.sellPrice * qty;

    // Remove do inventário
    if (item.category === 'ball') {
      capture.inventory.balls[item.id] -= qty;
    } else {
      capture.inventory.berries[item.id] -= qty;
    }
    capture.saveInventory();
    capture.updateInventoryBadges();

    // Adiciona o dinheiro
    this.money += totalRevenue;
    this.saveMoney();

    // Som de venda
    audio.playSell();
    app.showToast(`💵 Vendeu ${qty}x ${item.name} por +₽ ${totalRevenue.toLocaleString('pt-BR')}!`);

    // Ajusta a quantidade se passar do novo estoque
    const newStock = this.getItemStock(item);
    if (this.quantities[itemId] > newStock && newStock > 0) {
      this.setQuantity(itemId, newStock);
    }

    this.render();
  }

  render() {
    this.updateMoneyDisplays();

    const grid = document.getElementById('shop-items-grid');
    if (!grid) return;

    const isBuy = this.activeMode === 'buy';

    grid.innerHTML = SHOP_ITEMS.map(item => {
      const stock = this.getItemStock(item);
      const qty = this.quantities[item.id] || 1;
      const unitPrice = isBuy ? item.price : item.sellPrice;
      const total = unitPrice * qty;
      const canAfford = isBuy ? this.money >= total : stock >= qty;
      const disabledClass = canAfford ? '' : 'disabled';

      return `
        <div class="shop-item-card ${disabledClass}">
          <div class="shop-card-badge ${item.category}">
            ${item.category === 'ball' ? 'Pokébola' : 'Fruta'}
          </div>
          
          <div class="shop-item-icon-box">
            <img src="${item.icon}" alt="${item.name}" class="shop-item-icon">
          </div>

          <div class="shop-item-info">
            <h4 class="shop-item-name">${item.name}</h4>
            <p class="shop-item-desc">${item.desc}</p>
          </div>

          <div class="shop-stock-pill">
            <span>Bolsa:</span>
            <strong>${stock} un.</strong>
          </div>

          <div class="shop-price-tag">
            <span class="price-label">${isBuy ? 'Preço unitário:' : 'Preço de venda:'}</span>
            <span class="price-val">₽ ${unitPrice.toLocaleString('pt-BR')}</span>
          </div>

          <div class="shop-qty-selector">
            <button class="qty-btn" onclick="shop.adjustQuantity('${item.id}', -1)">-</button>
            <input type="number" 
                   id="qty-input-${item.id}"
                   class="qty-input" 
                   value="${qty}" 
                   min="1" 
                   max="99" 
                   onchange="shop.setQuantity('${item.id}', this.value)">
            <button class="qty-btn" onclick="shop.adjustQuantity('${item.id}', 1)">+</button>
            
            <div class="quick-qty-presets">
              <button class="preset-btn" onclick="shop.setQuantity('${item.id}', 5)">x5</button>
              <button class="preset-btn" onclick="shop.setQuantity('${item.id}', 10)">x10</button>
            </div>
          </div>

          <div class="shop-total-row">
            <span>Subtotal:</span>
            <strong id="subtotal-${item.id}">₽ ${total.toLocaleString('pt-BR')}</strong>
          </div>

          <button class="btn-shop-action ${isBuy ? 'buy' : 'sell'}" 
                  onclick="${isBuy ? `shop.buyItem('${item.id}')` : `shop.sellItem('${item.id}')`}">
            ${isBuy ? `🛒 Comprar (₽ ${total.toLocaleString('pt-BR')})` : `💵 Vender (+₽ ${total.toLocaleString('pt-BR')})`}
          </button>
        </div>
      `;
    }).join('');
  }
}

const shop = new ShopManager();

if (typeof window !== 'undefined') {
  window.shop = shop;
}
