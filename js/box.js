// Gerenciador do Sistema de Armazenamento Pokémon (PC do Bill / Boxes)
class BoxManager {
  constructor() {
    this.storage = this.loadStorage();
    this.currentBox = 1; // Box 1, 2, 3... (30 vagas por box como nos clássicos)
    this.boxCapacity = 30;
    this.sortBy = 'recent'; // 'recent', 'level_desc', 'pokedex_asc', 'name_asc'
    this.searchQuery = '';
    this.selectedPokemon = null;

    // Migração inicial suave: se houver dados em pokeif_caught mas storage vazio, inicializa
    this.checkInitialMigration();
  }

  loadStorage() {
    try {
      const data = localStorage.getItem('pokeif_box_storage');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("Erro ao carregar Box do PC:", e);
      return [];
    }
  }

  saveStorage() {
    try {
      localStorage.setItem('pokeif_box_storage', JSON.stringify(this.storage));
    } catch (e) {
      console.warn("Erro ao salvar Box do PC:", e);
    }
    this.updateBoxBadge();
  }

  checkInitialMigration() {
    if (this.storage.length === 0) {
      try {
        const caughtIds = JSON.parse(localStorage.getItem('pokeif_caught') || '[]');
        if (caughtIds.length > 0) {
          caughtIds.forEach((id, idx) => {
            const pkmn = KANTO_POKEMON.find(p => p.id === id);
            if (pkmn) {
              this.storage.push({
                uid: 'legacy_' + id + '_' + idx,
                id: pkmn.id,
                name: pkmn.name,
                nickname: pkmn.name,
                level: 15,
                ball: 'Poké Ball',
                caughtAt: new Date().toLocaleDateString('pt-BR'),
                types: pkmn.types,
                hp: Math.floor(pkmn.hp * 1.3),
                atk: Math.floor(pkmn.atk * 1.3),
                def: Math.floor(pkmn.def * 1.3),
                boxNumber: Math.floor(idx / this.boxCapacity) + 1
              });
            }
          });
          this.saveStorage();
        }
      } catch (e) {
        console.warn("Migração de dados antigos ignorada:", e);
      }
    }
  }

  // Armazena um Pokémon capturado na Box ativa
  storePokemon(pokemon, level, ballName) {
    const boxNum = Math.floor(this.storage.length / this.boxCapacity) + 1;
    const instance = {
      uid: 'pkmn_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      id: pokemon.id,
      name: pokemon.name,
      nickname: pokemon.name,
      level: level,
      ball: ballName,
      caughtAt: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      types: [...pokemon.types],
      hp: Math.floor(pokemon.hp * (1 + level / 60)),
      atk: Math.floor(pokemon.atk * (1 + level / 60)),
      def: Math.floor(pokemon.def * (1 + level / 60)),
      boxNumber: boxNum
    };

    this.storage.unshift(instance); // Mais recente no topo
    this.saveStorage();
    this.render();
    return instance;
  }

  // Abre popup customizado de confirmação para soltar Pokémon
  promptReleasePokemon(uid) {
    audio.playClick();
    const pkmn = this.storage.find(p => p.uid === uid);
    if (!pkmn) return;

    this.pendingReleaseUid = uid;
    const modal = document.getElementById('pc-confirm-release-modal');
    const body = document.getElementById('confirm-release-body');
    const yesBtn = document.getElementById('btn-confirm-release-yes');

    const officialImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkmn.id}.png`;
    const staticSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkmn.id}.png`;

    if (body) {
      body.innerHTML = `
        <div class="dialog-pokemon-preview">
          <img src="${officialImg}" alt="${pkmn.name}" class="dialog-preview-sprite" onerror="this.onerror=null; this.src='${staticSprite}';">
          <p class="dialog-main-question">
            Tem certeza que deseja soltar <strong>${pkmn.nickname}</strong> (Nv. ${pkmn.level}) de volta à natureza?
          </p>
          <div class="dialog-reward-notice">
            🎁 Ele viverá livre e você receberá <strong>+1 Fruta Frambo</strong> e <strong>+₽ 150</strong> como recompensa!
          </div>
        </div>
      `;
    }

    if (yesBtn) {
      yesBtn.onclick = () => this.executeRelease();
    }

    if (modal) modal.classList.add('active');
  }

  // Executa a soltura do Pokémon após confirmação no popup
  executeRelease() {
    if (!this.pendingReleaseUid) return;

    const index = this.storage.findIndex(p => p.uid === this.pendingReleaseUid);
    if (index === -1) {
      this.closeReleaseConfirmModal();
      return;
    }

    const pkmn = this.storage[index];
    this.storage.splice(index, 1);
    this.saveStorage();

    // Recompensa carinhosa ao soltar (+1 Fruta Frambo e +₽ 150)
    capture.inventory.berries.razz += 1;
    capture.saveInventory();
    if (typeof shop !== 'undefined') {
      shop.addMoney(150);
    }

    audio.playClick();
    app.showToast(`🌿 ${pkmn.nickname || pkmn.name} voltou feliz para a natureza! Você ganhou +1 Fruta Frambo e +₽ 150.`);

    this.closeReleaseConfirmModal();
    this.closeInspectModal();
    this.render();
  }

  closeReleaseConfirmModal() {
    audio.playClick();
    this.pendingReleaseUid = null;
    const modal = document.getElementById('pc-confirm-release-modal');
    if (modal) modal.classList.remove('active');
  }

  // Abre popup customizado para renomear Pokémon
  promptRenamePokemon(uid) {
    audio.playClick();
    const pkmn = this.storage.find(p => p.uid === uid);
    if (!pkmn) return;

    this.pendingRenameUid = uid;
    const modal = document.getElementById('pc-rename-modal');
    const input = document.getElementById('rename-pokemon-input');
    const hint = document.getElementById('rename-species-hint');
    const saveBtn = document.getElementById('btn-save-rename');

    if (hint) {
      hint.innerHTML = `Digite um novo apelido para <strong>${pkmn.name}</strong>:`;
    }

    if (input) {
      input.value = pkmn.nickname || pkmn.name;
      setTimeout(() => {
        input.focus();
        input.select();
      }, 100);

      // Salvar ao teclar Enter
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          this.executeRename();
        }
      };
    }

    if (saveBtn) {
      saveBtn.onclick = () => this.executeRename();
    }

    if (modal) modal.classList.add('active');
  }

  // Salva o novo apelido
  executeRename() {
    if (!this.pendingRenameUid) return;
    const input = document.getElementById('rename-pokemon-input');
    const pkmn = this.storage.find(p => p.uid === this.pendingRenameUid);

    if (pkmn && input) {
      const newNick = input.value.trim();
      if (newNick !== '') {
        pkmn.nickname = newNick;
        this.saveStorage();
        audio.playClick();
        app.showToast(`Apelido alterado para "${pkmn.nickname}" com sucesso!`);
        this.openInspectModal(this.pendingRenameUid);
        this.render();
      }
    }

    this.closeRenameModal();
  }

  closeRenameModal() {
    audio.playClick();
    this.pendingRenameUid = null;
    const modal = document.getElementById('pc-rename-modal');
    if (modal) modal.classList.remove('active');
  }

  getFilteredStorage() {
    let list = [...this.storage];

    // Filtro por Box (se não for 'all')
    if (this.currentBox !== 'all') {
      const boxInt = parseInt(this.currentBox, 10);
      list = list.filter((p, index) => {
        const itemBox = Math.floor(index / this.boxCapacity) + 1;
        return itemBox === boxInt;
      });
    }

    // Filtro por texto
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.nickname && p.nickname.toLowerCase().includes(q)) ||
        String(p.id).padStart(3, '0').includes(q)
      );
    }

    // Ordenação
    if (this.sortBy === 'level_desc') {
      list.sort((a, b) => b.level - a.level);
    } else if (this.sortBy === 'pokedex_asc') {
      list.sort((a, b) => a.id - b.id);
    } else if (this.sortBy === 'name_asc') {
      list.sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name));
    }

    return list;
  }

  updateBoxBadge() {
    const counterNav = document.getElementById('nav-box-counter');
    const sideCounter = document.getElementById('side-box-counter');
    const headerTotal = document.getElementById('pc-total-count');
    if (counterNav) counterNav.textContent = this.storage.length;
    if (sideCounter) sideCounter.textContent = this.storage.length;
    if (headerTotal) headerTotal.textContent = this.storage.length;
  }

  setBox(boxNumber) {
    audio.playClick();
    this.currentBox = boxNumber;
    document.querySelectorAll('.box-tab-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-box') === String(boxNumber));
    });
    this.render();
  }

  render() {
    const container = document.getElementById('pc-box-grid');
    if (!container) return;

    this.updateBoxBadge();
    const list = this.getFilteredStorage();

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-pc-box">
          <div class="empty-pc-icon">💻</div>
          <h3>Esta Box está vazia</h3>
          <p>Capture Pokémon na Arena para guardá-los no PC do Bill!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => {
      const formattedId = String(item.id).padStart(3, '0');
      const officialImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${item.id}.png`;
      const staticSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.id}.png`;
      const primaryType = item.types[0] || 'Normal';
      const typeColor = TYPE_COLORS[primaryType] ? TYPE_COLORS[primaryType].bg : '#666';

      // Ícone da bola usada
      let ballImg = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
      if (item.ball.includes('Great')) ballImg = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png';
      else if (item.ball.includes('Ultra')) ballImg = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png';
      else if (item.ball.includes('Master')) ballImg = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png';

      return `
        <div class="pc-pokemon-card" onclick="box.openInspectModal('${item.uid}')" style="--card-accent: ${typeColor};">
          <div class="pc-card-header">
            <span class="pc-pkmn-lvl">Nv. ${item.level}</span>
            <img src="${ballImg}" class="pc-ball-icon" alt="${item.ball}" title="Capturado com ${item.ball}">
          </div>

          <div class="pc-sprite-container">
            <img src="${officialImg}" 
                 alt="${item.name}" 
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${staticSprite}';">
          </div>

          <div class="pc-card-body">
            <h4 class="pc-pkmn-nickname" title="${item.nickname}">${item.nickname}</h4>
            <span class="pc-pkmn-species">#${formattedId} ${item.name}</span>
            <div class="pc-types-row">
              ${item.types.map(t => {
                const conf = TYPE_COLORS[t] || { bg: '#666', text: '#fff' };
                return `<span class="type-badge-mini" style="background:${conf.bg}; color:${conf.text};">${t}</span>`;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Modal para inspecionar o Pokémon guardado na Box
  openInspectModal(uid) {
    audio.playClick();
    const pkmn = this.storage.find(p => p.uid === uid);
    if (!pkmn) return;

    this.selectedPokemon = pkmn;
    const modal = document.getElementById('pc-inspect-modal');
    const content = document.getElementById('pc-inspect-content');
    if (!modal || !content) return;

    const formattedId = String(pkmn.id).padStart(3, '0');
    const officialImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkmn.id}.png`;
    const showdownAnim = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pkmn.id}.gif`;
    const staticSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkmn.id}.png`;

    content.innerHTML = `
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-number">#${formattedId}</span>
          <h2 class="modal-name">${pkmn.nickname}</h2>
          ${pkmn.nickname !== pkmn.name ? `<span class="original-species">(${pkmn.name})</span>` : ''}
        </div>
        <button class="modal-close-btn" onclick="box.closeInspectModal()">×</button>
      </div>

      <div class="modal-body">
        <div class="modal-left">
          <div class="modal-sprite-box pc-stage">
            <img src="${officialImg}" 
                 alt="${pkmn.name}" 
                 class="modal-artwork" 
                 onerror="this.onerror=null; this.src='${staticSprite}';">
            <img src="${showdownAnim}" alt="${pkmn.name}" class="modal-showdown-anim" onerror="this.style.display='none';">
          </div>
          <div class="modal-types">
            ${pkmn.types.map(t => {
              const conf = TYPE_COLORS[t] || { bg: '#888', text: '#fff' };
              return `<span class="type-badge large" style="background:${conf.bg}; color:${conf.text};">${t}</span>`;
            }).join('')}
          </div>
        </div>

        <div class="modal-right">
          <div class="pc-log-box">
            <div class="pc-log-item">
              <span class="log-label">Nível de Poder:</span>
              <strong class="log-val text-yellow">Nv. ${pkmn.level}</strong>
            </div>
            <div class="pc-log-item">
              <span class="log-label">Capturado com:</span>
              <span class="log-val">🔴 ${pkmn.ball}</span>
            </div>
            <div class="pc-log-item">
              <span class="log-label">Data de Captura:</span>
              <span class="log-val">${pkmn.caughtAt}</span>
            </div>
          </div>

          <div class="modal-stats">
            <h4>Atributos Individuais</h4>
            <div class="stat-row">
              <span class="stat-name">HP</span>
              <div class="stat-bar-bg"><div class="stat-bar-fill hp" style="width: ${Math.min(100, (pkmn.hp / 300) * 100)}%"></div></div>
              <span class="stat-val">${pkmn.hp}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Ataque</span>
              <div class="stat-bar-bg"><div class="stat-bar-fill atk" style="width: ${Math.min(100, (pkmn.atk / 200) * 100)}%"></div></div>
              <span class="stat-val">${pkmn.atk}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Defesa</span>
              <div class="stat-bar-bg"><div class="stat-bar-fill def" style="width: ${Math.min(100, (pkmn.def / 220) * 100)}%"></div></div>
              <span class="stat-val">${pkmn.def}</span>
            </div>
          </div>

          <div class="pc-inspect-actions">
            <button class="btn-pc-action rename-btn" onclick="box.promptRenamePokemon('${pkmn.uid}')">
              ✏️ Mudar Apelido
            </button>
            <button class="btn-pc-action release-btn" onclick="box.promptReleasePokemon('${pkmn.uid}')">
              🌿 Soltar na Natureza
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  closeInspectModal() {
    audio.playClick();
    const modal = document.getElementById('pc-inspect-modal');
    if (modal) modal.classList.remove('active');
  }
}

const box = new BoxManager();

if (typeof window !== 'undefined') {
  window.box = box;
}
