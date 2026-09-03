// Aplicação Principal - Orquestrador do POKÉIF
class PokeApp {
  constructor() {
    this.currentTab = 'hunt'; // 'hunt' ou 'pokedex'
  }

  init() {
    this.bindEvents();
    capture.setHabitat('route1');
    pokedex.updateProgressBadge();
    pokedex.renderGrid();
    capture.updateInventoryUI();
    box.updateBoxBadge();
    box.render();
    shop.updateMoneyDisplays();
    if (typeof fbService !== 'undefined') {
      fbService.init();
    }

    // Notificação de boas-vindas na primeira vez
    if (!localStorage.getItem('pokeif_visited')) {
      localStorage.setItem('pokeif_visited', 'true');
      setTimeout(() => {
        this.showToast("👋 Bem-vindo ao mundo Pokémon! Explore as rotas de Kanto e capture os 151 originais!");
      }, 500);
    }
  }

  bindEvents() {
    // Alternância de abas (Sidebar e navegação)
    document.querySelectorAll('.nav-tab-btn, .nav-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
        this.closeSidebar();
      });
    });

    // Controle da Sidebar Mobile
    const toggleSidebarBtn = document.getElementById('btn-toggle-sidebar');
    const closeSidebarBtn = document.getElementById('btn-close-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', () => this.openSidebar());
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => this.closeSidebar());
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => this.closeSidebar());

    // Seletor de habitat
    document.querySelectorAll('.habitat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        audio.playClick();
        const habitatKey = pill.getAttribute('data-habitat');
        document.querySelectorAll('.habitat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        capture.setHabitat(habitatKey);
      });
    });

    // Botão de busca de Pokémon selvagem
    const searchBtn = document.getElementById('btn-search-wild');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => capture.searchWildPokemon());
    }

    // Botão de arremesso
    const throwBtn = document.getElementById('btn-throw-ball');
    if (throwBtn) {
      throwBtn.addEventListener('click', () => capture.throwBall());
    }

    // Botão de fugir
    const runBtn = document.getElementById('btn-run-away');
    if (runBtn) {
      runBtn.addEventListener('click', () => capture.runAway());
    }

    // Seleção de Pokébolas
    document.querySelectorAll('.ball-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const ballType = slot.getAttribute('data-ball');
        capture.selectBall(ballType);
      });
    });

    // Seleção de Frutas
    document.querySelectorAll('.berry-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const berryType = slot.getAttribute('data-berry');
        capture.useBerry(berryType);
      });
    });

    // Pacote de suprimentos do Professor Carvalho
    const claimBtn = document.getElementById('btn-claim-supplies');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => capture.claimFreeSupplies());
    }

    // Botão de áudio / mudo
    const audioBtn = document.getElementById('btn-toggle-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        audioBtn.textContent = isMuted ? '🔇 Mudo' : '🔊 Som';
        audioBtn.classList.toggle('muted', isMuted);
      });
    }

    // Filtros da Pokédex
    const searchInput = document.getElementById('pokedex-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        pokedex.searchQuery = e.target.value.trim();
        pokedex.renderGrid();
      });
    }

    const typeFilterSelect = document.getElementById('pokedex-type-filter');
    if (typeFilterSelect) {
      typeFilterSelect.addEventListener('change', (e) => {
        audio.playClick();
        pokedex.activeTypeFilter = e.target.value;
        pokedex.renderGrid();
      });
    }

    document.querySelectorAll('.status-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        document.querySelectorAll('.status-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        pokedex.activeStatusFilter = btn.getAttribute('data-status');
        pokedex.renderGrid();
      });
    });

    // Controles da Box do PC
    const pcSearchInput = document.getElementById('pc-search-input');
    if (pcSearchInput) {
      pcSearchInput.addEventListener('input', (e) => {
        box.searchQuery = e.target.value.trim();
        box.render();
      });
    }

    const pcSortSelect = document.getElementById('pc-sort-select');
    if (pcSortSelect) {
      pcSortSelect.addEventListener('change', (e) => {
        audio.playClick();
        box.sortBy = e.target.value;
        box.render();
      });
    }

    document.querySelectorAll('.box-tab-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        box.setBox(pill.getAttribute('data-box'));
      });
    });

    // Fechar modais ao clicar fora do conteúdo
    const pkmModal = document.getElementById('pokedex-modal');
    if (pkmModal) {
      pkmModal.addEventListener('click', (e) => {
        if (e.target === pkmModal) pokedex.closeDetailModal();
      });
    }

    const pcModal = document.getElementById('pc-inspect-modal');
    if (pcModal) {
      pcModal.addEventListener('click', (e) => {
        if (e.target === pcModal) box.closeInspectModal();
      });
    }

    const releaseModal = document.getElementById('pc-confirm-release-modal');
    if (releaseModal) {
      releaseModal.addEventListener('click', (e) => {
        if (e.target === releaseModal) box.closeReleaseConfirmModal();
      });
    }

    const renameModal = document.getElementById('pc-rename-modal');
    if (renameModal) {
      renameModal.addEventListener('click', (e) => {
        if (e.target === renameModal) box.closeRenameModal();
      });
    }

    const cloudModal = document.getElementById('firebase-cloud-modal');
    if (cloudModal) {
      cloudModal.addEventListener('click', (e) => {
        if (e.target === cloudModal) fbService.closeCloudModal();
      });
    }

    const authModal = document.getElementById('trainer-auth-modal');
    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) fbService.closeAuthModal();
      });
    }

    // Atalhos de teclado (Espaço = Buscar ou Jogar Bola, Esc = Fechar Modais)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        pokedex.closeDetailModal();
        box.closeInspectModal();
        box.closeReleaseConfirmModal();
        box.closeRenameModal();
        if (typeof fbService !== 'undefined') {
          fbService.closeCloudModal();
          fbService.closeAuthModal();
        }
      } else if (e.key === ' ' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        if (!capture.isEncounterActive && !capture.isCatching) {
          capture.searchWildPokemon();
        } else if (capture.isEncounterActive && !capture.isCatching) {
          capture.throwBall();
        }
      }
    });
  }

  switchTab(tab) {
    audio.playClick();
    this.currentTab = tab;

    // Atualiza botões de navegação e sidebar
    document.querySelectorAll('.nav-tab-btn, .nav-item-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    // Atualiza visibilidade dos painéis
    const huntPanel = document.getElementById('tab-hunt-panel');
    const boxPanel = document.getElementById('tab-box-panel');
    const pokedexPanel = document.getElementById('tab-pokedex-panel');

    if (huntPanel) huntPanel.classList.toggle('hidden', tab !== 'hunt');
    if (boxPanel) boxPanel.classList.toggle('hidden', tab !== 'box');
    if (pokedexPanel) pokedexPanel.classList.toggle('hidden', tab !== 'pokedex');
    const shopPanel = document.getElementById('tab-shop-panel');
    if (shopPanel) shopPanel.classList.toggle('hidden', tab !== 'shop');

    if (tab === 'box') {
      box.render();
      box.updateBoxBadge();
    } else if (tab === 'pokedex') {
      pokedex.renderGrid();
      pokedex.updateProgressBadge();
    } else if (tab === 'shop') {
      shop.render();
    }
  }

  showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  openSidebar() {
    audio.playClick();
    const sidebar = document.getElementById('game-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
  }

  closeSidebar() {
    const sidebar = document.getElementById('game-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }
}

const app = new PokeApp();
if (typeof window !== 'undefined') {
  window.app = app;
}
document.addEventListener('DOMContentLoaded', () => app.init());
