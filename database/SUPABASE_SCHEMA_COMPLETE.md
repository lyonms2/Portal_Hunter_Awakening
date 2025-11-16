# ESQUEMA COMPLETO DO BANCO SUPABASE - Portal Hunter Awakening

**Data de Análise:** 2025-11-15
**Versão do Jogo:** v1.0 (PVP IA)

---

## 📊 VISÃO GERAL DO BANCO DE DADOS

**Total de Tabelas:** 15 tabelas + 3 views
**SGBD:** PostgreSQL (via Supabase)
**Autenticação:** Supabase Auth (auth.users)

---

## 🗂️ ESTRUTURA DE TABELAS

### 1️⃣ TABELA: `avatares`
**Descrição:** Armazena todos os avatares invocados pelos jogadores
**Primary Key:** `id` (UUID)
**Foreign Keys:** `user_id` → auth.users

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | ID único do avatar |
| `user_id` | uuid | YES | null | Dono do avatar |
| `nome` | varchar(100) | NO | null | Nome do avatar |
| `descricao` | text | YES | null | Lore/história do avatar |
| `elemento` | varchar(50) | YES | null | Elemento (Fogo, Água, Terra, Vento, Eletricidade, Sombra, Luz) |
| `raridade` | varchar(20) | YES | null | Raridade (Comum, Raro, Lendário) |
| `nivel` | integer | YES | 1 | Nível atual (1-100) |
| `experiencia` | integer | YES | 0 | XP acumulada |
| `vinculo` | integer | YES | 0 | Nível de vínculo (0-100) |
| `forca` | integer | YES | null | Atributo Força |
| `agilidade` | integer | YES | null | Atributo Agilidade |
| `resistencia` | integer | YES | null | Atributo Resistência |
| `foco` | integer | YES | null | Atributo Foco |
| `habilidades` | jsonb | YES | '[]'::jsonb | Array de habilidades |
| `vivo` | boolean | YES | true | Se está vivo ou morto |
| `fragmento_herdado` | jsonb | YES | null | Fragmento do avatar morto |
| `ativo` | boolean | YES | false | Se é o avatar ativo do jogador |
| `marca_morte` | boolean | YES | false | Marca de morte (ressurreição) |
| `exaustao` | integer | YES | 0 | Nível de exaustão (0-100) |
| `hp_atual` | integer | YES | null | HP atual do avatar |
| `created_at` | timestamp | YES | now() | Data de criação |
| `updated_at` | timestamp | YES | now() | Data de atualização |

**Índices Recomendados:**
- `idx_avatares_user_id` ON (user_id)
- `idx_avatares_vivo` ON (vivo)
- `idx_avatares_ativo` ON (user_id, ativo) WHERE ativo = true
- `idx_avatares_raridade` ON (raridade)

---

### 2️⃣ TABELA: `player_stats`
**Descrição:** Estatísticas e recursos dos jogadores
**Primary Key:** `id` (UUID)
**Foreign Keys:** `user_id` → auth.users (UNIQUE)

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | ID único |
| `user_id` | uuid | YES | null | ID do jogador (UNIQUE) |
| `moedas` | integer | YES | 500 | Moedas do jogador |
| `fragmentos` | integer | YES | 0 | Fragmentos acumulados |
| `divida` | integer | YES | 0 | Dívida com o Necromante |
| `ranking` | varchar(10) | YES | 'F' | Ranking (não usado no PVP IA) |
| `missoes_completadas` | integer | YES | 0 | Total de missões completadas |
| `primeira_invocacao` | boolean | YES | true | Se ainda tem invocação grátis |
| `nome_operacao` | text | YES | null | Nome do jogador |
| `created_at` | timestamp | YES | now() | Data de criação |
| `updated_at` | timestamp | YES | now() | Data de atualização |

**Constraints:**
- UNIQUE (user_id)

**Índices Recomendados:**
- `idx_player_stats_user_id` ON (user_id) - UNIQUE

---

### 3️⃣ TABELA: `items`
**Descrição:** Catálogo de itens disponíveis no jogo
**Primary Key:** `id` (UUID)

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | ID único do item |
| `nome` | varchar(100) | NO | null | Nome do item |
| `descricao` | text | YES | null | Descrição do item |
| `tipo` | varchar(50) | NO | null | Tipo (Consumível, Equipamento, etc.) |
| `efeito` | varchar(50) | YES | null | Efeito do item |
| `valor_efeito` | integer | YES | null | Valor numérico do efeito |
| `preco_compra` | integer | NO | 0 | Preço de compra |
| `preco_venda` | integer | NO | 0 | Preço de venda |
| `raridade` | varchar(20) | YES | 'Comum' | Raridade do item |
| `icone` | varchar(10) | YES | '📦' | Emoji/ícone do item |
| `empilhavel` | boolean | YES | true | Se pode empilhar |
| `max_pilha` | integer | YES | 99 | Máximo de itens na pilha |
| `requer_avatar_ativo` | boolean | YES | false | Se requer avatar ativo |
| `created_at` | timestamp with time zone | YES | now() | Data de criação |

**Índices Recomendados:**
- `idx_items_tipo` ON (tipo)
- `idx_items_raridade` ON (raridade)

---

### 4️⃣ TABELA: `player_inventory`
**Descrição:** Inventário dos jogadores
**Primary Key:** `id` (UUID)
**Foreign Keys:** `user_id` → auth.users, `item_id` → items

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | ID único |
| `user_id` | uuid | NO | null | ID do jogador |
| `item_id` | uuid | NO | null | ID do item |
| `quantidade` | integer | NO | 1 | Quantidade do item |
| `created_at` | timestamp with time zone | YES | now() | Data de criação |
| `updated_at` | timestamp with time zone | YES | now() | Data de atualização |

**Constraints:**
- UNIQUE (user_id, item_id)

**Índices Recomendados:**
- `idx_player_inventory_user_id` ON (user_id)
- `idx_player_inventory_item_id` ON (item_id)

---

### 5️⃣ TABELA: `invocacoes_historico`
**Descrição:** Histórico de invocações de avatares
**Primary Key:** `id` (UUID)
**Foreign Keys:** `user_id` → auth.users, `avatar_id` → avatares

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | ID único |
| `user_id` | uuid | YES | null | ID do jogador |
| `avatar_id` | uuid | YES | null | ID do avatar invocado |
| `custo_moedas` | integer | YES | 0 | Custo em moedas |
| `custo_fragmentos` | integer | YES | 0 | Custo em fragmentos |
| `gratuita` | boolean | YES | false | Se foi invocação grátis |
| `raridade` | text | YES | null | Raridade obtida |
| `elemento` | text | YES | null | Elemento obtido |
| `created_at` | timestamp | YES | now() | Data da invocação |

**Índices Recomendados:**
- `idx_invocacoes_user_id` ON (user_id)
- `idx_invocacoes_created_at` ON (created_at DESC)

---

## 🏆 TABELAS PVP - SISTEMA DE TEMPORADAS

### 6️⃣ TABELA: `pvp_temporadas`
**Descrição:** Gerenciamento de temporadas PVP
**Primary Key:** `id` (serial)
**Unique:** `temporada_id`

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | integer | NO | nextval() | ID sequencial |
| `temporada_id` | varchar(7) | NO | null | ID da temporada (YYYY-MM) |
| `nome` | varchar(100) | NO | null | Nome da temporada |
| `data_inicio` | timestamp | NO | null | Data de início |
| `data_fim` | timestamp | NO | null | Data de fim (30 dias) |
| `ativa` | boolean | YES | true | Se está ativa |
| `created_at` | timestamp | YES | now() | Data de criação |

**Constraints:**
- UNIQUE (temporada_id)

**Exemplo de dados:**
```sql
temporada_id: '2025-11'
nome: 'Temporada de Novembro 2025'
data_inicio: '2025-11-01 00:00:00'
data_fim: '2025-12-01 00:00:00'
ativa: true
```

---

### 7️⃣ TABELA: `pvp_rankings`
**Descrição:** Rankings atuais da temporada em andamento
**Primary Key:** `id` (serial)
**Foreign Keys:** `temporada_id` → pvp_temporadas

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | integer | NO | nextval() | ID sequencial |
| `user_id` | uuid | NO | null | ID do jogador |
| `temporada_id` | varchar(7) | NO | null | ID da temporada |
| `fama` | integer | NO | 1000 | Pontos de fama (ELO) |
| `vitorias` | integer | NO | 0 | Vitórias na temporada |
| `derrotas` | integer | NO | 0 | Derrotas na temporada |
| `streak` | integer | NO | 0 | Sequência de vitórias atual |
| `streak_maximo` | integer | NO | 0 | Maior sequência de vitórias |
| `ultima_batalha` | timestamp | YES | null | Data da última batalha |
| `recompensas_recebidas` | boolean | YES | false | Se já recebeu recompensas |
| `created_at` | timestamp | YES | now() | Data de criação |
| `updated_at` | timestamp | YES | now() | Data de atualização |

**Constraints:**
- UNIQUE (user_id, temporada_id)

**Índices Recomendados:**
- `idx_pvp_rankings_temporada_fama` ON (temporada_id, fama DESC)
- `idx_pvp_rankings_user_id` ON (user_id)

---

### 8️⃣ TABELA: `pvp_historico_temporadas`
**Descrição:** Histórico de temporadas passadas
**Primary Key:** `id` (serial)
**Foreign Keys:** `temporada_id` → pvp_temporadas

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | integer | NO | nextval() | ID sequencial |
| `user_id` | uuid | NO | null | ID do jogador |
| `temporada_id` | varchar(7) | NO | null | ID da temporada |
| `fama_final` | integer | NO | null | Fama final da temporada |
| `vitorias` | integer | NO | null | Total de vitórias |
| `derrotas` | integer | NO | null | Total de derrotas |
| `streak_maximo` | integer | NO | 0 | Maior sequência de vitórias |
| `posicao_final` | integer | YES | null | Posição final no ranking |
| `tier_final` | varchar(20) | YES | null | Tier final (Bronze, Prata, etc.) |
| `recompensas_recebidas` | boolean | YES | false | Se recebeu recompensas |
| `recompensas_json` | jsonb | YES | null | Detalhes das recompensas |
| `data_encerramento` | timestamp | NO | null | Data de encerramento |
| `created_at` | timestamp | YES | now() | Data de criação |

**Constraints:**
- UNIQUE (user_id, temporada_id)

---

### 9️⃣ TABELA: `pvp_batalhas_log`
**Descrição:** Log de todas as batalhas PVP realizadas
**Primary Key:** `id` (serial)
**Foreign Keys:** `temporada_id` → pvp_temporadas

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | integer | NO | nextval() | ID sequencial |
| `temporada_id` | varchar(7) | NO | null | ID da temporada |
| `jogador1_id` | uuid | NO | null | ID do jogador 1 (humano) |
| `jogador2_id` | uuid | NO | null | ID do jogador 2 (IA) |
| `jogador1_fama_antes` | integer | NO | null | Fama antes da batalha (J1) |
| `jogador2_fama_antes` | integer | NO | null | Fama antes da batalha (J2) |
| `jogador1_streak_antes` | integer | NO | 0 | Streak antes da batalha (J1) |
| `jogador2_streak_antes` | integer | NO | 0 | Streak antes da batalha (J2) |
| `vencedor_id` | uuid | YES | null | ID do vencedor |
| `duracao_rodadas` | integer | NO | null | Número de rodadas |
| `jogador1_fama_ganho` | integer | NO | null | Fama ganha/perdida (J1) |
| `jogador2_fama_ganho` | integer | NO | null | Fama ganha/perdida (J2) |
| `jogador1_recompensas` | jsonb | YES | null | Recompensas do J1 |
| `jogador2_recompensas` | jsonb | YES | null | Recompensas do J2 |
| `foi_upset` | boolean | YES | false | Se foi upset (underdog ganhou) |
| `diferenca_fama` | integer | YES | null | Diferença de fama |
| `data_batalha` | timestamp | YES | now() | Data da batalha |

**Índices Recomendados:**
- `idx_pvp_batalhas_temporada` ON (temporada_id)
- `idx_pvp_batalhas_jogador1` ON (jogador1_id)
- `idx_pvp_batalhas_data` ON (data_batalha DESC)

---

### 🔟 TABELA: `pvp_titulos`
**Descrição:** Títulos conquistados pelos jogadores
**Primary Key:** `id` (serial)
**Foreign Keys:** `temporada_id` → pvp_temporadas

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | integer | NO | nextval() | ID sequencial |
| `user_id` | uuid | NO | null | ID do jogador |
| `titulo_id` | varchar(50) | NO | null | ID do título |
| `titulo_nome` | varchar(100) | NO | null | Nome do título |
| `titulo_icone` | varchar(10) | YES | null | Ícone do título |
| `temporada_id` | varchar(7) | NO | null | Temporada da conquista |
| `posicao_conquistada` | integer | NO | null | Posição conquistada |
| `ativo` | boolean | YES | true | Se está equipado |
| `data_conquista` | timestamp | YES | now() | Data da conquista |

**Constraints:**
- UNIQUE (user_id, titulo_id)

**Tipos de Títulos:**
- `campeao_YYYY-MM` - 1º Lugar (👑 Campeão)
- `vice_campeao_YYYY-MM` - 2º Lugar (🥈 Vice-Campeão)
- `terceiro_lugar_YYYY-MM` - 3º Lugar (🥉 3º Lugar)
- `elite_top10_YYYY-MM` - 4º-10º (⭐ Elite Top 10)

---

### 1️⃣1️⃣ TABELA: `pvp_recompensas_pendentes`
**Descrição:** Recompensas de fim de temporada a serem coletadas
**Primary Key:** `id` (serial)
**Foreign Keys:** `temporada_id` → pvp_temporadas

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | integer | NO | nextval() | ID sequencial |
| `user_id` | uuid | NO | null | ID do jogador |
| `temporada_id` | varchar(7) | NO | null | ID da temporada |
| `moedas` | integer | NO | 0 | Moedas a receber |
| `fragmentos` | integer | NO | 0 | Fragmentos a receber |
| `avatar_lendario` | boolean | YES | false | Se ganha avatar lendário |
| `avatar_raro` | boolean | YES | false | Se ganha avatar raro |
| `titulo_id` | varchar(50) | YES | null | ID do título conquistado |
| `coletada` | boolean | YES | false | Se foi coletada |
| `data_coleta` | timestamp | YES | null | Data da coleta |
| `created_at` | timestamp | YES | now() | Data de criação |

**Constraints:**
- UNIQUE (user_id, temporada_id)

**Exemplo de Recompensas por Posição:**
| Posição | Moedas | Fragmentos | Avatar | Título |
|---------|--------|------------|--------|--------|
| 1º | 5000 | 50 | Lendário | Campeão 👑 |
| 2º-3º | 3000 | 30 | Raro | Vice/3º 🥈🥉 |
| 4º-10º | 1500 | 20 | - | Elite Top 10 ⭐ |
| 11º-50º | 800 | 10 | - | - |
| 51º-100º | 400 | 5 | - | - |

---

## 🎮 TABELAS PVP REAL-TIME (Legadas - Não Usadas Atualmente)

### 1️⃣2️⃣ TABELA: `pvp_available_players`
**Descrição:** Players disponíveis para matchmaking (não usado no PVP IA)
**Status:** LEGADO - Sistema de PVP real-time removido

### 1️⃣3️⃣ TABELA: `pvp_battle_rooms`
**Descrição:** Salas de batalha PVP real-time (não usado no PVP IA)
**Status:** LEGADO - Sistema de PVP real-time removido

### 1️⃣4️⃣ TABELA: `pvp_challenges`
**Descrição:** Desafios PVP entre jogadores (não usado no PVP IA)
**Status:** LEGADO - Sistema de PVP real-time removido

### 1️⃣5️⃣ TABELA: `pvp_matchmaking_queue`
**Descrição:** Fila de matchmaking (não usado no PVP IA)
**Status:** LEGADO - Sistema de PVP real-time removido

**⚠️ NOTA:** Essas tabelas foram mantidas para compatibilidade mas NÃO são usadas no sistema atual de PVP IA. Podem ser removidas ou mantidas para futuras implementações de PVP real-time.

---

## 📊 VIEWS DO BANCO DE DADOS

### VIEW: `estatisticas_jogador`
**Descrição:** Estatísticas agregadas dos jogadores

**Colunas:**
- `user_id` - UUID do jogador
- `nome` - Nome do jogador
- `fama_atual` - Fama na temporada atual
- `vitorias_temporada_atual` - Vitórias na temporada atual
- `derrotas_temporada_atual` - Derrotas na temporada atual
- `streak_atual` - Streak atual
- `vitorias_total` - Total de vitórias (todas as temporadas)
- `derrotas_total` - Total de derrotas (todas as temporadas)
- `melhor_fama` - Maior fama já atingida
- `melhor_streak` - Maior streak já alcançada
- `melhor_posicao` - Melhor posição já conquistada
- `temporadas_jogadas` - Número de temporadas participadas
- `total_titulos` - Total de títulos conquistados

**Query SQL:**
```sql
CREATE VIEW estatisticas_jogador AS
SELECT
  ps.user_id,
  ps.nome_operacao as nome,
  pr.fama as fama_atual,
  pr.vitorias as vitorias_temporada_atual,
  pr.derrotas as derrotas_temporada_atual,
  pr.streak as streak_atual,
  SUM(pht.vitorias) as vitorias_total,
  SUM(pht.derrotas) as derrotas_total,
  MAX(pht.fama_final) as melhor_fama,
  MAX(pht.streak_maximo) as melhor_streak,
  MIN(pht.posicao_final) as melhor_posicao,
  COUNT(DISTINCT pht.temporada_id) as temporadas_jogadas,
  COUNT(DISTINCT pt.id) as total_titulos
FROM player_stats ps
LEFT JOIN pvp_rankings pr ON ps.user_id = pr.user_id
LEFT JOIN pvp_historico_temporadas pht ON ps.user_id = pht.user_id
LEFT JOIN pvp_titulos pt ON ps.user_id = pt.user_id
GROUP BY ps.user_id, ps.nome_operacao, pr.fama, pr.vitorias, pr.derrotas, pr.streak;
```

---

### VIEW: `leaderboard_atual`
**Descrição:** Leaderboard completo com posições calculadas

**Colunas:**
- `posicao` - Posição no ranking (ROW_NUMBER)
- `user_id` - UUID do jogador
- `nome_usuario` - Nome do jogador
- `fama` - Pontos de fama
- `vitorias` - Vitórias
- `derrotas` - Derrotas
- `streak` - Streak atual
- `streak_maximo` - Maior streak
- `win_rate` - Taxa de vitória (%)
- `temporada_id` - ID da temporada
- `temporada_nome` - Nome da temporada
- `ultima_batalha` - Data da última batalha

**Query SQL:**
```sql
CREATE VIEW leaderboard_atual AS
SELECT
  ROW_NUMBER() OVER (ORDER BY pr.fama DESC, pr.vitorias DESC) as posicao,
  pr.user_id,
  ps.nome_operacao as nome_usuario,
  pr.fama,
  pr.vitorias,
  pr.derrotas,
  pr.streak,
  pr.streak_maximo,
  CASE
    WHEN (pr.vitorias + pr.derrotas) > 0
    THEN ROUND((pr.vitorias::numeric / (pr.vitorias + pr.derrotas)) * 100, 2)
    ELSE 0
  END as win_rate,
  t.temporada_id,
  t.nome as temporada_nome,
  pr.ultima_batalha
FROM pvp_rankings pr
JOIN player_stats ps ON pr.user_id = ps.user_id
JOIN pvp_temporadas t ON pr.temporada_id = t.temporada_id
WHERE t.ativa = true
ORDER BY posicao;
```

---

### VIEW: `top_100_atual`
**Descrição:** Top 100 jogadores (para distribuição de recompensas)

**Colunas:** Mesmas do `leaderboard_atual`

**Query SQL:**
```sql
CREATE VIEW top_100_atual AS
SELECT * FROM leaderboard_atual
WHERE posicao <= 100
ORDER BY posicao;
```

---

## 🔗 RELACIONAMENTOS ENTRE TABELAS

```
auth.users (Supabase Auth)
    ↓
    ├─── player_stats (1:1)
    │       └── user_id FK
    │
    ├─── avatares (1:N)
    │       └── user_id FK
    │
    ├─── player_inventory (1:N)
    │       ├── user_id FK
    │       └── item_id FK → items
    │
    ├─── invocacoes_historico (1:N)
    │       ├── user_id FK
    │       └── avatar_id FK → avatares
    │
    ├─── pvp_rankings (1:N)
    │       ├── user_id FK
    │       └── temporada_id FK → pvp_temporadas
    │
    ├─── pvp_historico_temporadas (1:N)
    │       ├── user_id FK
    │       └── temporada_id FK → pvp_temporadas
    │
    ├─── pvp_titulos (1:N)
    │       ├── user_id FK
    │       └── temporada_id FK → pvp_temporadas
    │
    └─── pvp_recompensas_pendentes (1:N)
            ├── user_id FK
            └── temporada_id FK → pvp_temporadas
```

---

## 📈 SISTEMA DE FAMA (ELO)

**Fama Inicial:** 1000 pontos (todos os jogadores começam aqui)

**Tiers de Ranking:**
| Tier | Fama Mínima | Fama Máxima | Multiplicador de Recompensas |
|------|-------------|-------------|------------------------------|
| Bronze | 0 | 999 | 1x |
| Prata | 1000 | 1999 | 1.2x |
| Ouro | 2000 | 2999 | 1.5x |
| Platina | 3000 | 3999 | 2x |
| Diamante | 4000 | 4999 | 2.5x |
| Lendário | 5000+ | ∞ | 3x |

**Cálculo de Ganho/Perda de Fama:**
```
Base:
- Vitória: +20 fama
- Derrota: -15 fama

Bônus de Upset (underdog vence):
- Diferença de fama > 200: +5 fama extra
- Diferença de fama > 500: +10 fama extra
- Diferença de fama > 1000: +20 fama extra

Bônus de Streak (a cada 3 vitórias consecutivas):
- +2 fama por streak (máximo +10)

Fama Final = Base + Upset + Streak
```

---

## 🎁 SISTEMA DE RECOMPENSAS MENSAIS

**Distribuição para Top 100:**

```javascript
// Recompensas por Posição Final
const recompensas = {
  1: {
    moedas: 5000,
    fragmentos: 50,
    avatar: 'Lendário',
    titulo: {
      id: 'campeao_YYYY-MM',
      nome: 'Campeão',
      icone: '👑'
    }
  },
  '2-3': {
    moedas: 3000,
    fragmentos: 30,
    avatar: 'Raro',
    titulo: {
      id: 'vice_campeao_YYYY-MM' ou 'terceiro_lugar_YYYY-MM',
      nome: 'Vice-Campeão' ou '3º Lugar',
      icone: '🥈' ou '🥉'
    }
  },
  '4-10': {
    moedas: 1500,
    fragmentos: 20,
    titulo: {
      id: 'elite_top10_YYYY-MM',
      nome: 'Elite Top 10',
      icone: '⭐'
    }
  },
  '11-50': {
    moedas: 800,
    fragmentos: 10
  },
  '51-100': {
    moedas: 400,
    fragmentos: 5
  }
};
```

**Processo de Distribuição:**
1. Temporada encerra (após 30 dias)
2. Sistema captura posições finais via `top_100_atual` view
3. Cria registros em `pvp_recompensas_pendentes`
4. Cria registros em `pvp_titulos` (se aplicável)
5. Copia dados para `pvp_historico_temporadas`
6. Jogador coleta recompensas na página `/recompensas`
7. Atualiza `player_stats` (moedas, fragmentos)
8. Cria avatares se aplicável
9. Marca como `coletada = true`

---

## 🔧 ÍNDICES RECOMENDADOS PARA PERFORMANCE

```sql
-- AVATARES
CREATE INDEX idx_avatares_user_id ON avatares(user_id);
CREATE INDEX idx_avatares_vivo ON avatares(vivo);
CREATE INDEX idx_avatares_ativo ON avatares(user_id, ativo) WHERE ativo = true;
CREATE INDEX idx_avatares_raridade ON avatares(raridade);

-- PLAYER_STATS
CREATE UNIQUE INDEX idx_player_stats_user_id ON player_stats(user_id);

-- ITEMS & INVENTORY
CREATE INDEX idx_items_tipo ON items(tipo);
CREATE INDEX idx_player_inventory_user_id ON player_inventory(user_id);

-- PVP RANKINGS
CREATE INDEX idx_pvp_rankings_temporada_fama ON pvp_rankings(temporada_id, fama DESC);
CREATE INDEX idx_pvp_rankings_user_id ON pvp_rankings(user_id);

-- PVP BATALHAS LOG
CREATE INDEX idx_pvp_batalhas_temporada ON pvp_batalhas_log(temporada_id);
CREATE INDEX idx_pvp_batalhas_jogador1 ON pvp_batalhas_log(jogador1_id);
CREATE INDEX idx_pvp_batalhas_data ON pvp_batalhas_log(data_batalha DESC);

-- PVP HISTÓRICO
CREATE INDEX idx_pvp_historico_user_id ON pvp_historico_temporadas(user_id);
CREATE INDEX idx_pvp_historico_temporada ON pvp_historico_temporadas(temporada_id);

-- INVOCAÇÕES
CREATE INDEX idx_invocacoes_user_id ON invocacoes_historico(user_id);
CREATE INDEX idx_invocacoes_created_at ON invocacoes_historico(created_at DESC);
```

---

## 🔐 ROW LEVEL SECURITY (RLS) - Recomendações

**Políticas de Segurança Sugeridas:**

```sql
-- AVATARES: Jogadores só veem seus próprios avatares
ALTER TABLE avatares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatares"
  ON avatares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatares"
  ON avatares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatares"
  ON avatares FOR UPDATE
  USING (auth.uid() = user_id);

-- PLAYER_STATS: Jogadores só modificam seus próprios stats
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON player_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON player_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- PVP_RANKINGS: Todos podem ver, só sistema atualiza
ALTER TABLE pvp_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rankings"
  ON pvp_rankings FOR SELECT
  USING (true);

-- Apenas funções autorizadas podem UPDATE (implementar via service_role)

-- PLAYER_INVENTORY: Apenas próprio inventário
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory"
  ON player_inventory FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 📊 TRIGGERS IMPORTANTES

### 1. Auto-atualizar `updated_at`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_avatares_updated_at
  BEFORE UPDATE ON avatares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Validar apenas 1 avatar ativo por jogador
```sql
CREATE OR REPLACE FUNCTION validate_single_active_avatar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ativo = true THEN
    UPDATE avatares
    SET ativo = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND ativo = true;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_active_avatar
  BEFORE UPDATE ON avatares
  FOR EACH ROW EXECUTE FUNCTION validate_single_active_avatar();
```

---

## 🚀 MELHORIAS RECOMENDADAS

### 1. **Adicionar Coluna `email` na tabela `player_stats`**
```sql
ALTER TABLE player_stats
ADD COLUMN email TEXT;

-- Atualizar com dados do auth.users
UPDATE player_stats ps
SET email = au.email
FROM auth.users au
WHERE ps.user_id = au.id;
```

### 2. **Criar tabela de configurações do jogador**
```sql
CREATE TABLE player_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  som_ativado BOOLEAN DEFAULT true,
  musica_ativada BOOLEAN DEFAULT true,
  notificacoes_ativadas BOOLEAN DEFAULT true,
  idioma VARCHAR(5) DEFAULT 'pt-BR',
  tema VARCHAR(10) DEFAULT 'dark',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **Adicionar análise de batalhas**
```sql
ALTER TABLE pvp_batalhas_log
ADD COLUMN detalhes_batalha JSONB;

-- Estrutura sugerida:
{
  "rounds": [
    {
      "round": 1,
      "jogador1_acao": "ataque",
      "jogador2_acao": "habilidade",
      "dano_jogador1": 50,
      "dano_jogador2": 75
    }
  ],
  "mvp": "jogador1",
  "maior_dano": 150,
  "critical_hits": 3
}
```

### 4. **Criar sistema de conquistas**
```sql
CREATE TABLE conquistas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  icone VARCHAR(10),
  requisito JSONB,
  recompensa JSONB,
  raridade VARCHAR(20) DEFAULT 'Comum'
);

CREATE TABLE player_conquistas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  conquista_id UUID REFERENCES conquistas(id),
  progresso JSONB,
  completada BOOLEAN DEFAULT false,
  data_conquista TIMESTAMP,
  UNIQUE(user_id, conquista_id)
);
```

---

## 📝 DADOS JSONB - ESTRUTURAS

### Avatar.habilidades (JSONB)
```json
[
  {
    "id": "bola_fogo_basica",
    "nome": "Bola de Fogo",
    "tipo": "Ofensiva",
    "tier": "Básica",
    "elemento": "Fogo",
    "dano_base": 40,
    "custo_energia": 20,
    "descricao": "Lança uma bola de fogo no inimigo",
    "efeitos": [
      {
        "tipo": "queimadura",
        "chance": 30,
        "duracao": 3,
        "dano_por_turno": 10
      }
    ]
  }
]
```

### Avatar.fragmento_herdado (JSONB)
```json
{
  "nome_avatar_anterior": "Ignis, o Flamejante",
  "nivel_morte": 45,
  "raridade": "Raro",
  "elemento": "Fogo",
  "bonus_stats": {
    "forca": 5,
    "agilidade": 3
  },
  "data_morte": "2025-11-10T14:30:00Z"
}
```

### pvp_batalhas_log.jogador1_recompensas (JSONB)
```json
{
  "moedas": 50,
  "fragmentos": 5,
  "experiencia": 100,
  "fama_ganho": 22,
  "bonus": {
    "upset_bonus": 10,
    "streak_bonus": 2
  }
}
```

### pvp_recompensas_pendentes (estrutura completa)
```json
{
  "moedas": 5000,
  "fragmentos": 50,
  "avatar_lendario": true,
  "titulo": {
    "id": "campeao_2025-11",
    "nome": "Campeão de Novembro 2025",
    "icone": "👑"
  },
  "posicao": 1,
  "fama_final": 5432
}
```

---

## ✅ CHECKLIST DE VALIDAÇÃO DO SCHEMA

- [x] Tabela `avatares` está completa
- [x] Tabela `player_stats` está funcional
- [x] Sistema de PVP com temporadas implementado
- [x] Sistema de recompensas implementado
- [x] Sistema de títulos implementado
- [x] Views de leaderboard criadas
- [x] Foreign Keys definidas corretamente
- [x] Timestamps (created_at, updated_at) em todas as tabelas
- [ ] RLS (Row Level Security) configurado
- [ ] Índices de performance criados
- [ ] Triggers de validação implementados
- [ ] Backup automático configurado

---

## 🐛 PROBLEMAS IDENTIFICADOS E CORREÇÕES

### ❌ Problema 1: Falta de nome do jogador em `leaderboard_atual`
**Situação:** A view `leaderboard_atual` referencia `ps.nome_operacao`, mas o código usa `nome_usuario`

**Correção:**
```sql
-- Garantir que player_stats.nome_operacao está populado
UPDATE player_stats ps
SET nome_operacao = COALESCE(
  ps.nome_operacao,
  au.email,
  'Jogador ' || SUBSTRING(ps.user_id::text, 1, 8)
)
FROM auth.users au
WHERE ps.user_id = au.id AND ps.nome_operacao IS NULL;
```

### ❌ Problema 2: Tabelas PVP real-time ainda existem mas não são usadas
**Situação:** Tabelas legadas ocupando espaço

**Opções:**
1. **Manter:** Para futuro PVP real-time
2. **Remover:** Se não haverá PVP real-time
```sql
-- Se optar por remover:
DROP TABLE IF EXISTS pvp_matchmaking_queue CASCADE;
DROP TABLE IF EXISTS pvp_challenges CASCADE;
DROP TABLE IF EXISTS pvp_battle_rooms CASCADE;
DROP TABLE IF EXISTS pvp_available_players CASCADE;
```

### ❌ Problema 3: Falta de validação em `player_inventory.quantidade`
**Situação:** Quantidade pode ficar negativa

**Correção:**
```sql
ALTER TABLE player_inventory
ADD CONSTRAINT check_positive_quantidade CHECK (quantidade >= 0);
```

---

## 📚 REFERÊNCIAS DE CÓDIGO

**Arquivos que usam este schema:**
- `/app/api/invocar-avatar/route.js` - Cria avatares e histórico
- `/app/api/pvp/ia/finalizar/route.js` - Atualiza rankings e log
- `/app/api/pvp/temporada/encerrar/route.js` - Encerra temporadas
- `/app/api/pvp/recompensas/coletar/route.js` - Distribui recompensas
- `/app/api/pvp/leaderboard/route.js` - Consulta leaderboard
- `/lib/pvp/rankingSystem.js` - Sistema de fama
- `/lib/pvp/seasonSystem.js` - Gerenciamento de temporadas

---

**Última Atualização:** 2025-11-15
**Versão do Documento:** 1.0
**Responsável:** Claude Code Assistant
