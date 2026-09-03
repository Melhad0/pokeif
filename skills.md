# Diretrizes de Engenharia, Arquitetura e Alto Desempenho (skills.md)

Este documento estabelece os padrões técnicos, regras arquiteturais, diretrizes de otimização de baixo nível e convenções de engenharia para o ecossistema do jogo web **Pokémon Kanto (151 Originais)**, com foco obsessivo em **performance, responsividade a 60-120 FPS, eficiência de memória e manutenibilidade**.

---

## 1. Arquitetura de Software e Padrões de Projeto

### 1.1 Separação Rígida de Camadas (SoC - Separation of Concerns)
O sistema deve seguir o desacoplamento estrito entre quatro camadas fundamentais:
```
┌─────────────────────────────────────────────────────────────┐
│                       Camada de Visão (UI)                  │
│       (index.html, styles.css, CSS Variables & Hardware Accel)│
└──────────────────────────────┬──────────────────────────────┘
                               │ Eventos do Usuário & Renderização
┌──────────────────────────────▼──────────────────────────────┐
│                    Camada de Controle / Aplicação           │
│         (app.js - Orquestrador de Telas, Router & Toasts)   │
└──────────────┬───────────────────────────────┬──────────────┘
               │ Invocações                    │ Notificações
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│    Domínio: Captura & FSM   │ │     Domínio: Pokédex        │
│   (capture.js - Rolagens)   │ │  (pokedex.js - Filtros O(1))│
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │ Síntese de Áudio              │
┌──────────────▼──────────────┐                │ Consulta
│   Motor de Áudio WebAudio   │                │
│    (audio.js - Procedural)  │                │
└─────────────────────────────┘                │
               │                               │
┌──────────────▼───────────────────────────────▼──────────────┐
│                      Camada de Dados                        │
│   (kanto-pokemon.js - Dataset Canônico Imutável & Índices)  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Máquina de Estados Finitos (FSM - Finite State Machine)
O fluxo de combate e captura não deve conter condicionais dispersas ou estados concorrentes inconsistentes. O `CaptureManager` deve operar como uma FSM estrita:
```
[IDLE] ──(buscar)──> [SEARCHING] ──(sucesso)──> [ENCOUNTER_INTRO]
                                                       │
[FLED] <──(fugiu)──── [RESOLVE_FAIL] <───┐             ▼
                         ▲               │     [AWAITING_ACTION]
                         │               │             │
                  (quebrou bola)         │        (arremessou)
                         │               │             │
                    [SHAKE_LOOP] ◄───────┴───── [BALL_THROWN]
                         │                             │
                   (3x shakes ok)                      ▼
                         │                      [IMPACT_ABSORB]
                         ▼
                  [RESOLVE_SUCCESS] ──(fechar)──> [IDLE]
```
- Durante os estados `BALL_THROWN`, `IMPACT_ABSORB` e `SHAKE_LOOP`, toda a interface de ação de botões deve ser travada atomicamente para prevenir *race conditions* ou cliques duplos.

---

## 2. Otimizações Críticas de Desempenho e Render Pipeline

### 2.1 Orçamento de Frames (Frame Budget a 60 FPS / 16.6ms e 120 FPS / 8.3ms)
- **Eliminação de Layout Thrashing (Reflows Forçados)**:
  - Nunca ler propriedades geométricas computadas (`offsetWidth`, `clientHeight`, `getBoundingClientRect`) logo após uma mutação de estilo no mesmo frame.
  - Agrupar leituras e escritas no DOM via `window.requestAnimationFrame()` (rAF).
- **Aceleração por GPU (Compositor Layers)**:
  - Todas as animações do jogo (arremesso da Pokébola, rotação, balanço de grama e tremores) devem animar **exclusivamente** propriedades processadas na GPU: `transform` (`translate3d`, `scale`, `rotate`) e `opacity`.
  - Elementos altamente animados devem possuir `will-change: transform` aplicado cirurgicamente durante a animação e removido logo após o término para economizar VRAM.

### 2.2 Virtualização e Otimização de Imagens
- **Estratégia de Resolução em Cascata (Zero Broken Images)**:
  1. `Showdown Animated GIF` (resolução nativa ultra leve, alta expressividade).
  2. Fallback 1: `Official Artwork WebP/PNG` (alta fidelidade da PokéAPI).
  3. Fallback 2: `Pixel Sprite Clássico` (menos de 5KB).
  4. Fallback 3: Silhueta SVG vetorizada inline offline.
- **Carregamento Assíncrono e Lazy Loading**:
  - Todos os cards da grade da Pokédex devem utilizar `loading="lazy"` e `decoding="async"`.
  - A renderização da grade de 151 Pokémon deve reaproveitar `DocumentFragment` para injetar todos os nós de uma só vez, gerando apenas **1 único ciclo de repintura do DOM**.

### 2.3 Estruturas de Dados e Complexidade Algorítmica $O(1)$
- **Indexação em Memória**:
  - Evitar varreduras repetidas $O(N)$ em arrays com `filter()` ou `find()` durante buscas frequentes.
  - Construir no bootstrap do jogo índices em tabelas de dispersão (`Map` / Hash Tables):
    - `POKEMON_BY_ID = new Map()` ➔ Busca de Pokémon em $O(1)$.
    - `POKEMON_BY_HABITAT = new Map()` ➔ Sorteio de encontro sem recalcular filtros em $O(1)$.
    - `POKEMON_BY_TYPE = new Map()` ➔ Filtragem na Pokédex instantânea em $O(1)$.
- **Debounce de Entrada de Busca**:
  - O campo de pesquisa textual deve ter *debounce* de 200ms para evitar re-renderizações desnecessárias da Pokédex a cada tecla digitada.

---

## 3. Arquitetura de Áudio e Web Audio API de Alta Performance

### 3.1 Síntese Procedural em Tempo Real
- **Zero Latência de I/O**:
  - A geração sonora de 100% dos efeitos (fanfarras, tremores, arremesso e cliques) não consome banda de internet nem executa decodificação de áudio em runtime.
  - Criação de um `AudioContext` singleton reutilizável.
- **Prevenção de Estalos (Audio Popping)**:
  - Nunca alterar valores de ganho abruptamente (`gain.setValueAtTime(0)`).
  - Sempre aplicar rampas logarítmicas ou exponenciais suaves (`linearRampToValueAtTime` ou `exponentialRampToValueAtTime`) com tempos de relaxamento mínimos de 0.015s para evitar descontinuidade na onda acústica.
- **Gerenciamento de Recursos de Hardware**:
  - Desconectar nós de áudio (`disconnect()`) e finalizar osciladores (`stop()`) imediatamente após a reprodução para prevenir vazamentos de memória na thread de áudio do navegador.

---

## 4. Persistência de Dados e Tolerância a Falhas

### 4.1 Armazenamento Seguro em `localStorage`
- Todas as transações com `localStorage` devem ser envelopadas em blocos `try/catch` com tratamento para:
  - Modos de navegação anônima com cotas zeradas.
  - Corrupção de JSON através de esquemas com *fallback* automático para o estado padrão.
- **Esquema de Armazenamento Serializado**:
  - `pokeif_caught`: Array de IDs numéricos inteiros compactos (`[1, 4, 7, 25]`).
  - `pokeif_seen`: Array de IDs numéricos vistos.
  - `pokeif_inventory`: Objeto normalizado com chaves estritas.

### 4.2 Sanitização e Segurança (Zero XSS)
- O preenchimento de dados textuais dinâmicos provenientes de entradas do usuário ou URLs deve utilizar `textContent` em vez de `innerHTML`, bloqueando qualquer vetor de injeção de scripts.

---

## 5. Práticas de Engenharia para Futuras Expansões

### 5.1 Integração de Motores Avançados (WebGL / Canvas)
- Caso sejam implementadas mecânicas tridimensionais (como mira de arremesso em giroscópio ou física balística real):
  - Integrar **Three.js** ou **Babylon.js** encapsulado dentro de um canvas isolado sem interferir na UI de DOM declarativa.
  - Manter a lógica de negócios desacoplada da biblioteca de renderização para preservar portabilidade.

### 5.2 Testabilidade e Cobertura Automatizada
- Toda função pura (como `calculateCatchChance`, `getFilteredPokemon` ou conversões de índices) deve ser passível de testes unitários isolados executáveis via `node:test` ou `Vitest`.
