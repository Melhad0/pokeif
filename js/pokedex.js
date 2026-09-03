// Gerenciador da Pokédex de Kanto (151 Pokémon)
class PokedexManager {
  constructor() {
    this.caught = this.loadData('pokeif_caught', []);
    this.seen = this.loadData('pokeif_seen', []);
    this.history = this.loadData('pokeif_history', {});
    this.activeTypeFilter = 'all';
    this.activeStatusFilter = 'all';
    this.searchQuery = '';
  }

  loadData(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn("Erro ao ler localStorage:", e);
      return fallback;
    }
  }

  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn("Erro ao salvar localStorage:", e);
    }
  }

  registerSeen(pokemonId) {
    if (!this.seen.includes(pokemonId)) {
      this.seen.push(pokemonId);
      this.saveData('pokeif_seen', this.seen);
      this.updateProgressBadge();
    }
  }

  registerCatch(pokemon, ballUsed = "Poké Ball") {
    if (!this.caught.includes(pokemon.id)) {
      this.caught.push(pokemon.id);
      this.saveData('pokeif_caught', this.caught);
    }
    if (!this.seen.includes(pokemon.id)) {
      this.seen.push(pokemon.id);
      this.saveData('pokeif_seen', this.seen);
    }

    // Registrar histórico da captura
    if (!this.history[pokemon.id]) {
      this.history[pokemon.id] = {
        firstCaught: new Date().toLocaleDateString('pt-BR'),
        count: 0,
        ball: ballUsed
      };
    }
    this.history[pokemon.id].count += 1;
    this.saveData('pokeif_history', this.history);

    this.updateProgressBadge();
    return this.caught.length;
  }

  isCaught(id) {
    return this.caught.includes(id);
  }

  isSeen(id) {
    return this.seen.includes(id);
  }

  getCaughtCount() {
    return this.caught.length;
  }

  getSeenCount() {
    return this.seen.length;
  }

  updateProgressBadge() {
    const caughtEl = document.getElementById('pokedex-caught-count');
    const seenEl = document.getElementById('pokedex-seen-count');
    const percentEl = document.getElementById('pokedex-progress-bar');
    const innerCaught = document.getElementById('pokedex-caught-count-inner');
    const navCounter = document.getElementById('nav-pokedex-counter');
    const sideCounter = document.getElementById('side-pokedex-counter');
    const sidePct = document.getElementById('side-progress-pct');
    const sideFill = document.getElementById('side-progress-fill');
    const sideCaught = document.getElementById('side-caught-val');
    const mobileCount = document.getElementById('mobile-pokedex-count');

    const total = this.caught.length;
    const pct = ((total / 151) * 100).toFixed(1);

    if (caughtEl) caughtEl.textContent = total;
    if (innerCaught) innerCaught.textContent = `${total} capturados`;
    if (seenEl) seenEl.textContent = this.seen.length;
    if (navCounter) navCounter.textContent = `${total}/151`;
    if (sideCounter) sideCounter.textContent = `${total}/151`;
    if (mobileCount) mobileCount.textContent = `${total}/151`;
    if (sideCaught) sideCaught.textContent = total;
    if (sidePct) sidePct.textContent = `${pct}%`;
    if (sideFill) sideFill.style.width = `${pct}%`;
    if (percentEl) percentEl.style.width = `${pct}%`;
  }

  getFilteredPokemon() {
    return KANTO_POKEMON.filter(pkmn => {
      // Filtro de busca por nome ou número
      const matchesSearch = pkmn.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            String(pkmn.id).padStart(3, '0').includes(this.searchQuery);

      // Filtro por tipo
      const matchesType = this.activeTypeFilter === 'all' || pkmn.types.includes(this.activeTypeFilter);

      // Filtro por status
      let matchesStatus = true;
      if (this.activeStatusFilter === 'caught') {
        matchesStatus = this.isCaught(pkmn.id);
      } else if (this.activeStatusFilter === 'uncaught') {
        matchesStatus = !this.isCaught(pkmn.id);
      } else if (this.activeStatusFilter === 'seen') {
        matchesStatus = this.isSeen(pkmn.id);
      }

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  renderGrid() {
    const grid = document.getElementById('pokedex-grid');
    if (!grid) return;

    const filtered = this.getFilteredPokemon();

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-pokedex">
          <p>Nenhum Pokémon encontrado com os filtros selecionados.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(pkmn => {
      const isCaught = this.isCaught(pkmn.id);
      const isSeen = this.isSeen(pkmn.id);
      const formattedId = String(pkmn.id).padStart(3, '0');
      const officialImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkmn.id}.png`;
      const fallbackImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkmn.id}.png`;

      let cardClass = 'pokedex-card';
      let displayName = pkmn.name;
      let imgStyle = '';

      if (!isCaught && !isSeen) {
        cardClass += ' unrevealed';
        displayName = '???';
        imgStyle = 'filter: brightness(0) opacity(0.2);';
      } else if (isSeen && !isCaught) {
        cardClass += ' seen-only';
        imgStyle = 'filter: brightness(0) opacity(0.5);';
      } else {
        cardClass += ' caught';
      }

      const primaryType = pkmn.types[0];
      const typeColor = TYPE_COLORS[primaryType] ? TYPE_COLORS[primaryType].bg : '#777';

      return `
        <div class="${cardClass}" onclick="pokedex.openDetailModal(${pkmn.id})" style="--card-theme: ${typeColor};">
          <div class="card-top">
            <span class="card-id">#${formattedId}</span>
            ${isCaught ? '<span class="caught-tag">✓ Capturado</span>' : ''}
          </div>
          <div class="card-img-wrapper">
            <img src="${officialImg}" 
                 alt="${displayName}" 
                 loading="lazy"
                 style="${imgStyle}"
                 onerror="this.onerror=null; this.src='${fallbackImg}';">
          </div>
          <div class="card-info">
            <h4 class="card-name">${displayName}</h4>
            <div class="card-types">
              ${isCaught ? pkmn.types.map(t => {
                const conf = TYPE_COLORS[t] || { bg: '#888', text: '#fff' };
                return `<span class="type-badge" style="background:${conf.bg}; color:${conf.text};">${t}</span>`;
              }).join('') : '<span class="type-badge unk">???</span>'}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  openDetailModal(pokemonId) {
    audio.playClick();
    const pkmn = KANTO_POKEMON.find(p => p.id === pokemonId);
    if (!pkmn) return;

    const isCaught = this.isCaught(pkmn.id);
    const isSeen = this.isSeen(pkmn.id);
    const modal = document.getElementById('pokedex-modal');
    const modalContent = document.getElementById('pokedex-modal-content');
    if (!modal || !modalContent) return;

    const formattedId = String(pkmn.id).padStart(3, '0');
    const officialImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkmn.id}.png`;
    const animatedSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pkmn.id}.gif`;
    const fallbackImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkmn.id}.png`;
    
    const habitat = KANTO_HABITATS[pkmn.habitat] || { name: 'Kanto Desconhecido', icon: '📍' };
    const historyInfo = this.history[pkmn.id] || { count: isCaught ? 1 : 0, firstCaught: 'Hoje' };

    modalContent.innerHTML = `
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-number">#${formattedId}</span>
          <h2 class="modal-name">${isSeen || isCaught ? pkmn.name : '???'}</h2>
        </div>
        <button class="modal-close-btn" onclick="pokedex.closeDetailModal()">×</button>
      </div>

      <div class="modal-body">
        <div class="modal-left">
          <div class="modal-sprite-box">
            <img src="${officialImg}" 
                 alt="${pkmn.name}" 
                 class="modal-artwork" 
                 style="${!isCaught && !isSeen ? 'filter: brightness(0) opacity(0.2);' : (!isCaught ? 'filter: brightness(0) opacity(0.4);' : '')}"
                 onerror="this.onerror=null; this.src='${fallbackImg}';">
            ${isCaught ? `<img src="${animatedSprite}" alt="${pkmn.name}" class="modal-showdown-anim" onerror="this.style.display='none';">` : ''}
          </div>
          <div class="modal-types">
            ${isCaught || isSeen ? pkmn.types.map(t => {
              const conf = TYPE_COLORS[t] || { bg: '#888', text: '#fff' };
              return `<span class="type-badge large" style="background:${conf.bg}; color:${conf.text};">${t}</span>`;
            }).join('') : '<span class="type-badge large unk">Desconhecido</span>'}
          </div>
        </div>

        <div class="modal-right">
          <div class="modal-status-indicator ${isCaught ? 'status-caught' : 'status-uncaught'}">
            ${isCaught ? `★ Registrado na Coleção (${historyInfo.count}x capturado)` : (isSeen ? '👁️ Apenas Visto na Natureza' : '❓ Ainda não encontrado')}
          </div>

          <p class="modal-desc">
            "${isCaught || isSeen ? pkmn.desc : 'Dados não registrados na Pokédex. Encontre e capture este Pokémon para desbloquear seu perfil completo.'}"
          </p>

          <div class="modal-stats">
            <h4>Estatísticas Base</h4>
            <div class="stat-row">
              <span class="stat-name">HP</span>
              <div class="stat-bar-bg"><div class="stat-bar-fill hp" style="width: ${Math.min(100, (pkmn.hp / 250) * 100)}%"></div></div>
              <span class="stat-val">${isCaught ? pkmn.hp : '??'}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Ataque</span>
              <div class="stat-bar-bg"><div class="stat-bar-fill atk" style="width: ${Math.min(100, (pkmn.atk / 150) * 100)}%"></div></div>
              <span class="stat-val">${isCaught ? pkmn.atk : '??'}</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Defesa</span>
              <div class="stat-bar-bg"><div class="stat-bar-fill def" style="width: ${Math.min(100, (pkmn.def / 180) * 100)}%"></div></div>
              <span class="stat-val">${isCaught ? pkmn.def : '??'}</span>
            </div>
          </div>

          <div class="modal-habitat-tag">
            <span class="habitat-icon">${habitat.icon}</span>
            <span>Habitat: <strong>${habitat.name}</strong></span>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  closeDetailModal() {
    audio.playClick();
    const modal = document.getElementById('pokedex-modal');
    if (modal) modal.classList.remove('active');
  }
}

const pokedex = new PokedexManager();

if (typeof window !== 'undefined') {
  window.pokedex = pokedex;
}
