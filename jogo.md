# Especificação Técnica, Game Design e Requisitos (jogo.md)

Este documento descreve as diretrizes de Game Design, a fidelidade canônica ao universo Pokémon da 1ª Geração de Kanto, as formulações matemáticas das probabilidades de captura e a especificação formal e auditável dos **Requisitos de Domínio**, **Requisitos Funcionais** e **Requisitos Não Funcionais de Alto Desempenho**.

---

## 1. Visão Geral do Produto e Fidelidade Canônica

O projeto **Pokémon Kanto (151 Originais)** é um simulador web de exploração e captura Pokémon, unindo a ambientação nostálgica dos clássicos de Game Boy (*Pokémon Red, Blue & Yellow*) à interatividade tátil de mecânicas contemporâneas (*Pokémon Let's Go & Pokémon GO*).

### 1.1 Pilares de Fidelidade Canônica
1. **Catálogo Exato de 151 Espécies**: Representação estrita dos 151 monstrinhos de Kanto (#001 *Bulbasaur* ao #151 *Mew*), respeitando numeração da Pokédex regional, nomes oficiais, paletas e atributos base originais.
2. **Ecologia dos Habitats**: Distribuição territorial autêntica de cada espécie através de 6 habitats de Kanto:
   - *Rota 1 & 2 (Planície)*: Pidgey, Rattata, Spearow, Nidoran, Oddish, Bellsprout e iniciais.
   - *Floresta de Viridian*: Caterpie, Weedle, Butterfree, Beedrill, Scyther, Pinsir e o célebre Pikachu.
   - *Mt. Moon (Caverna)*: Geodude, Zubat, Onix, Clefairy, Paras e fósseis jurássicos.
   - *Rota 21 (Oceano)*: Squirtle, Poliwag, Tentacool, Magikarp, Gyarados, Lapras, Seel e Dratini.
   - *Usina Elétrica Abandonada*: Magnemite, Voltorb, Electabuzz, Grimer, Koffing e o lendário pássaro Zapdos.
   - *Caverna Cerulean (Lendários e Raros)*: Mewtwo, Mew, Articuno, Moltres, Dragonite, Alakazam, Gengar e Snorlax.
3. **Fórmula Canônica de Dificuldade**: Aplicação rigorosa dos índices de *Catch Rate* originais (variando entre o teto de 255 para os mais comuns e o piso de 3 para os lendários).

---

## 2. Requisitos de Domínio e Modelagem Matemática (RD)

### 2.1 [RD01] Fórmula Matemática de Probabilidade de Captura
A chance de captura instantânea por arremesso ($P$) é calculada deterministicamente através da equação equilibrada:

$$P = \min\left(0.98, \; \max\left(0.05, \; \frac{\text{CatchRate}}{255} \times 0.75 \times M_{\text{ball}} \times M_{\text{berry}} \times M_{\text{level}}\right)\right)$$

Onde:
- $\text{CatchRate} \in [3, 255]$: Taxa base canônica da espécie na 1ª Geração.
- $M_{\text{ball}}$: Multiplicador da Pokébola selecionada:
  - *Poké Ball*: $M_{\text{ball}} = 1.0$
  - *Great Ball*: $M_{\text{ball}} = 1.5$
  - *Ultra Ball*: $M_{\text{ball}} = 2.2$
  - *Master Ball*: $P = 1.00$ (Captura infalível garantida independentemente de outros fatores).
- $M_{\text{berry}}$: Multiplicador de Fruta:
  - *Sem fruta*: $M_{\text{berry}} = 1.0$
  - *Fruta Frambo (Razz Berry)*: $M_{\text{berry}} = 1.40$ (+40% de bônus cumulativo).
- $M_{\text{level}}$: Fator de penalidade por nível do Pokémon selvagem:
  $$M_{\text{level}} = \max\left(0.40, \; 1 - \frac{\text{Nível}}{120}\right)$$

### 2.2 [RD02] Algoritmo Determinístico de Tremores (Shakes / Wobbles)
Ao atingir o chão, a Pokébola executa uma sequência de até 3 tremores antes do veredito:
- Se a captura for bem-sucedida: ocorrem exatamente **3 tremores completos**, seguidos do travamento estático da bola e emissão de estrelas luminosas.
- Se a captura falhar: o sorteio computa o momento exato da fuga:
  - Falha Crítica ($\text{Roll} > 2 \times P$): quebra após **1 tremor**.
  - Falha Média ($\text{Roll} > 1.3 \times P$): quebra após **2 tremores**.
  - Falha Quase-Captura ($\text{Roll} \le 1.3 \times P$): quebra dramática no **3º tremor**.

### 2.3 [RD03] Dinâmica de Fuga do Pokémon Selvagem
Ao romper a Pokébola em uma tentativa mal-sucedida, a probabilidade de fuga ($F_{\text{flee}}$) é avaliada:
$$F_{\text{flee}} = \begin{cases} 0.00 & \text{se } \text{Fruta Ananás ativa} \\ \min\left(0.50, \; \max(0.10, \; \frac{100 - \text{CatchRate}}{300})\right) & \text{sem fruta acalmadora} \end{cases}$$

### 2.4 [RD04] Estados Canônicos de Registro na Pokédex
Cada uma das 151 espécies transita exclusivamente entre 3 estados de registro:
1. **Desconhecido (`???`)**: Espécie nunca visualizada. Exibida como silhueta opaca sem atributos ou dados.
2. **Apenas Visto**: Espécie encontrada na natureza em batalha, mas cuja captura ainda não foi concluída. Exibida em silhueta intermediária com nome e tipo revelados.
3. **Capturado**: Espécie registrada na coleção com dados completos, artes coloridas, histórico de capturas, habitat e gráficos de atributos base (HP, Ataque e Defesa).

### 2.5 [RD05] Sistema de Armazenamento em Boxes (PC do Bill)
Inspirado no sistema canônico de armazenamento dos jogos clássicos:
- **Capacidade e Organização**: Cada Box armazena exatamente **30 Pokémon** em compartimentos identificados (Box 1, Box 2, Box 3, etc.).
- **Identidade Individual de Instância**: Cada Pokémon capturado é uma instância única persistida com identificador exclusivo (`uid`), nível sorteado no encontro selvagem, Pokébola exata utilizada, atributos escalados e data/hora registrada.
- **Personalização de Apelido (Nickname)**: O treinador tem a liberdade de atribuir apelidos aos seus Pokémon guardados.
- **Liberação Ecológica (Release)**: O jogador pode soltar Pokémon repetidos de volta à natureza, recebendo como gratificação ecológica **+1 Fruta Frambo** e **+₽ 150**, enquanto o registro canônico da espécie permanece preservado na Pokédex.

### 2.6 [RD06] Economia de Kanto & Poké Dollars (₽)
Fiel ao sistema econômico dos jogos originais da Game Freak:
- **Moeda Canônica (Poké Dollar - ₽)**: Moeda oficial utilizada em todas as transações mercantis da Liga Kanto.
- **Saldo Inicial do Treinador**: Todo novo treinador inicia sua jornada com uma bolsa de **₽ 2.500** de boas-vindas.
- **Remuneração por Mérito de Captura**: Cada captura bem-sucedida premia o treinador com Poké Dollars escalados pelo nível do Pokémon e por sua raridade:
  $$\text{Recompensa} = 120 + (\text{Nível} \times 10) + \lfloor(255 - \text{CatchRate}) \times 0.8\rfloor$$
- **Preço de Revenda Oficial**: Itens da bolsa podem ser revendidos no balcão pelo valor de mercado canônico de **50% do preço de compra**.

---

## 3. Requisitos Funcionais Detalhados (RF)

### 3.1 Exploração e Habitats de Kanto
- **[RF01] Seletor de Habitats e Cenários Autênticos dos Jogos**: Interface com alternância instantânea entre os 6 habitats clássicos de Kanto (Rota 1, Floresta Viridian, Mt. Moon, Rota 21 Oceânica, Usina Elétrica e Caverna Cerulean), atualizando o ecossistema visual da arena com camadas dinâmicas de céu animado com nuvens, linha de horizonte, terreno em perspectiva e partículas ambientais exclusivas.
- **[RF01.1] Pedestais de Batalha em Perspectiva 3D (Battle Bases)**: Plataforma elíptica tridimensional onde o monstrinho selvagem se posiciona no palco de batalha, adaptada ao bioma atual (grama alta com borda de terra 3D para rotas, terra batida com musgo para Viridian, bloco de rocha com cristais para Mt. Moon, vórtice de ondas e espuma para água, placa metálica com neon para Usina, e altar místico levitante com runas para Caverna Cerulean).
- **[RF02] Radar de Busca de Pokémon**: Botão de busca e atalho de teclado que ativa o efeito de radar sonoro e visual na grama alta com tempo de resposta de 900ms para geração do encontro.
- **[RF03] Sorteio Baseado em Bioma**: O sorteio deve priorizar em 85% as espécies nativas do bioma selecionado e em 15% espécies errantes comuns para enriquecer a variedade da exploração.
- **[RF04] HUD Dinâmica do Pokémon Encontrado**: Exibir instantaneamente o nome, nível sorteado, badges de tipos com cores oficiais e indicador caso o monstrinho já tenha sido capturado anteriormente.

### 3.2 Mecânica de Captura e Inventário
- **[RF05] Indicador em Tempo Real da Chance de Captura**: Medidor visual dinâmico com barra graduada (Baixa em vermelho, Média em laranja e Alta em verde) e valor percentual estimado, recalculado a cada troca de Pokébola ou uso de fruta.
- **[RF06] Gestão de Pokébolas**: Exibir estoques das 4 classes de Pokébolas e permitir a seleção com feedback sonoro de clique e realce neon na interface.
- **[RF07] Uso Tático de Frutas**: Permitir a alimentação com Fruta Frambo (+40% de chance) ou Fruta Ananás (bloqueio total de fuga), impedindo o consumo de fruta repetida na mesma rodada.
- **[RF08] Animação de Arremesso Balístico**: Executar trajetória de voo da bola, colisão, feixe de energia vermelha de absorção e posicionamento da bola no pedestal da arena.
- **[RF09] Sequência de Suspense Sonoro e Visual**: Reprodução sincronizada dos tremores sonoros e rotações laterais da Pokébola com intervalos de 750ms entre cada tremor.
- **[RF10] Celebração Gotcha!**: Ao capturar, acionar a fanfarra clássica, conceder bonificação automática (+3 Pokébolas e +1 Fruta), atualizar o progresso da Pokédex e exibir o modal comemorativo.
- **[RF11] Quebra da Bola e Fuga**: Ao falhar, exibir animação de quebra da bola com fumaça e retorno do sprite; se o Pokémon fugir, notificar o usuário e redefinir a arena para o modo de exploração.
- **[RF12] Retirada Tática (Fugir)**: Botão de retirada que permite ao jogador abandonar o encontro a qualquer momento em segurança.
- **[RF13] Suprimentos Infinitos do Professor Carvalho**: Botão de socorro que concede imediatamente 15 Pokébolas, 5 Greatbolas e 3 Frutas com feedback auditivo e toast informativo.

### 3.3 Pokédex Regional (151 Entradas)
- **[RF14] Resumo de Progresso e Métricas**: Exibir contadores de vistos, capturados e barra de progresso percentual (0.0% a 100.0%) visíveis no cabeçalho e na tela da Pokédex.
- **[RF15] Grade Completa dos 151 Pokémon**: Renderização otimizada de 151 cartões com número `#XXX`, arte oficial, nome e badges de tipos.
- **[RF16] Busca Textual Instantânea**: Filtragem rápida ao digitar nome ou número com *debounce* de 200ms.
- **[RF17] Filtragem por Tipos Elementais**: Dropdown para isolar espécies por qualquer um dos 17 tipos elementais oficiais.
- **[RF18] Filtragem por Status de Coleção**: Botões de alternância rápida entre "Todos", "Capturados" e "Não Obtidos".
- **[RF19] Modal Detalhado de Espécie**: Exibir arte em alta resolução, sprite animado (*showdown*), tipos, descrição canônica, habitat nativo e barras comparativas de atributos base (HP, Ataque e Defesa).

### 3.4 Sistema de Armazenamento Pokémon (PC do Bill / Boxes)
- **[RF20] Aba Dedicada do PC**: Interface autônoma para navegação nas caixas de armazenamento com contador do total de Pokémon guardados no cabeçalho.
- **[RF21] Vagas por Box**: Seletor de caixas (Box 1, Box 2, Box 3, Box 4 e visualização unificada "Todas as Boxes") com limite operacional de 30 monstrinhos por caixa.
- **[RF22] Cartões de Espécime Individual**: Cada cartão no PC deve exibir o nível sorteado, o ícone da Pokébola usada na captura, apelido em destaque, espécie original (#ID) e mini badges dos tipos elementais.
- **[RF23] Ordenação e Filtros no PC**: Dropdown para ordenar os Pokémon guardados por "Mais Recentes", "Maior Nível", "Nº Pokédex" e "Nome (A-Z)", além de campo de busca instantânea por apelido ou espécie.
- **[RF24] Modal de Inspeção e Gestão**: Painel detalhado permitindo inspecionar data/hora da captura, atributos individuais calculados (HP, Ataque, Defesa) e executar ações de gestão.
- **[RF25] Renomear e Soltar na Natureza**: Ações interativas para alterar o apelido do Pokémon e soltá-lo com diálogo de confirmação e bonificação imediata de +1 Fruta Frambo.

### 3.5 Feedback Sensorial e Atalhos
- **[RF26] Sintetizador de Áudio Nativo**: Efeitos sonoros para clique, arremesso, impacto, tremores, fanfarra triunfante e alertas de fuga.
- **[RF27] Controle de Mudo**: Botão com alternância instantânea entre áudio ativo e mudo.
- **[RF28] Atalhos de Teclado**: Tecla <kbd>Espaço</kbd> configurada para buscar na grama ou arremessar a bola, e tecla <kbd>Esc</kbd> para fechar modais instantaneamente.

### 3.6 Navegação Lateral (Sidebar)
- **[RF29] Sidebar Lateral de Funções**: Barra lateral permanente no desktop e com gaveta deslizante (*drawer*) no mobile, integrando o card do treinador, navegação com badges de contadores, widget de progresso percentual e atalhos rápidos para suprimentos e som.

### 3.7 Sistema de Comércio (Poké Mart)
- **[RF30] Balcão de Compras (Buy Tab)**: Interface do atendente clássico exibindo catálogo completo com Poké Ball (₽200), Great Ball (₽600), Ultra Ball (₽1.200), Master Ball (₽8.000), Fruta Frambo (₽300) e Fruta Ananás (₽450).
- **[RF31] Seletor Preciso de Quantidade**: Controles de quantidade por botões de passo unitário (-/+), atalhos de compra em lote (*x5* e *x10*) e campo numérico livre (1 a 99) com recálculo instantâneo do subtotal.
- **[RF32] Balcão de Revenda (Sell Tab)**: Alternância para o modo "Vender da Bolsa" permitindo descarregar excessos de inventário pelo preço oficial de revenda (50% do valor de compra) com validação de estoque real e créditos imediatos na carteira do treinador.

### 3.8 Sincronização em Nuvem (Google Firebase)
- **[RF33] Identificador de Treinador em Nuvem**: Geração e persistência de ID exclusivo (`ASH-XXXXXX`) para associar o documento do Firestore ao perfil do jogador.
- **[RF34] Backup e Restauração em 1 Clique**: Ações de salvamento atômico e restauração completa dos 5 domínios do jogo (Pokédex, Box PC, Saldo em Poké Dollars e Inventário de Pokébolas e Frutas).
- **[RF35] Painel de Conexão com Firebase Console**: Modal de configuração que permite ao jogador ou desenvolvedor inserir e salvar credenciais do Firebase (`apiKey`, `projectId`, `authDomain`, `appId`), com persistência local e fallback automático offline (*Offline-First*).

### 3.9 Sistema de Autenticação e Perfil de Treinador (Login & Cadastro)
- **[RF36] Login com Email e Senha (Firebase Auth)**: Autenticação segura integrada ao Firebase Authentication, com suporte a recuperação de credenciais e modo de sessão local quando offline.
- **[RF37] Cadastro de Treinador e Seleção de Avatar**: Criação de conta personalizada com escolha de nome e avatar oficial (🧢 Ash, 🔴 Red, 💧 Misty, ⚡ Blue ou 🕶️ Gary), refletindo imediatamente no card do treinador na Sidebar.
- **[RF38] Sessão de Convidado (Guest Mode)**: Permite ao jogador iniciar a jornada instantaneamente sem necessidade de fornecer email ou senha, salvando todo o progresso no navegador.
- **[RF39] Gestão de Conta e Logout**: Painel de perfil para visualização do email conectado, alteração rápida de avatar e encerramento de sessão com confirmação.

---

## 4. Requisitos Não Funcionais de Alto Desempenho (RNF)

- **[RNF01] Orçamento de Frames (Frame Budget a 60-120 FPS)**:
  - Todas as animações visuais devem rodar em regime estável de **60 a 120 FPS** sem quedas de quadros perceptíveis (*jank*).
  - Mutação restrita às propriedades `transform` e `opacity`, sem acionar recálculos de layout (*layout reflows*).
- **[RNF02] Métricas de Desempenho Core Web Vitals**:
  - **First Contentful Paint (FCP)**: $< 0.8\text{ segundos}$ em conexões 4G simuladas.
  - **Largest Contentful Paint (LCP)**: $< 1.2\text{ segundos}$.
  - **Cumulative Layout Shift (CLS)**: $= 0$ (layout estritamente estável sem saltos visuais).
  - **Interaction to Next Paint (INP)**: $< 50\text{ milissegundos}$ para todas as interações de clique e teclado.
- **[RNF03] Consumo de Memória (Memory Footprint)**:
  - O consumo de heap de JavaScript deve se manter abaixo de **45 MB** durante toda a sessão de jogo, com liberação atômica de nós de áudio e listeners órfãos.
- **[RNF04] Arquitetura de Áudio com Latência Zero**:
  - A reprodução dos efeitos sonoros deve iniciar em menos de **10ms** após o clique do usuário via `AudioContext` pré-inicializado, eliminando tempos de download e requisições HTTP para áudios.
- **[RNF05] Resiliência de Mídia (Triplo Fallback de Imagens)**:
  - Mecanismo automático de resolução de imagem: `Showdown GIF` ➔ `Official Artwork` ➔ `Pixel Sprite Clássico` para blindar o jogo contra indisponibilidade de servidores externos.
- **[RNF06] Persistência Atômica no `localStorage`**:
  - Leitura e gravação serializada segura com tratamento de exceções para navegação privada e garantia de restauração integral da Pokédex após recarregar a página.
- **[RNF07] Responsividade Adaptativa**:
  - Layout totalmente responsivo com design fluido que se ajusta de telas de smartphones (a partir de 320px) até monitores ultrawide (4K).
- **[RNF08] Acessibilidade Semântica**:
  - Elementos de formulário e botões com foco navegável por teclado, tags semânticas HTML5 e rotulagem clara para leitores de tela.
- **[RNF09] Blindagem contra Vulnerabilidades (XSS Prevention)**:
  - Atribuição de textos dinâmicos realizada prioritariamente por `textContent` para bloquear injeções maliciosas.
- **[RNF10] Compatibilidade Cross-Browser**:
  - Funcionamento idêntico e consistente em Google Chrome, Microsoft Edge, Mozilla Firefox, Opera e Safari.

---

## 5. Tabela de Balanceamento e Economia do Treinador

| Faixa de Raridade | Espécies Representativas | Catch Rate | Nível | Chance Poké Ball | Chance Great Ball | Chance Ultra + Frambo |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Básicos Comuns** | Pidgey, Rattata, Caterpie, Weedle | 255 | 3 - 10 | **72% - 75%** | **95% - 98%** | **98% (Cap)** |
| **Comuns Intermediários** | Zubat, Geodude, Poliwag, Oddish | 190 - 255 | 8 - 20 | **55% - 68%** | **80% - 92%** | **95% - 98%** |
| **Raros de Habitat** | Pikachu, Growlithe, Machop, Abra | 180 - 200 | 12 - 25 | **48% - 55%** | **70% - 78%** | **90% - 96%** |
| **Iniciais de Kanto** | Bulbasaur, Charmander, Squirtle | 45 | 5 - 15 | **12% - 14%** | **18% - 22%** | **38% - 46%** |
| **Fósseis & Especiais** | Snorlax, Lapras, Chansey, Dratini | 25 - 45 | 25 - 40 | **6% - 11%** | **10% - 17%** | **22% - 35%** |
| **Evoluções Finais** | Charizard, Gengar, Dragonite | 45 | 45 - 60 | **7% - 9%** | **11% - 14%** | **24% - 30%** |
| **Lendários de Kanto** | Articuno, Zapdos, Moltres, Mewtwo | 3 | 50 - 70 | **0.8% - 1.2%** | **1.3% - 1.8%** | **3.0% - 4.5%** *(100% com Master Ball)* |

### Sustentabilidade da Economia
1. **Estoque Inicial**: 25 Poké Balls, 12 Great Balls, 5 Ultra Balls, 1 Master Ball, 8 Frutas Frambo e 8 Frutas Ananás.
2. **Taxa de Retorno por Captura**: Cada monstrinho capturado gera automaticamente **+3 Pokébolas** e **+1 Fruta**, recompensando a precisão do jogador.
3. **Rede de Segurança**: O botão de suprimentos do Professor Carvalho fornece suprimentos ilimitados para garantir que nenhum jogador fique incapaz de continuar sua jornada.
