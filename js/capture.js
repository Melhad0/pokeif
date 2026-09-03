// Sistema de Encontro Selvagem e Mecânicas de Captura
class CaptureManager {
  constructor() {
    this.currentHabitat = 'route1';
    this.wildPokemon = null;
    this.wildLevel = 5;
    this.isEncounterActive = false;
    this.isCatching = false;
    this.berryActive = null; // 'razz' ou 'nanab'
    
    // Inventário do Treinador (Persistente)
    this.inventory = this.loadInventory();
  }

  loadInventory() {
    try {
      const saved = localStorage.getItem('pokeif_inventory');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Erro ao carregar inventário:", e);
    }
    return {
      balls: {
        poke: 25,
        great: 12,
        ultra: 5,
        master: 1
      },
      berries: {
        razz: 8,
        nanab: 8
      },
      selectedBall: 'poke'
    };
  }

  saveInventory() {
    try {
      localStorage.setItem('pokeif_inventory', JSON.stringify(this.inventory));
    } catch (e) {
      console.warn("Erro ao salvar inventário:", e);
    }
    this.updateInventoryUI();
  }

  // Pacote de Suprimentos do Prof. Carvalho
  claimFreeSupplies() {
    this.inventory.balls.poke += 15;
    this.inventory.balls.great += 5;
    this.inventory.berries.razz += 3;
    this.saveInventory();
    audio.playSuccess();
    app.showToast("📦 O Professor Carvalho enviou um pacote com 15 Pokébolas, 5 Greatbolas e 3 Frutas!");
  }

  setHabitat(habitatKey) {
    if (!KANTO_HABITATS[habitatKey]) return;
    this.currentHabitat = habitatKey;
    const habitat = KANTO_HABITATS[habitatKey];

    // Atualizar visual da arena com o ambiente autêntico do jogo
    const arenaEl = document.getElementById('encounter-arena');
    if (arenaEl) {
      arenaEl.className = `encounter-arena habitat-${habitatKey}`;
      arenaEl.setAttribute('data-habitat', habitatKey);
      arenaEl.style.background = ''; // Garante aplicação do CSS temático autêntico
    }

    const titleEl = document.getElementById('current-habitat-name');
    if (titleEl) {
      titleEl.innerHTML = `${habitat.icon} ${habitat.name}`;
    }

    // Se estiver em encontro, reseta
    this.endEncounter();
  }

  // Inicia busca na grama alta
  searchWildPokemon() {
    if (this.isCatching) return;
    audio.playClick();

    const searchBtn = document.getElementById('btn-search-wild');
    const arena = document.getElementById('encounter-arena');
    if (searchBtn) searchBtn.disabled = true;

    // Efeito de busca / animação do radar na grama
    arena.classList.add('searching');

    setTimeout(() => {
      arena.classList.remove('searching');
      if (searchBtn) searchBtn.disabled = false;
      this.generateWildEncounter();
    }, 900);
  }

  // Gera um Pokémon selvagem baseado no habitat
  generateWildEncounter() {
    let pool = KANTO_POKEMON.filter(p => p.habitat === this.currentHabitat);

    // Pequena chance (15%) de encontrar um Pokémon errante de outro habitat comum
    if (Math.random() < 0.15 || pool.length === 0) {
      const commonPool = KANTO_POKEMON.filter(p => p.catchRate >= 90);
      pool = commonPool.length > 0 ? commonPool : KANTO_POKEMON;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    this.wildPokemon = pool[randomIndex];

    // Determinar nível conforme o habitat
    let minLvl = 3, maxLvl = 15;
    if (this.currentHabitat === 'mtmoon') { minLvl = 10; maxLvl = 25; }
    else if (this.currentHabitat === 'water') { minLvl = 15; maxLvl = 35; }
    else if (this.currentHabitat === 'powerplant') { minLvl = 25; maxLvl = 45; }
    else if (this.currentHabitat === 'cerulean') { minLvl = 45; maxLvl = 70; }

    this.wildLevel = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl;
    this.isEncounterActive = true;
    this.berryActive = null;

    // Registrar como visto na Pokédex
    pokedex.registerSeen(this.wildPokemon.id);

    // Tocar som de encontro
    audio.playEncounter();

    this.renderEncounterUI();
  }

  renderEncounterUI() {
    const idleView = document.getElementById('idle-arena-view');
    const activeView = document.getElementById('active-encounter-view');
    const pokemonNameEl = document.getElementById('wild-pokemon-name');
    const pokemonLevelEl = document.getElementById('wild-pokemon-level');
    const pokemonSpriteEl = document.getElementById('wild-pokemon-sprite');
    const pokemonTypesEl = document.getElementById('wild-pokemon-types');
    const caughtBadgeEl = document.getElementById('wild-caught-indicator');
    const catchRateBar = document.getElementById('catch-probability-meter');
    const berryStatusEl = document.getElementById('berry-status-tag');

    if (idleView) idleView.classList.add('hidden');
    if (activeView) activeView.classList.remove('hidden');

    if (pokemonNameEl) pokemonNameEl.textContent = this.wildPokemon.name;
    if (pokemonLevelEl) pokemonLevelEl.textContent = `Nv. ${this.wildLevel}`;

    // Sprites: Showdown animado com fallback oficial
    const officialArt = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${this.wildPokemon.id}.png`;
    const animatedSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${this.wildPokemon.id}.gif`;
    const staticSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.wildPokemon.id}.png`;

    if (pokemonSpriteEl) {
      pokemonSpriteEl.src = animatedSprite;
      pokemonSpriteEl.className = 'wild-sprite enter-anim';
      pokemonSpriteEl.onerror = () => {
        pokemonSpriteEl.onerror = () => {
          pokemonSpriteEl.src = staticSprite;
        };
        pokemonSpriteEl.src = officialArt;
      };
      pokemonSpriteEl.style.display = 'block';
    }

    // Indicador se já possui
    const alreadyCaught = pokedex.isCaught(this.wildPokemon.id);
    if (caughtBadgeEl) {
      caughtBadgeEl.style.display = alreadyCaught ? 'inline-flex' : 'none';
    }

    // Badges de tipo
    if (pokemonTypesEl) {
      pokemonTypesEl.innerHTML = this.wildPokemon.types.map(t => {
        const conf = TYPE_COLORS[t] || { bg: '#666', text: '#fff' };
        return `<span class="type-badge" style="background:${conf.bg}; color:${conf.text};">${t}</span>`;
      }).join('');
    }

    // Reset status da fruta
    if (berryStatusEl) {
      berryStatusEl.textContent = '';
      berryStatusEl.style.display = 'none';
    }

    this.updateCatchChancePreview();
    this.updateInventoryUI();
  }

  // Calcula a probabilidade estimada de captura
  calculateCatchChance(ballType) {
    if (!this.wildPokemon) return 0;
    if (ballType === 'master') return 1.0;

    let ballMultiplier = 1.0;
    if (ballType === 'great') ballMultiplier = 1.5;
    if (ballType === 'ultra') ballMultiplier = 2.2;

    let berryMultiplier = 1.0;
    if (this.berryActive === 'razz') berryMultiplier = 1.4;

    // Fórmula equilibrada para o jogo
    const baseRate = this.wildPokemon.catchRate; // de 3 a 255
    const levelPenalty = Math.max(0.4, 1 - (this.wildLevel / 120));

    let chance = (baseRate / 255) * 0.75 * ballMultiplier * berryMultiplier * levelPenalty;
    return Math.min(0.98, Math.max(0.05, chance));
  }

  updateCatchChancePreview() {
    const meter = document.getElementById('catch-probability-meter');
    const label = document.getElementById('catch-probability-label');
    if (!meter || !label || !this.wildPokemon) return;

    const chance = this.calculateCatchChance(this.inventory.selectedBall);
    const pct = Math.round(chance * 100);

    meter.style.width = `${pct}%`;

    let color = '#e53935'; // Difícil
    let text = 'Baixa';
    if (pct >= 65) {
      color = '#43a047'; // Fácil
      text = 'Alta';
    } else if (pct >= 35) {
      color = '#fb8c00'; // Média
      text = 'Média';
    }
    meter.style.backgroundColor = color;
    label.textContent = `${text} (~${pct}%)`;
  }

  selectBall(type) {
    if (this.isCatching) return;
    audio.playClick();
    this.inventory.selectedBall = type;
    this.updateInventoryUI();
    this.updateCatchChancePreview();
  }

  // Usa fruta Razz ou Nanab
  useBerry(type) {
    if (this.isCatching || !this.wildPokemon) return;
    if (this.inventory.berries[type] <= 0) {
      app.showToast("Você não possui mais esta fruta!");
      return;
    }

    if (this.berryActive === type) {
      app.showToast("Este Pokémon já comeu esta fruta!");
      return;
    }

    this.inventory.berries[type] -= 1;
    this.berryActive = type;
    this.saveInventory();
    audio.playBerry();

    const berryStatusEl = document.getElementById('berry-status-tag');
    if (berryStatusEl) {
      berryStatusEl.style.display = 'inline-block';
      if (type === 'razz') {
        berryStatusEl.innerHTML = '🍓 Fruta Frambo: +40% Chance de Captura!';
        berryStatusEl.className = 'berry-tag razz';
      } else {
        berryStatusEl.innerHTML = '🍌 Fruta Ananás: Pokémon Acalmado (Não fugirá)';
        berryStatusEl.className = 'berry-tag nanab';
      }
    }

    this.updateCatchChancePreview();
    app.showToast(`Você deu uma Fruta ${type === 'razz' ? 'Frambo' : 'Ananás'} ao ${this.wildPokemon.name}!`);
  }

  // Executa o arremesso da Pokébola
  throwBall() {
    if (this.isCatching || !this.wildPokemon) return;

    const ballType = this.inventory.selectedBall;
    if (this.inventory.balls[ballType] <= 0) {
      app.showToast("Você não tem essa Pokébola! Selecione outra ou peça suprimentos.");
      return;
    }

    // Consumir a bola
    this.inventory.balls[ballType] -= 1;
    this.saveInventory();

    this.isCatching = true;
    this.setControlsEnabled(false);

    // Efeito sonoro do arremesso
    audio.playThrow();

    // Iniciar animação da bola voando
    const pokeballActor = document.getElementById('pokeball-actor');
    const wildSprite = document.getElementById('wild-pokemon-sprite');
    const arena = document.getElementById('encounter-arena');

    // Imagem da bola arremessada
    const ballImages = {
      poke: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
      great: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
      ultra: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
      master: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png'
    };

    pokeballActor.src = ballImages[ballType];
    pokeballActor.className = 'pokeball-actor throw-anim';

    // Ao atingir o Pokémon (450ms)
    setTimeout(() => {
      audio.playImpact();
      wildSprite.classList.add('absorb-anim');

      // Pokémon é absorvido pela bola
      setTimeout(() => {
        wildSprite.style.display = 'none';
        wildSprite.classList.remove('absorb-anim');
        pokeballActor.className = 'pokeball-actor ground-rest';

        // Iniciar sequência de suspense (shakes)
        this.runShakeSequence(ballType);
      }, 350);
    }, 450);
  }

  // Sequência de 3 tremores com suspense
  runShakeSequence(ballType) {
    const pokeballActor = document.getElementById('pokeball-actor');
    const chance = this.calculateCatchChance(ballType);
    const roll = Math.random();
    const isSuccess = ballType === 'master' || roll < chance;

    // Quantidade de shakes até escapar se falhar
    let maxShakes = 3;
    if (!isSuccess) {
      if (roll > chance * 2) maxShakes = 1;
      else if (roll > chance * 1.3) maxShakes = 2;
      else maxShakes = 3;
    }

    let currentShake = 0;

    const doShake = () => {
      if (currentShake < maxShakes) {
        currentShake++;
        audio.playShake();
        pokeballActor.classList.remove('shake-anim');
        void pokeballActor.offsetWidth; // Forçar reflow do CSS
        pokeballActor.classList.add('shake-anim');

        setTimeout(doShake, 750);
      } else {
        // Fim dos shakes
        if (isSuccess) {
          this.handleCatchSuccess(ballType);
        } else {
          this.handleCatchFailure();
        }
      }
    };

    setTimeout(doShake, 400);
  }

  // Captura bem sucedida!
  handleCatchSuccess(ballType) {
    const pokeballActor = document.getElementById('pokeball-actor');
    pokeballActor.className = 'pokeball-actor caught-anim';

    audio.playSuccess();

    // Recompensas pela captura (+3 Pokébolas e +1 Fruta para manter o jogo sustentável)
    this.inventory.balls.poke += 3;
    this.inventory.berries.razz += 1;
    this.saveInventory();

    const ballNames = {
      poke: 'Poké Ball',
      great: 'Great Ball',
      ultra: 'Ultra Ball',
      master: 'Master Ball'
    };

    // Registrar na Pokédex
    const totalCaught = pokedex.registerCatch(this.wildPokemon, ballNames[ballType]);

    // Armazenar individualmente na Box do PC
    if (typeof box !== 'undefined') {
      box.storePokemon(this.wildPokemon, this.wildLevel, ballNames[ballType]);
    }

    // Recompensa financeira em Poké Dollars (escala com nível e raridade)
    let rewardMoney = 120 + (this.wildLevel * 10) + Math.floor((255 - this.wildPokemon.catchRate) * 0.8);
    if (typeof shop !== 'undefined') {
      shop.addMoney(rewardMoney);
    }

    // Abrir modal de celebração
    setTimeout(() => {
      this.showGotchaModal(this.wildPokemon, this.wildLevel, ballNames[ballType], totalCaught, rewardMoney);
      this.isCatching = false;
      this.setControlsEnabled(true);
    }, 800);
  }

  // Captura falhou! Pokémon escapa da bola
  handleCatchFailure() {
    const pokeballActor = document.getElementById('pokeball-actor');
    const wildSprite = document.getElementById('wild-pokemon-sprite');

    audio.playEscape();
    pokeballActor.className = 'pokeball-actor breakout-anim';

    setTimeout(() => {
      pokeballActor.className = 'pokeball-actor hidden';
      wildSprite.style.display = 'block';
      wildSprite.classList.add('angry-anim');

      // Fruta foi consumida na tentativa
      this.berryActive = null;
      const berryStatusEl = document.getElementById('berry-status-tag');
      if (berryStatusEl) {
        berryStatusEl.style.display = 'none';
      }

      // Checar se o Pokémon foge da batalha (se comeu Nanab, não foge)
      const willFlee = this.berryActive !== 'nanab' && Math.random() < 0.28;

      if (willFlee) {
        setTimeout(() => {
          app.showToast(`O ${this.wildPokemon.name} selvagem fugiu correndo!`);
          this.endEncounter();
          this.isCatching = false;
          this.setControlsEnabled(true);
        }, 1000);
      } else {
        setTimeout(() => {
          app.showToast(`Oh não! O ${this.wildPokemon.name} escapou da bola!`);
          wildSprite.classList.remove('angry-anim');
          this.isCatching = false;
          this.setControlsEnabled(true);
          this.updateCatchChancePreview();
        }, 800);
      }
    }, 500);
  }

  // Modal comemorativo de captura
  showGotchaModal(pokemon, level, ballName, totalCaught, rewardMoney = 150) {
    const modal = document.getElementById('gotcha-modal');
    const content = document.getElementById('gotcha-content');
    if (!modal || !content) return;

    const officialArt = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
    const fallbackArt = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const formattedId = String(pokemon.id).padStart(3, '0');

    content.innerHTML = `
      <div class="gotcha-header">
        <span class="gotcha-badge">★ Gotcha! ★</span>
        <h2>${pokemon.name} foi capturado!</h2>
        <p class="gotcha-subtitle">Registrado na Pokédex de Kanto e enviado ao PC!</p>
      </div>

      <div class="gotcha-artwork-box">
        <img src="${officialArt}" 
             alt="${pokemon.name}" 
             class="gotcha-img" 
             onerror="this.onerror=null; this.src='${fallbackArt}';">
      </div>

      <div class="gotcha-details">
        <p><strong>Nº Pokédex:</strong> #${formattedId}</p>
        <p><strong>Nível:</strong> Nv. ${level}</p>
        <p><strong>Bola usada:</strong> ${ballName}</p>
        <p><strong>Armazenamento:</strong> 💻 Guardado na Box do PC</p>
        <p><strong>Recompensa da Liga:</strong> <span class="text-yellow font-bold">💰 +₽ ${rewardMoney.toLocaleString('pt-BR')}</span></p>
        <p><strong>Bônus de Treinador:</strong> +3 Pokébolas, +1 Fruta Frambo</p>
        <p class="gotcha-pokedex-count">Progresso da Pokédex: <strong>${totalCaught} / 151</strong> capturados</p>
      </div>

      <div class="gotcha-actions">
        <button class="btn-primary pulse-btn" onclick="capture.closeGotchaAndContinue()">
          Continuar Caçando
        </button>
        <button class="btn-secondary" onclick="capture.viewInBox()">
          💻 Ver na Box
        </button>
        <button class="btn-secondary" onclick="capture.viewInPokedex(${pokemon.id})">
          📖 Pokédex
        </button>
      </div>
    `;

    modal.classList.add('active');
  }

  closeGotchaAndContinue() {
    audio.playClick();
    const modal = document.getElementById('gotcha-modal');
    if (modal) modal.classList.remove('active');
    this.endEncounter();
  }

  viewInBox() {
    audio.playClick();
    const modal = document.getElementById('gotcha-modal');
    if (modal) modal.classList.remove('active');
    this.endEncounter();
    app.switchTab('box');
  }

  viewInPokedex(pokemonId) {
    audio.playClick();
    const modal = document.getElementById('gotcha-modal');
    if (modal) modal.classList.remove('active');
    this.endEncounter();
    app.switchTab('pokedex');
    pokedex.openDetailModal(pokemonId);
  }

  // Fugir da batalha
  runAway() {
    if (this.isCatching) return;
    audio.playClick();
    app.showToast("Você fugiu com segurança!");
    this.endEncounter();
  }

  endEncounter() {
    this.isEncounterActive = false;
    this.wildPokemon = null;
    this.berryActive = null;

    const idleView = document.getElementById('idle-arena-view');
    const activeView = document.getElementById('active-encounter-view');
    const pokeballActor = document.getElementById('pokeball-actor');

    if (idleView) idleView.classList.remove('hidden');
    if (activeView) activeView.classList.add('hidden');
    if (pokeballActor) pokeballActor.className = 'pokeball-actor hidden';

    this.setControlsEnabled(true);
    pokedex.renderGrid();
  }

  setControlsEnabled(enabled) {
    const buttons = document.querySelectorAll('.catch-action-btn, .ball-slot, .berry-slot, .nav-btn');
    buttons.forEach(b => {
      b.disabled = !enabled;
    });
  }

  updateInventoryUI() {
    // Atualiza contadores de bolas
    const pokeCount = document.getElementById('count-pokeball');
    const greatCount = document.getElementById('count-greatball');
    const ultraCount = document.getElementById('count-ultraball');
    const masterCount = document.getElementById('count-masterball');

    if (pokeCount) pokeCount.textContent = this.inventory.balls.poke;
    if (greatCount) greatCount.textContent = this.inventory.balls.great;
    if (ultraCount) ultraCount.textContent = this.inventory.balls.ultra;
    if (masterCount) masterCount.textContent = this.inventory.balls.master;

    // Atualiza contadores de frutas
    const razzCount = document.getElementById('count-razz');
    const nanabCount = document.getElementById('count-nanab');

    if (razzCount) razzCount.textContent = this.inventory.berries.razz;
    if (nanabCount) nanabCount.textContent = this.inventory.berries.nanab;

    // Atualiza botão selecionado
    document.querySelectorAll('.ball-slot').forEach(slot => {
      const type = slot.getAttribute('data-ball');
      if (type === this.inventory.selectedBall) {
        slot.classList.add('selected');
      } else {
        slot.classList.remove('selected');
      }
    });
  }
}

const capture = new CaptureManager();

if (typeof window !== 'undefined') {
  window.capture = capture;
}
