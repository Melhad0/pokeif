# POKÉIF ⚡🔴

> Jogo Web Completo dos 151 Pokémon Originais da 1ª Geração de Kanto com Arena de Captura Dinâmica, Pokédex Regional, Box PC, Poké Mart e Sincronização em Nuvem via Google Firebase.

---

## 🎮 Funcionalidades Principais

### 🎯 1. Arena de Captura & Cenários Autênticos dos Jogos
- **6 Habitats de Kanto**: Rota 1 & 2 (Planície), Floresta de Viridian, Mt. Moon (Cavernas), Rota 21 (Oceano), Usina Elétrica Abandonada e Caverna Cerulean (Lendários).
- **Cenários Dinâmicos em Camadas**: Céu com nuvens animadas, silhuetas de montanhas, partículas ambientais (vaga-lumes, faíscas elétricas, esferas psíquicas, ondas marítimas).
- **Pedestais de Batalha 3D (Battle Bases)**: Plataformas tridimensionais temáticas onde os Pokémon selvagens ficam assentados (Grama, Musgo, Rocha, Vórtice Aquático, Placa Metálica e Altar Rúnico).
- **Fórmula de Captura Canônica**: Baseada na taxa de captura oficial (Catch Rate), tipo de Pokébola (Poké Ball, Great Ball, Ultra Ball, Master Ball) e bônus de Frutas (Frambo e Ananás).
- **Sequência de Suspense**: Animação balística do arremesso, absorção com feixe de luz vermelha e até 3 tremores (*shakes*) sincronizados com efeitos de áudio.

### 💻 2. Box Pokémon (PC do Treinador / Sistema de Bill)
- Armazenamento de monstrinhos capturados organizados em **3 Boxes de 30 vagas cada**.
- Filtros por tipo elemental, ordenação por Nível, Número da Pokédex e Recentes.
- Visualização de detalhes em alta resolução, sistema de **Favoritar (★)**, renomear com apelidos personalizados e soltar na natureza com recompensa (+₽ 150 e Fruta Frambo).

### 📖 3. Pokédex Regional de Kanto (151 Entradas)
- Banco de dados completo com todos os **151 Pokémon originais**.
- Indicadores em tempo real de vistos, capturados e percentual de progresso.
- Filtros instantâneos por nome, número, tipos elementais (17 tipos com cores oficiais) e status de coleção.
- Modal de detalhes da espécie com sprites oficiais, atributos base (HP, Ataque, Defesa) e descrições canônicas.

### 🏪 4. Poké Mart Oficial (Loja de Kanto)
- Sistema econômico em **Poké Dollars (₽)** com recompensa monetária ao capturar Pokémon raros ou soltar espécimes na Box.
- Balcão de compras da Silph Co. com seletores de quantidade (-/+, x5, x10 e numérico livre até 99).
- Balcão de revenda para descarregar excessos da mochila por 50% do valor de mercado.

### ☁️ 5. Sincronização em Nuvem (Google Firebase) & Login
- **Firebase Authentication**: Login com email e senha, cadastro de novo treinador com escolha de avatar (Ash 🧢, Red 🔴, Misty 💧, Blue ⚡, Gary 🕶️) e modo Convidado (*Guest Mode*).
- **Cloud Firestore**: Backup atômico e restauração em 1 clique de todos os 5 domínios do jogo (Pokédex, Box PC, Carteira e Mochila).
- **Identificador de Treinador em Nuvem**: Código exclusivo (`ASH-XXXXXX`) para carregar o progresso em qualquer dispositivo.

### 🔊 6. Efeitos Sonoros Retrô (Web Audio API)
- Sintetizador de áudio procedural sem dependência de arquivos externos: arremesso balístico, tremores de suspense, fanfarra clássica de Gotcha!, cliques de interface e tilintar de moedas.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico**: Estrutura acessível com layout de Dashboard moderno e barra lateral (*Sidebar*).
- **CSS3 Vanilla & Glassmorphism**: Design escuro, sombras volumétricas, neon dinâmico por tipo e animações fluidas a 60-120 FPS.
- **JavaScript Vanilla ES6+**: Arquitetura modular orientada a classes (`CaptureManager`, `BoxManager`, `PokedexManager`, `ShopManager`, `FirebaseService`).
- **Google Firebase v10 SDK**: Autenticação e persistência no Cloud Firestore.

---

## 🚀 Como Executar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/Melhad0/pokeif.git
cd pokeif
```

2. Inicie qualquer servidor HTTP local:
```bash
# Com Python 3:
python -m http.server 8000

# Ou com Node.js (npx):
npx serve .
```

3. Abra o navegador em:
```
http://localhost:8000
```

---

## 📄 Licença e Créditos
- Pokémon e seus personagens são marcas registradas da **Nintendo**, **Game Freak** e **Creatures Inc.**
- Sprites e dados fornecidos pela [PokéAPI](https://pokeapi.co/).
- Projeto desenvolvido para fins educacionais e de demonstração tecnológica.
