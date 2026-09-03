// Serviço de Conexão, Autenticação e Sincronização em Nuvem via Google Firebase
class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.isConnected = false;
    this.isSyncing = false;
    this.lastSyncedAt = localStorage.getItem('pokeif_last_cloud_sync') || null;
    
    // Identificador único do Treinador na nuvem
    this.trainerId = this.getOrCreateTrainerId();

    // Configuração do Firebase salva no navegador
    this.config = this.loadConfig();

    // Perfil do Treinador / Sessão do Usuário
    this.user = this.loadUser();
    this.selectedAvatar = this.user.avatar || '🧢';
    this.authMode = 'login'; // 'login' | 'signup' | 'profile'
  }

  loadUser() {
    const saved = localStorage.getItem('pokeif_trainer_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Erro ao ler dados do usuário salvo:", e);
      }
    }
    return {
      name: 'Treinador Kanto',
      avatar: '🧢',
      email: null,
      isGuest: true
    };
  }

  saveUser(user) {
    this.user = user;
    localStorage.setItem('pokeif_trainer_user', JSON.stringify(user));
    this.updateTrainerCardUI();
  }

  getOrCreateTrainerId() {
    let id = localStorage.getItem('pokeif_trainer_cloud_id');
    if (!id) {
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      id = `ASH-${rand}`;
      localStorage.setItem('pokeif_trainer_cloud_id', id);
    }
    return id;
  }

  loadConfig() {
    const saved = localStorage.getItem('pokeif_firebase_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Erro ao ler configuração salva do Firebase:", e);
      }
    }
    return {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    };
  }

  saveConfig(newConfig) {
    this.config = newConfig;
    localStorage.setItem('pokeif_firebase_config', JSON.stringify(newConfig));
    this.init();
  }

  hasValidConfig() {
    return !!(this.config && this.config.apiKey && this.config.projectId);
  }

  // Inicializa o Firebase e observador de sessão
  init() {
    this.updateTrainerCardUI();

    if (!window.firebase) {
      console.warn("Firebase SDK não detectado ou indisponível.");
      this.updateUI();
      return;
    }

    if (!this.hasValidConfig()) {
      this.isConnected = false;
      this.updateUI();
      return;
    }

    try {
      if (firebase.apps.length > 0) {
        this.app = firebase.apps[0];
      } else {
        this.app = firebase.initializeApp(this.config);
      }

      this.auth = firebase.auth();
      this.db = firebase.firestore();

      // Observador de estado de autenticação do Firebase
      this.auth.onAuthStateChanged(fbUser => {
        if (fbUser) {
          this.isConnected = true;
          if (!fbUser.isAnonymous) {
            this.user.email = fbUser.email;
            this.user.isGuest = false;
            if (fbUser.displayName) this.user.name = fbUser.displayName;
            this.saveUser(this.user);
          }
          this.updateUI();
        } else {
          this.updateUI();
        }
      });

    } catch (err) {
      console.error("Erro na inicialização do Firebase:", err);
      this.isConnected = false;
      this.updateUI();
    }
  }

  // ==========================================
  // SISTEMA DE AUTENTICAÇÃO (LOGIN / CADASTRO)
  // ==========================================

  openAuthModal() {
    if (typeof audio !== 'undefined' && audio.playClick) audio.playClick();
    const modal = document.getElementById('trainer-auth-modal');
    if (!modal) return;

    if (!this.user.isGuest) {
      this.setAuthMode('profile');
    } else {
      this.setAuthMode('login');
    }

    modal.classList.add('active');
  }

  closeAuthModal() {
    if (typeof audio !== 'undefined' && audio.playClick) audio.playClick();
    const modal = document.getElementById('trainer-auth-modal');
    if (modal) modal.classList.remove('active');
  }

  setAuthMode(mode) {
    if (typeof audio !== 'undefined' && audio.playClick) audio.playClick();
    this.authMode = mode;

    const titleEl = document.getElementById('auth-modal-title');
    const tabsNav = document.getElementById('auth-tabs-nav');
    const loginTabBtn = document.getElementById('tab-login-btn');
    const signupTabBtn = document.getElementById('tab-signup-btn');
    const avatarSec = document.getElementById('auth-avatar-section');
    const nameGroup = document.getElementById('auth-name-group');
    const credsFields = document.getElementById('auth-creds-fields');
    const profileView = document.getElementById('auth-profile-view');
    const submitBtn = document.getElementById('btn-auth-submit');
    const guestDivider = document.getElementById('auth-guest-divider');
    const guestBtn = document.getElementById('btn-guest-login');
    const switchPrompt = document.getElementById('auth-switch-prompt');

    if (mode === 'profile') {
      // Modo de visualização de perfil logado
      if (titleEl) titleEl.textContent = 'Perfil do Treinador';
      if (tabsNav) tabsNav.style.display = 'none';
      if (avatarSec) avatarSec.style.display = 'block';
      if (nameGroup) nameGroup.style.display = 'none';
      if (credsFields) credsFields.style.display = 'none';
      if (profileView) {
        profileView.style.display = 'flex';
        const pEmail = document.getElementById('profile-user-email');
        const pName = document.getElementById('profile-user-name');
        if (pEmail) pEmail.textContent = this.user.email || 'Email não associado';
        if (pName) pName.textContent = this.user.name;
      }
      if (submitBtn) submitBtn.style.display = 'none';
      if (guestDivider) guestDivider.style.display = 'none';
      if (guestBtn) guestBtn.style.display = 'none';
      if (switchPrompt) switchPrompt.style.display = 'none';
      this.selectAvatar(this.user.avatar || '🧢');
    } else {
      if (profileView) profileView.style.display = 'none';
      if (tabsNav) tabsNav.style.display = 'flex';
      if (credsFields) credsFields.style.display = 'flex';
      if (submitBtn) submitBtn.style.display = 'flex';
      if (guestDivider) guestDivider.style.display = 'flex';
      if (guestBtn) guestBtn.style.display = 'flex';
      if (switchPrompt) switchPrompt.style.display = 'block';

      if (mode === 'signup') {
        if (titleEl) titleEl.textContent = 'Criar Conta de Treinador';
        if (loginTabBtn) loginTabBtn.classList.remove('active');
        if (signupTabBtn) signupTabBtn.classList.add('active');
        if (avatarSec) avatarSec.style.display = 'block';
        if (nameGroup) nameGroup.style.display = 'block';
        if (submitBtn) submitBtn.textContent = '📝 Cadastrar e Iniciar Jornada';
        if (switchPrompt) {
          switchPrompt.innerHTML = 'Já possui uma conta? <a href="javascript:void(0)" onclick="fbService.setAuthMode(\'login\')">Faça login</a>';
        }
      } else {
        // modo login
        if (titleEl) titleEl.textContent = 'Entrar na Jornada';
        if (loginTabBtn) loginTabBtn.classList.add('active');
        if (signupTabBtn) signupTabBtn.classList.remove('active');
        if (avatarSec) avatarSec.style.display = 'none';
        if (nameGroup) nameGroup.style.display = 'none';
        if (submitBtn) submitBtn.textContent = '⚡ Entrar na Conta';
        if (switchPrompt) {
          switchPrompt.innerHTML = 'Novo por aqui? <a href="javascript:void(0)" onclick="fbService.setAuthMode(\'signup\')">Crie sua conta de Treinador</a>';
        }
      }
    }
  }

  selectAvatar(avatar) {
    if (typeof audio !== 'undefined' && audio.playClick) audio.playClick();
    this.selectedAvatar = avatar;
    document.querySelectorAll('.avatar-option-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-avatar') === avatar);
    });

    if (this.authMode === 'profile') {
      this.user.avatar = avatar;
      this.saveUser(this.user);
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast(`Avatar alterado para ${avatar}!`);
      }
    }
  }

  async handleAuthSubmit() {
    const emailInput = document.getElementById('auth-input-email');
    const passInput = document.getElementById('auth-input-password');
    const nameInput = document.getElementById('auth-input-name');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';
    const name = nameInput ? nameInput.value.trim() : '';

    if (!email || !email.includes('@')) {
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast('❌ Por favor, digite um email válido.');
      }
      return;
    }

    if (!password || password.length < 6) {
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast('❌ A senha deve conter pelo menos 6 caracteres.');
      }
      return;
    }

    if (this.authMode === 'signup') {
      const finalName = name || email.split('@')[0];
      await this.signUp(email, password, finalName, this.selectedAvatar);
    } else {
      await this.login(email, password);
    }
  }

  // Executar Login
  async login(email, password) {
    if (this.auth && this.hasValidConfig()) {
      try {
        const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
        const fbUser = userCredential.user;
        this.user = {
          name: fbUser.displayName || email.split('@')[0],
          email: fbUser.email,
          avatar: this.selectedAvatar || '🧢',
          isGuest: false
        };
        this.saveUser(this.user);
        this.closeAuthModal();
        if (typeof audio !== 'undefined' && audio.playEncounter) audio.playEncounter();
        if (typeof app !== 'undefined' && app.showToast) {
          app.showToast(`👋 Bem-vindo de volta, ${this.user.name}!`);
        }
        // Tenta sincronizar backup da nuvem
        this.loadFromCloud();
      } catch (err) {
        console.error("Erro no login do Firebase:", err);
        if (typeof app !== 'undefined' && app.showToast) {
          app.showToast(`❌ Falha no login: ${err.message}`);
        }
      }
    } else {
      // Fallback local caso Firebase ainda não tenha sido configurado
      this.user = {
        name: email.split('@')[0],
        email: email,
        avatar: this.selectedAvatar || '🧢',
        isGuest: false
      };
      this.saveUser(this.user);
      this.closeAuthModal();
      if (typeof audio !== 'undefined' && audio.playEncounter) audio.playEncounter();
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast(`👋 Bem-vindo, Treinador ${this.user.name}! (Sessão Local)`);
      }
    }
  }

  // Executar Cadastro
  async signUp(email, password, name, avatar) {
    if (this.auth && this.hasValidConfig()) {
      try {
        const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        this.user = {
          name: name,
          email: email,
          avatar: avatar,
          isGuest: false
        };
        this.saveUser(this.user);
        this.closeAuthModal();
        if (typeof audio !== 'undefined' && audio.playEncounter) audio.playEncounter();
        if (typeof app !== 'undefined' && app.showToast) {
          app.showToast(`🎉 Conta criada com sucesso! Boa jornada, ${name}!`);
        }
        // Salva estado inicial na nuvem
        this.saveToCloud(true);
      } catch (err) {
        console.error("Erro no cadastro do Firebase:", err);
        if (typeof app !== 'undefined' && app.showToast) {
          app.showToast(`❌ Falha no cadastro: ${err.message}`);
        }
      }
    } else {
      // Fallback local
      this.user = {
        name: name,
        email: email,
        avatar: avatar,
        isGuest: false
      };
      this.saveUser(this.user);
      this.closeAuthModal();
      if (typeof audio !== 'undefined' && audio.playEncounter) audio.playEncounter();
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast(`🎉 Bem-vindo ao mundo Pokémon, ${name}!`);
      }
    }
  }

  // Jogar como Convidado
  handleGuestLogin() {
    this.user = {
      name: 'Treinador Convidado',
      avatar: '🧢',
      email: null,
      isGuest: true
    };
    this.saveUser(this.user);
    this.closeAuthModal();
    if (typeof audio !== 'undefined' && audio.playClick) audio.playClick();
    if (typeof app !== 'undefined' && app.showToast) {
      app.showToast("🎮 Jogando no Modo Convidado. Seu progresso é salvo no navegador!");
    }
  }

  // Logout / Desconectar
  logout() {
    if (this.auth && this.hasValidConfig()) {
      this.auth.signOut().catch(err => console.warn(err));
    }
    this.user = {
      name: 'Treinador Convidado',
      avatar: '🧢',
      email: null,
      isGuest: true
    };
    this.saveUser(this.user);
    this.closeAuthModal();
    if (typeof audio !== 'undefined' && audio.playClick) audio.playClick();
    if (typeof app !== 'undefined' && app.showToast) {
      app.showToast("🚪 Sessão encerrada. Até a próxima jornada!");
    }
  }

  updateTrainerCardUI() {
    const avatarEl = document.getElementById('sidebar-trainer-avatar');
    const nameEl = document.getElementById('sidebar-trainer-name');
    const rankEl = document.getElementById('sidebar-trainer-rank');
    const authBtn = document.getElementById('btn-trainer-auth');
    const authIcon = document.getElementById('trainer-auth-icon');

    if (avatarEl) avatarEl.textContent = this.user.avatar || '🧢';
    if (nameEl) nameEl.textContent = this.user.name || 'Treinador Kanto';
    if (rankEl) {
      rankEl.textContent = this.user.isGuest ? 'Treinador Convidado' : 'Treinador Oficial';
      rankEl.style.color = this.user.isGuest ? '#94a3b8' : '#60a5fa';
    }
    if (authIcon) {
      authIcon.textContent = this.user.isGuest ? '🔑' : '👤';
    }
    if (authBtn) {
      authBtn.title = this.user.isGuest ? 'Fazer Login / Cadastrar' : 'Ver Perfil / Trocar Conta';
    }
  }

  // ==========================================
  // SINCRONIZAÇÃO EM NUVEM (FIRESTORE)
  // ==========================================

  // Salvar todo o estado do jogo na nuvem (Firestore)
  async saveToCloud(silent = false) {
    if (!this.isConnected || !this.db) {
      if (!silent && typeof app !== 'undefined' && app.showToast) {
        app.showToast("⚠️ Firebase não configurado. Abra as configurações de Nuvem.");
        this.openCloudModal();
      }
      return false;
    }

    try {
      this.isSyncing = true;
      this.updateUI();

      const payload = {
        trainerId: this.trainerId,
        user: this.user,
        updatedAt: new Date().toISOString(),
        pokedex: {
          caught: (typeof pokedex !== 'undefined' && pokedex.caught) ? pokedex.caught : [],
          seen: (typeof pokedex !== 'undefined' && pokedex.seen) ? pokedex.seen : [],
          history: (typeof pokedex !== 'undefined' && pokedex.history) ? pokedex.history : {}
        },
        boxStorage: (typeof box !== 'undefined' && box.storage) ? box.storage : [],
        money: (typeof shop !== 'undefined' && shop.money) ? shop.money : 2500,
        inventory: (typeof capture !== 'undefined' && capture.inventory) ? capture.inventory : {
          balls: { poke: 25, great: 10, ultra: 5, master: 1 },
          berries: { razz: 5, nanab: 3 }
        }
      };

      await this.db.collection('trainers').doc(this.trainerId).set(payload, { merge: true });

      this.isSyncing = false;
      this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
      localStorage.setItem('pokeif_last_cloud_sync', this.lastSyncedAt);
      this.updateUI();

      if (typeof audio !== 'undefined' && audio.playBuy) audio.playBuy();
      if (!silent && typeof app !== 'undefined' && app.showToast) {
        app.showToast("☁️ Progresso salvo na Nuvem Firebase com sucesso!");
      }
      return true;
    } catch (err) {
      this.isSyncing = false;
      this.updateUI();
      console.error("Erro ao salvar no Firestore:", err);
      if (!silent && typeof app !== 'undefined' && app.showToast) {
        app.showToast(`❌ Falha ao sincronizar: ${err.message}`);
      }
      return false;
    }
  }

  // Restaurar dados da nuvem para o jogo
  async loadFromCloud() {
    if (!this.isConnected || !this.db) {
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast("⚠️ Conecte ao Firebase primeiro.");
        this.openCloudModal();
      }
      return false;
    }

    try {
      this.isSyncing = true;
      this.updateUI();

      const doc = await this.db.collection('trainers').doc(this.trainerId).get();

      if (!doc.exists) {
        this.isSyncing = false;
        this.updateUI();
        if (typeof app !== 'undefined' && app.showToast) {
          app.showToast("Nenhum backup encontrado na nuvem para este ID.");
        }
        return false;
      }

      const data = doc.data();

      // Restaura Perfil do Usuário
      if (data.user) {
        this.saveUser(data.user);
      }

      // Restaura Pokédex
      if (data.pokedex) {
        localStorage.setItem('pokeif_caught', JSON.stringify(data.pokedex.caught || []));
        localStorage.setItem('pokeif_seen', JSON.stringify(data.pokedex.seen || []));
        localStorage.setItem('pokeif_history', JSON.stringify(data.pokedex.history || {}));
        if (typeof pokedex !== 'undefined') {
          pokedex.caught = data.pokedex.caught || [];
          pokedex.seen = data.pokedex.seen || [];
          pokedex.history = data.pokedex.history || {};
          pokedex.updateProgressBadge();
          pokedex.renderGrid();
        }
      }

      // Restaura Box PC
      if (data.boxStorage) {
        localStorage.setItem('pokeif_box_storage', JSON.stringify(data.boxStorage));
        if (typeof box !== 'undefined') {
          box.storage = data.boxStorage;
          box.updateBoxBadge();
          box.render();
        }
      }

      // Restaura Saldo
      if (typeof data.money !== 'undefined') {
        localStorage.setItem('pokeif_money', data.money);
        if (typeof shop !== 'undefined') {
          shop.money = data.money;
          shop.updateMoneyDisplays();
          shop.render();
        }
      }

      // Restaura Inventário de Mochila
      if (data.inventory) {
        localStorage.setItem('pokeif_inventory', JSON.stringify(data.inventory));
        if (typeof capture !== 'undefined') {
          capture.inventory = data.inventory;
          capture.updateInventoryUI();
          capture.updateInventoryBadges();
        }
      }

      this.isSyncing = false;
      this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
      this.updateUI();

      if (typeof audio !== 'undefined' && audio.playEncounter) audio.playEncounter();
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast("🎉 Dados restaurados da Nuvem com sucesso!");
      }
      this.closeCloudModal();
      return true;

    } catch (err) {
      this.isSyncing = false;
      this.updateUI();
      console.error("Erro ao carregar dados do Firestore:", err);
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast(`❌ Erro ao baixar dados: ${err.message}`);
      }
      return false;
    }
  }

  // Atualiza indicadores visuais de status da nuvem
  updateUI() {
    const badge = document.getElementById('sidebar-cloud-badge');
    const modalStatus = document.getElementById('cloud-status-text');
    const modalIcon = document.getElementById('cloud-status-icon');
    const lastSyncEl = document.getElementById('cloud-last-sync');
    const trainerIdEl = document.getElementById('cloud-trainer-id');

    if (trainerIdEl) trainerIdEl.textContent = this.trainerId;
    if (lastSyncEl) lastSyncEl.textContent = this.lastSyncedAt ? `Hoje às ${this.lastSyncedAt}` : 'Nunca';

    if (this.isSyncing) {
      if (badge) {
        badge.innerHTML = '<span class="status-dot syncing"></span> Sincronizando...';
        badge.className = 'sidebar-cloud-badge syncing';
      }
      if (modalStatus) modalStatus.textContent = 'Sincronizando dados com a Nuvem...';
      if (modalIcon) modalIcon.textContent = '🔄';
    } else if (this.isConnected) {
      if (badge) {
        badge.innerHTML = '<span class="status-dot online"></span> Nuvem Conectada';
        badge.className = 'sidebar-cloud-badge online';
      }
      if (modalStatus) modalStatus.textContent = 'Conectado ao Firebase Firestore';
      if (modalIcon) modalIcon.textContent = '☁️';
    } else {
      if (badge) {
        badge.innerHTML = '<span class="status-dot offline"></span> Modo Local (Offline)';
        badge.className = 'sidebar-cloud-badge offline';
      }
      if (modalStatus) modalStatus.textContent = 'Modo Local (Configure o Firebase)';
      if (modalIcon) modalIcon.textContent = '💾';
    }
  }

  // Modais de Controle
  openCloudModal() {
    if (typeof audio !== 'undefined' && audio.playClick) audio.playClick();
    const modal = document.getElementById('firebase-cloud-modal');
    if (!modal) return;

    const apiKeyInput = document.getElementById('fb-api-key');
    const projectIdInput = document.getElementById('fb-project-id');
    const authDomainInput = document.getElementById('fb-auth-domain');
    const appIdInput = document.getElementById('fb-app-id');

    if (apiKeyInput) apiKeyInput.value = this.config.apiKey || '';
    if (projectIdInput) projectIdInput.value = this.config.projectId || '';
    if (authDomainInput) authDomainInput.value = this.config.authDomain || '';
    if (appIdInput) appIdInput.value = this.config.appId || '';

    this.updateUI();
    modal.classList.add('active');
  }

  closeCloudModal() {
    if (typeof audio !== 'undefined' && audio.playClick) audio.playClick();
    const modal = document.getElementById('firebase-cloud-modal');
    if (modal) modal.classList.remove('active');
  }

  handleSaveCredentials() {
    const apiKey = document.getElementById('fb-api-key').value.trim();
    const projectId = document.getElementById('fb-project-id').value.trim();
    const authDomain = document.getElementById('fb-auth-domain').value.trim() || `${projectId}.firebaseapp.com`;
    const appId = document.getElementById('fb-app-id').value.trim();

    if (!apiKey || !projectId) {
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast("❌ Preencha pelo menos a Chave de API e o ID do Projeto.");
      }
      return;
    }

    const newConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket: `${projectId}.appspot.com`,
      messagingSenderId: "",
      appId
    };

    this.saveConfig(newConfig);
    if (typeof app !== 'undefined' && app.showToast) {
      app.showToast("💾 Configuração do Firebase salva com sucesso!");
    }
  }

  copyTrainerId() {
    navigator.clipboard.writeText(this.trainerId).then(() => {
      if (typeof app !== 'undefined' && app.showToast) {
        app.showToast(`📋 ID ${this.trainerId} copiado para a área de transferência!`);
      }
    });
  }
}

const fbService = new FirebaseService();

if (typeof window !== 'undefined') {
  window.fbService = fbService;
}
