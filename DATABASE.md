# 🗄️ Documentação do Banco de Dados

Guia completo do schema do banco de dados do Portal Hunter Awakening.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Diagrama de Relacionamentos](#diagrama-de-relacionamentos)
3. [Tabelas Core](#tabelas-core)
4. [Tabelas de PVP](#tabelas-de-pvp)
5. [Tabelas de Mercado](#tabelas-de-mercado)
6. [Views](#views)
7. [RPC Functions](#rpc-functions)
8. [Triggers](#triggers)
9. [Índices e Performance](#índices-e-performance)
10. [Constraints e Validações](#constraints-e-validações)

---

## Visão Geral

### Informações Técnicas
- **SGBD:** PostgreSQL 15+
- **Provedor:** Supabase
- **Total de Tabelas:** 15 tabelas principais
- **Total de Views:** 3 views materializadas
- **Total de RPC Functions:** 1+ funções
- **Autenticação:** Supabase Auth (`auth.users`)

### Organização do Schema

```
Portal_Hunter_Awakening Database
├── Core (Jogador e Avatares)
│   ├── auth.users (Supabase Auth)
│   ├── player_stats
│   ├── avatares
│   ├── invocacoes_historico
│   └── items / player_inventory
│
├── PVP (Sistema de Ranking)
│   ├── pvp_temporadas
│   ├── pvp_rankings
│   ├── pvp_historico_temporadas
│   ├── pvp_batalhas_log
│   ├── pvp_titulos
│   └── pvp_recompensas_pendentes
│
├── Mercado
│   └── mercado_transacoes
│
└── Views
    ├── leaderboard_atual
    ├── top_100_atual
    └── estatisticas_jogador
```

---

## Diagrama de Relacionamentos

```
┌──────────────┐
│  auth.users  │ (Supabase Auth)
└───────┬──────┘
        │
        │ 1:1
        ▼
┌──────────────────┐
│  player_stats    │ (Recursos do jogador)
│  • moedas        │
│  • fragmentos    │
│  • nome_operacao │
└──────────────────┘
        │
        │ 1:N
        ▼
┌──────────────────┐
│    avatares      │ (Coleção de avatares)
│  • nome          │
│  • elemento      │◄────────┐ fk_avatares_player_stats
│  • raridade      │         │ (para JOIN com vendedor)
│  • stats         │         │
│  • em_venda      │─────────┘
└────────┬─────────┘
         │
         │ N:1 (avatar ativo)
         └─────► player_stats (via campo ativo=true)

┌──────────────────┐
│ pvp_temporadas   │ (Temporadas mensais)
│  • temporada_id  │ (YYYY-MM)
│  • ativa         │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────────┐
│   pvp_rankings       │ (Ranking da temporada ativa)
│  • user_id           │
│  • fama (ELO)        │
│  • vitorias/derrotas │
└──────────────────────┘
         │
         │ Histórico (ao encerrar temporada)
         ▼
┌─────────────────────────────┐
│ pvp_historico_temporadas    │ (Temporadas passadas)
│  • fama_final               │
│  • posicao_final            │
└─────────────────────────────┘

┌──────────────────────┐
│ mercado_transacoes   │ (Log de vendas)
│  • avatar_id         │
│  • vendedor_id       │
│  • comprador_id      │
│  • preco             │
└──────────────────────┘
```

---

## Tabelas Core

### auth.users (Supabase Auth)

**Função:** Tabela gerenciada pelo Supabase Auth para autenticação.

**Campos Principais:**
- `id` (UUID) - ID do usuário (usado como foreign key)
- `email` - Email do usuário
- `encrypted_password` - Senha criptografada
- `created_at` - Data de criação

**Relacionamentos:**
- `1:1` com `player_stats`
- `1:N` com `avatares`

---

### player_stats

**Função:** Armazena estatísticas, recursos e informações do jogador.

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | YES | null | FK → auth.users **(UNIQUE)** |
| `moedas` | INTEGER | YES | 1000 | Moeda principal (💰) |
| `fragmentos` | INTEGER | YES | 50 | Moeda premium (💎) |
| `divida` | INTEGER | YES | 0 | Dívida com Necromante (não usado) |
| `ranking` | VARCHAR(10) | YES | 'F' | Ranking antigo (descontinuado) |
| `missoes_completadas` | INTEGER | YES | 0 | Total de missões |
| `primeira_invocacao` | BOOLEAN | YES | true | Se tem invocação grátis |
| `nome_operacao` | TEXT | YES | null | Nome/apelido do jogador |
| `created_at` | TIMESTAMP | YES | now() | Data de criação |
| `updated_at` | TIMESTAMP | YES | now() | Última atualização |

#### Constraints
- **UNIQUE** (`user_id`) - Um stats por usuário

#### Valores Iniciais (ao criar conta)
```json
{
  "moedas": 1000,
  "fragmentos": 50,
  "divida": 0,
  "ranking": "F",
  "missoes_completadas": 0,
  "primeira_invocacao": true
}
```

#### Relacionamentos
- **1:1** com `auth.users` via `user_id`

#### Uso nas APIs
- **GET/PUT** `/api/atualizar-stats` - Atualiza moedas, fragmentos
- **POST** `/api/invocar-avatar` - Deduz moedas/fragmentos, marca primeira_invocacao=false
- **POST** `/api/mercado/comprar` - RPC deduz moedas do comprador, adiciona ao vendedor

---

### avatares

**Função:** Armazena todos os avatares invocados pelos jogadores.

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | YES | null | FK → auth.users (dono) |
| `nome` | VARCHAR(100) | NO | null | Nome do avatar |
| `descricao` | TEXT | YES | null | Lore/história |
| `elemento` | VARCHAR(50) | YES | null | Fogo\|Água\|Terra\|Vento\|Eletricidade\|Sombra\|Luz |
| `raridade` | VARCHAR(20) | YES | null | Comum\|Raro\|Lendário |
| `nivel` | INTEGER | YES | 1 | Nível (1-100) |
| `experiencia` | INTEGER | YES | 0 | XP acumulada |
| `vinculo` | INTEGER | YES | 0 | Vínculo (0-100) |
| `exaustao` | INTEGER | YES | 0 | Exaustão (0-100) |
| `forca` | INTEGER | YES | null | Stat: Força |
| `agilidade` | INTEGER | YES | null | Stat: Agilidade |
| `resistencia` | INTEGER | YES | null | Stat: Resistência |
| `foco` | INTEGER | YES | null | Stat: Foco |
| `habilidades` | JSONB | YES | '[]'::jsonb | Array de habilidades |
| `vivo` | BOOLEAN | YES | true | Se está vivo |
| `ativo` | BOOLEAN | YES | false | Se é o avatar ativo |
| `marca_morte` | BOOLEAN | YES | false | Marca de morte (ressurreição) |
| `hp_atual` | INTEGER | YES | null | HP atual |
| `em_venda` | BOOLEAN | YES | false | Se está à venda no mercado |
| `preco_venda` | INTEGER | YES | null | Preço em moedas |
| `preco_fragmentos` | INTEGER | YES | null | Preço em fragmentos |
| `fragmento_herdado` | JSONB | YES | null | Fragmento do avatar morto |
| `merge_count` | INTEGER | YES | 0 | Contador de fusões |
| `created_at` | TIMESTAMP | YES | now() | Data de invocação |
| `updated_at` | TIMESTAMP | YES | now() | Última atualização |

#### Constraints (Mercado)

```sql
-- Se em_venda=true, deve ter preço
CHECK (
  (em_venda = false) OR
  (em_venda = true AND (preco_venda > 0 OR preco_fragmentos > 0))
)

-- Preços mínimos e máximos
CHECK (preco_venda IS NULL OR preco_venda BETWEEN 100 AND 10000)
CHECK (preco_fragmentos IS NULL OR preco_fragmentos BETWEEN 1 AND 500)
```

#### Foreign Keys
- `user_id` → `auth.users.id` (ON DELETE CASCADE)
- `user_id` → `player_stats.user_id` via **fk_avatares_player_stats**
  - Permite JOIN direto para pegar `nome_operacao` do vendedor

#### Índices Importantes
```sql
CREATE INDEX idx_avatares_user_id ON avatares(user_id);
CREATE INDEX idx_avatares_vivo ON avatares(vivo);
CREATE INDEX idx_avatares_em_venda ON avatares(em_venda) WHERE em_venda = true;
CREATE INDEX idx_avatares_ativo ON avatares(user_id, ativo) WHERE ativo = true;
```

#### Regras de Negócio

**Avatar Ativo:**
- Apenas **1 avatar ativo** por jogador
- Filtro: `WHERE user_id = ? AND ativo = true`

**Sistema de Morte:**
- `vivo = false` → Avatar morreu em batalha
- `marca_morte = true` → Já foi ressuscitado (só pode 1x)
- `marca_morte = true AND vivo = false` → Memorial (morte permanente)

**Mercado:**
- `em_venda = true` → Aparece no mercado
- Ao vender, avatar fica disponível para compra
- Ao comprar, `user_id` muda, `em_venda = false`, `vinculo = 0`, `exaustao = 0`

#### Estrutura de Habilidades (JSONB)

```json
[
  {
    "nome": "Explosão Solar",
    "descricao": "Ataque devastador de fogo",
    "tipo": "ofensiva",
    "raridade": "Lendário",
    "elemento": "Fogo",
    "custo_energia": 40,
    "cooldown": 3,
    "dano_base": 80,
    "multiplicador_stat": 1.5,
    "stat_primario": "foco",
    "efeitos_status": ["queimadura"],
    "alvo": "inimigo",
    "area": false,
    "num_alvos": 1,
    "chance_acerto": 90,
    "chance_efeito": 60,
    "duracao_efeito": 3,
    "nivel_minimo": 1,
    "vinculo_minimo": 0
  }
]
```

---

### items

**Função:** Catálogo de itens disponíveis na loja do jogo.

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `nome` | VARCHAR(100) | NO | null | Nome do item |
| `descricao` | TEXT | YES | null | Descrição |
| `tipo` | VARCHAR(50) | NO | null | consumivel\|equipamento |
| `efeito` | VARCHAR(50) | YES | null | cura\|buff\|energia |
| `valor_efeito` | INTEGER | YES | null | Valor numérico |
| `preco_compra` | INTEGER | NO | 0 | Preço na loja |
| `preco_venda` | INTEGER | NO | 0 | Preço ao vender |
| `raridade` | VARCHAR(20) | YES | 'Comum' | Raridade |
| `icone` | VARCHAR(10) | YES | '📦' | Emoji do item |
| `empilhavel` | BOOLEAN | YES | true | Se empilha |
| `max_pilha` | INTEGER | YES | 99 | Máximo na pilha |
| `created_at` | TIMESTAMP | YES | now() | Criação |

#### Exemplo de Items

```sql
INSERT INTO items (nome, descricao, tipo, efeito, valor_efeito, preco_compra, icone) VALUES
  ('Poção de Cura Menor', 'Restaura 50 HP', 'consumivel', 'cura', 50, 100, '🧪'),
  ('Poção de Energia', 'Restaura 30 energia', 'consumivel', 'energia', 30, 150, '⚡'),
  ('Elixir de Força', '+10 Força por 3 turnos', 'consumivel', 'buff_forca', 10, 200, '💪');
```

---

### player_inventory

**Função:** Inventário dos jogadores (quais itens possuem).

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | NO | null | FK → auth.users |
| `item_id` | UUID | NO | null | FK → items |
| `quantidade` | INTEGER | NO | 1 | Quantidade possuída |
| `created_at` | TIMESTAMP | YES | now() | Criação |
| `updated_at` | TIMESTAMP | YES | now() | Atualização |

#### Constraints
- **UNIQUE** (`user_id`, `item_id`) - Evita duplicatas (controle via quantidade)

#### Query Típica

```sql
-- Listar inventário do jogador
SELECT
  pi.quantidade,
  i.*
FROM player_inventory pi
JOIN items i ON i.id = pi.item_id
WHERE pi.user_id = '...'
ORDER BY i.tipo, i.nome;
```

---

### invocacoes_historico

**Função:** Histórico de todas as invocações de avatares.

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | NO | null | FK → auth.users |
| `avatar_id` | UUID | YES | null | FK → avatares |
| `custo_moedas` | INTEGER | YES | 0 | Moedas gastas |
| `custo_fragmentos` | INTEGER | YES | 0 | Fragmentos gastos |
| `gratuita` | BOOLEAN | YES | false | Se foi grátis |
| `raridade` | VARCHAR(20) | YES | null | Raridade invocada |
| `elemento` | VARCHAR(50) | YES | null | Elemento invocado |
| `created_at` | TIMESTAMP | YES | now() | Data da invocação |

#### Uso
- Analytics: Quantas invocações por dia/mês
- Drop rate real: % de Lendários invocados
- Custo total gasto em invocações

---

## Tabelas de PVP

### pvp_temporadas

**Função:** Gerenciamento de temporadas mensais de PVP.

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `temporada_id` | VARCHAR(7) | NO | null | **UNIQUE** (YYYY-MM) |
| `nome` | TEXT | YES | null | "Temporada de Novembro 2025" |
| `data_inicio` | TIMESTAMP | NO | null | Início da temporada |
| `data_fim` | TIMESTAMP | NO | null | Fim da temporada |
| `ativa` | BOOLEAN | YES | false | Se está ativa |
| `created_at` | TIMESTAMP | YES | now() | Criação |
| `updated_at` | TIMESTAMP | YES | now() | Atualização |

#### Constraints
- **UNIQUE** (`temporada_id`)
- **CHECK** Apenas **1 temporada** com `ativa = true`

#### Formato do temporada_id
```
2025-11  (Novembro 2025)
2025-12  (Dezembro 2025)
2026-01  (Janeiro 2026)
```

#### Ciclo de Vida

```
1. Criar nova temporada:
   INSERT INTO pvp_temporadas (temporada_id, nome, data_inicio, data_fim, ativa)
   VALUES ('2025-11', 'Temporada de Novembro 2025', '2025-11-01', '2025-11-30', true);

2. Durante o mês:
   - Jogadores batalham
   - pvp_rankings é atualizado

3. Fim do mês (via /api/pvp/temporada/encerrar):
   - Marca ativa = false
   - Copia rankings para pvp_historico_temporadas
   - Distribui recompensas (pvp_recompensas_pendentes)
   - Cria títulos para Top 10
   - Cria nova temporada (mês seguinte)
```

---

### pvp_rankings

**Função:** Ranking **atual** da temporada ativa.

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | NO | null | FK → auth.users |
| `temporada_id` | VARCHAR(7) | NO | null | FK → pvp_temporadas |
| `fama` | INTEGER | YES | 1000 | Pontos de Fama (ELO) |
| `vitorias` | INTEGER | YES | 0 | Total de vitórias |
| `derrotas` | INTEGER | YES | 0 | Total de derrotas |
| `streak` | INTEGER | YES | 0 | Sequência de vitórias |
| `streak_maximo` | INTEGER | YES | 0 | Maior sequência |
| `ultima_batalha` | TIMESTAMP | YES | null | Última batalha |
| `recompensas_recebidas` | BOOLEAN | YES | false | Se já recebeu recompensas |
| `created_at` | TIMESTAMP | YES | now() | Criação |
| `updated_at` | TIMESTAMP | YES | now() | Atualização |

#### Constraints
- **UNIQUE** (`user_id`, `temporada_id`) - Um ranking por temporada

#### Sistema de Fama (ELO)

**Valor Inicial:** 1000 pontos

**Ganho/Perda:**
- Vitória: +20 base
- Derrota: -15 base
- Bônus Upset: +5 a +20 (underdog vence)
- Bônus Streak: +2 a cada 3 vitórias (max +10)

**Tiers:**
```
Bronze:     0 - 999
Prata:   1000 - 1999
Ouro:    2000 - 2999
Platina: 3000 - 3999
Diamante:4000 - 4999
Lendário:5000+
```

#### Cálculo de Posição

Usa a **view `leaderboard_atual`** que ordena por fama e calcula `ROW_NUMBER()`.

---

### pvp_historico_temporadas

**Função:** Histórico de temporadas **passadas** (snapshot ao encerrar).

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | NO | null | FK → auth.users |
| `temporada_id` | VARCHAR(7) | NO | null | FK → pvp_temporadas |
| `fama_final` | INTEGER | YES | 0 | Fama no fim da temporada |
| `vitorias` | INTEGER | YES | 0 | Total de vitórias |
| `derrotas` | INTEGER | YES | 0 | Total de derrotas |
| `posicao_final` | INTEGER | YES | null | Posição final (1º, 2º, etc) |
| `tier_final` | VARCHAR(20) | YES | null | Tier final |
| `recompensas_json` | JSONB | YES | null | Recompensas recebidas |
| `data_encerramento` | TIMESTAMP | YES | null | Data de encerramento |
| `created_at` | TIMESTAMP | YES | now() | Criação |

#### Estrutura de recompensas_json

```json
{
  "moedas": 5000,
  "fragmentos": 50,
  "avatar_lendario": true,
  "titulo": "👑 Campeão da Temporada Novembro"
}
```

#### Criação (ao encerrar temporada)

```sql
INSERT INTO pvp_historico_temporadas (
  user_id, temporada_id, fama_final, vitorias, derrotas, posicao_final, tier_final, recompensas_json, data_encerramento
)
SELECT
  user_id,
  temporada_id,
  fama,
  vitorias,
  derrotas,
  ROW_NUMBER() OVER (ORDER BY fama DESC) as posicao_final,
  CASE
    WHEN fama >= 5000 THEN 'Lendário'
    WHEN fama >= 4000 THEN 'Diamante'
    ...
  END as tier_final,
  NULL, -- recompensas calculadas separadamente
  NOW()
FROM pvp_rankings
WHERE temporada_id = '2025-10';
```

---

### pvp_batalhas_log

**Função:** Log de **todas** as batalhas PVP (auditoria e analytics).

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `temporada_id` | VARCHAR(7) | NO | null | FK → pvp_temporadas |
| `jogador1_id` | UUID | NO | null | FK → auth.users |
| `jogador2_id` | UUID | NO | null | FK → auth.users |
| `vencedor_id` | UUID | YES | null | FK → auth.users |
| `avatar1_id` | UUID | YES | null | FK → avatares |
| `avatar2_id` | UUID | YES | null | FK → avatares |
| `fama_jogador1_antes` | INTEGER | YES | null | Fama antes |
| `fama_jogador1_depois` | INTEGER | YES | null | Fama depois |
| `fama_jogador2_antes` | INTEGER | YES | null | Fama antes |
| `fama_jogador2_depois` | INTEGER | YES | null | Fama depois |
| `recompensas_vencedor` | JSONB | YES | null | Moedas, XP, etc |
| `foi_upset` | BOOLEAN | YES | false | Se foi upset |
| `diferenca_fama` | INTEGER | YES | null | Diferença de fama |
| `duracao_rodadas` | INTEGER | YES | null | Número de rodadas |
| `created_at` | TIMESTAMP | YES | now() | Data da batalha |

#### Uso
- Analytics de taxa de vitória
- Identificar smurfs (contas secundárias)
- Calcular meta (avatares mais usados)
- Detectar win trading

---

### pvp_titulos

**Função:** Títulos conquistados pelos jogadores.

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | NO | null | FK → auth.users |
| `titulo_id` | UUID | NO | null | ID único do título |
| `titulo_nome` | TEXT | NO | null | Nome do título |
| `titulo_icone` | TEXT | YES | null | Emoji/ícone |
| `temporada_id` | VARCHAR(7) | YES | null | Temporada que ganhou |
| `posicao_conquistada` | INTEGER | YES | null | Posição final |
| `ativo` | BOOLEAN | YES | false | Se está ativo |
| `created_at` | TIMESTAMP | YES | now() | Criação |

#### Constraints
- **CHECK**: Apenas **1 título ativo** por usuário

#### Títulos Disponíveis

| Posição | Título | Ícone |
|---------|--------|-------|
| 1º | Campeão da Temporada | 👑 |
| 2º | Vice-Campeão | 🥈 |
| 3º | 3º Lugar | 🥉 |
| 4º-10º | Elite Top 10 | ⭐ |

#### Exibição

Títulos aparecem ao lado do nome no leaderboard:

```
1º - 👑 Invocador Supremo - 5500 fama
2º - 🥈 Mestre das Sombras - 5200 fama
```

---

### pvp_recompensas_pendentes

**Função:** Recompensas de fim de temporada a serem coletadas.

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | NO | null | FK → auth.users |
| `temporada_id` | VARCHAR(7) | NO | null | FK → pvp_temporadas |
| `moedas` | INTEGER | YES | 0 | Moedas a receber |
| `fragmentos` | INTEGER | YES | 0 | Fragmentos a receber |
| `avatar_lendario` | BOOLEAN | YES | false | Invocar lendário? |
| `avatar_raro` | BOOLEAN | YES | false | Invocar raro? |
| `titulo_id` | UUID | YES | null | FK → pvp_titulos |
| `coletada` | BOOLEAN | YES | false | Se foi coletada |
| `data_coleta` | TIMESTAMP | YES | null | Data da coleta |
| `created_at` | TIMESTAMP | YES | now() | Criação |

#### Distribuição de Recompensas

```sql
-- 1º Lugar
INSERT INTO pvp_recompensas_pendentes (user_id, temporada_id, moedas, fragmentos, avatar_lendario, titulo_id)
VALUES (user_id, '2025-11', 5000, 50, true, titulo_campeao_id);

-- 2º-3º Lugar
INSERT INTO pvp_recompensas_pendentes (user_id, temporada_id, moedas, fragmentos, avatar_raro, titulo_id)
VALUES (user_id, '2025-11', 3000, 30, true, titulo_vice_id);

-- 4º-10º
INSERT INTO pvp_recompensas_pendentes (user_id, temporada_id, moedas, fragmentos, titulo_id)
VALUES (user_id, '2025-11', 1500, 20, titulo_top10_id);

-- 11º-50º
INSERT INTO pvp_recompensas_pendentes (user_id, temporada_id, moedas, fragmentos)
VALUES (user_id, '2025-11', 800, 10);

-- 51º-100º
INSERT INTO pvp_recompensas_pendentes (user_id, temporada_id, moedas, fragmentos)
VALUES (user_id, '2025-11', 400, 5);
```

#### Coleta (via /api/pvp/recompensas/coletar)

```sql
-- 1. Buscar recompensa
SELECT * FROM pvp_recompensas_pendentes
WHERE user_id = ? AND coletada = false
LIMIT 1;

-- 2. Adicionar moedas/fragmentos
UPDATE player_stats
SET moedas = moedas + ?, fragmentos = fragmentos + ?
WHERE user_id = ?;

-- 3. Invocar avatar (se aplicável)
IF (avatar_lendario OR avatar_raro) THEN
  INSERT INTO avatares (...) VALUES (...);
END IF;

-- 4. Ativar título
IF (titulo_id IS NOT NULL) THEN
  UPDATE pvp_titulos SET ativo = true WHERE id = titulo_id;
END IF;

-- 5. Marcar como coletada
UPDATE pvp_recompensas_pendentes
SET coletada = true, data_coleta = NOW()
WHERE id = ?;
```

---

## Tabelas de Mercado

### mercado_transacoes

**Função:** Log de todas as transações do mercado (auditoria).

#### Schema

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `avatar_id` | UUID | NO | null | FK → avatares |
| `vendedor_id` | UUID | NO | null | FK → auth.users |
| `comprador_id` | UUID | NO | null | FK → auth.users |
| `preco_moedas` | INTEGER | YES | 0 | Preço em moedas |
| `preco_fragmentos` | INTEGER | YES | 0 | Preço em fragmentos |
| `taxa_moedas` | INTEGER | YES | 0 | Taxa de 5% |
| `valor_vendedor_moedas` | INTEGER | YES | 0 | Moedas recebidas (95%) |
| `created_at` | TIMESTAMP | YES | now() | Data da transação |

#### Criado por RPC `executar_compra_avatar`

```sql
INSERT INTO mercado_transacoes (
  avatar_id, vendedor_id, comprador_id,
  preco_moedas, preco_fragmentos,
  taxa_moedas, valor_vendedor_moedas
) VALUES (
  p_avatar_id, vendedor_id, p_comprador_id,
  p_preco_moedas, p_preco_fragmentos,
  taxa, preco_moedas_vendedor
);
```

#### Analytics
- Volume de vendas por dia/mês
- Avatar mais vendido
- Preço médio por raridade
- Taxa total coletada pelo sistema

---

## Views

### leaderboard_atual

**Função:** Leaderboard completo com posições calculadas.

#### Definição

```sql
CREATE VIEW leaderboard_atual AS
SELECT
  ROW_NUMBER() OVER (ORDER BY fama DESC, vitorias DESC) as posicao,
  pr.*,
  ps.nome_operacao,
  CASE
    WHEN fama >= 5000 THEN 'Lendário'
    WHEN fama >= 4000 THEN 'Diamante'
    WHEN fama >= 3000 THEN 'Platina'
    WHEN fama >= 2000 THEN 'Ouro'
    WHEN fama >= 1000 THEN 'Prata'
    ELSE 'Bronze'
  END as tier,
  ROUND(vitorias::NUMERIC / NULLIF(vitorias + derrotas, 0) * 100, 1) as winrate,
  pt.titulo_nome as titulo_ativo
FROM pvp_rankings pr
JOIN player_stats ps ON ps.user_id = pr.user_id
LEFT JOIN pvp_titulos pt ON pt.user_id = pr.user_id AND pt.ativo = true
WHERE pr.temporada_id = (
  SELECT temporada_id FROM pvp_temporadas WHERE ativa = true LIMIT 1
)
ORDER BY fama DESC, vitorias DESC;
```

#### Uso

```sql
-- Listar Top 100
SELECT * FROM leaderboard_atual LIMIT 100;

-- Posição do jogador
SELECT posicao, fama, tier FROM leaderboard_atual WHERE user_id = ?;
```

---

### top_100_atual

**Função:** Top 100 para distribuição de recompensas.

#### Definição

```sql
CREATE VIEW top_100_atual AS
SELECT * FROM leaderboard_atual LIMIT 100;
```

#### Uso

```sql
-- Encerrar temporada e distribuir recompensas
INSERT INTO pvp_recompensas_pendentes (...)
SELECT
  user_id,
  temporada_id,
  CASE
    WHEN posicao = 1 THEN 5000
    WHEN posicao BETWEEN 2 AND 3 THEN 3000
    WHEN posicao BETWEEN 4 AND 10 THEN 1500
    WHEN posicao BETWEEN 11 AND 50 THEN 800
    ELSE 400
  END as moedas,
  ...
FROM top_100_atual;
```

---

### estatisticas_jogador

**Função:** Estatísticas agregadas de **todas** as temporadas.

#### Definição

```sql
CREATE VIEW estatisticas_jogador AS
SELECT
  user_id,
  COUNT(*) as total_temporadas,
  SUM(vitorias) as vitorias_totais,
  SUM(derrotas) as derrotas_totais,
  ROUND(SUM(vitorias)::NUMERIC / NULLIF(SUM(vitorias + derrotas), 0) * 100, 1) as winrate_geral,
  MAX(fama_final) as fama_maxima,
  MIN(posicao_final) as melhor_posicao,
  AVG(fama_final) as fama_media
FROM pvp_historico_temporadas
GROUP BY user_id;
```

#### Uso

```sql
-- Estatísticas do jogador
SELECT * FROM estatisticas_jogador WHERE user_id = ?;
```

---

## RPC Functions

### executar_compra_avatar

**Função:** Compra atômica de avatar do mercado.

**Assinatura:**
```sql
executar_compra_avatar(
  p_avatar_id UUID,
  p_comprador_id UUID,
  p_preco_moedas INTEGER DEFAULT 0,
  p_preco_fragmentos INTEGER DEFAULT 0
) RETURNS JSON
```

**Fluxo (Transação Atômica):**

```sql
BEGIN;
  -- 1. LOCK PESSIMISTA
  SELECT * FROM avatares WHERE id = p_avatar_id FOR UPDATE;

  -- 2. VALIDAÇÕES
  IF NOT em_venda THEN RAISE EXCEPTION 'Avatar não está à venda'; END IF;
  IF user_id = p_comprador_id THEN RAISE EXCEPTION 'Não pode comprar próprio avatar'; END IF;

  -- 3. VERIFICAR MOEDAS DO COMPRADOR
  SELECT moedas, fragmentos INTO v_moedas, v_fragmentos
  FROM player_stats WHERE user_id = p_comprador_id;

  IF v_moedas < p_preco_moedas THEN RAISE EXCEPTION 'Moedas insuficientes'; END IF;
  IF v_fragmentos < p_preco_fragmentos THEN RAISE EXCEPTION 'Fragmentos insuficientes'; END IF;

  -- 4. VERIFICAR LIMITE DE 15 AVATARES
  SELECT COUNT(*) INTO v_count FROM avatares WHERE user_id = p_comprador_id;
  IF v_count >= 15 THEN RAISE EXCEPTION 'Limite de 15 avatares atingido'; END IF;

  -- 5. DEDUZIR DO COMPRADOR
  UPDATE player_stats
  SET moedas = moedas - p_preco_moedas,
      fragmentos = fragmentos - p_preco_fragmentos
  WHERE user_id = p_comprador_id;

  -- 6. ADICIONAR AO VENDEDOR (taxa 5% em moedas)
  v_taxa := FLOOR(p_preco_moedas * 0.05);
  v_moedas_vendedor := p_preco_moedas - v_taxa;

  UPDATE player_stats
  SET moedas = moedas + v_moedas_vendedor,
      fragmentos = fragmentos + p_preco_fragmentos
  WHERE user_id = v_vendedor_id;

  -- 7. TRANSFERIR AVATAR
  UPDATE avatares
  SET user_id = p_comprador_id,
      em_venda = false,
      preco_venda = NULL,
      preco_fragmentos = NULL,
      vinculo = 0,
      exaustao = 0
  WHERE id = p_avatar_id;

  -- 8. REGISTRAR TRANSAÇÃO
  INSERT INTO mercado_transacoes (...) VALUES (...);

  -- 9. RETORNAR RESULTADO
  RETURN json_build_object(
    'success', true,
    'avatar', avatar_data,
    'preco_moedas', p_preco_moedas,
    'taxa_moedas', v_taxa,
    ...
  );
COMMIT;
```

**Por que RPC?**
- **Atomicidade:** Tudo ou nada (ACID)
- **Segurança:** Lock pessimista evita race conditions
- **Performance:** Reduz round-trips (tudo em 1 chamada)

---

## Triggers

### trigger_limpar_precos

**Função:** Limpa preços automaticamente quando `em_venda = false`.

```sql
CREATE OR REPLACE FUNCTION limpar_precos_quando_nao_venda()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.em_venda = false THEN
    NEW.preco_venda := NULL;
    NEW.preco_fragmentos := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_limpar_precos
  BEFORE UPDATE ON avatares
  FOR EACH ROW
  EXECUTE FUNCTION limpar_precos_quando_nao_venda();
```

---

## Índices e Performance

### Índices Críticos

```sql
-- Avatares
CREATE INDEX idx_avatares_user_id ON avatares(user_id);
CREATE INDEX idx_avatares_vivo ON avatares(vivo);
CREATE INDEX idx_avatares_em_venda ON avatares(em_venda) WHERE em_venda = true;
CREATE INDEX idx_avatares_ativo ON avatares(user_id, ativo) WHERE ativo = true;
CREATE INDEX idx_avatares_raridade ON avatares(raridade);

-- Player Stats
CREATE UNIQUE INDEX idx_player_stats_user_id ON player_stats(user_id);

-- PVP Rankings
CREATE UNIQUE INDEX idx_pvp_rankings_user_temp ON pvp_rankings(user_id, temporada_id);
CREATE INDEX idx_pvp_rankings_fama ON pvp_rankings(fama DESC);
CREATE INDEX idx_pvp_rankings_temporada ON pvp_rankings(temporada_id);

-- PVP Histórico
CREATE INDEX idx_pvp_historico_user ON pvp_historico_temporadas(user_id);
CREATE INDEX idx_pvp_historico_temporada ON pvp_historico_temporadas(temporada_id);

-- PVP Batalhas Log
CREATE INDEX idx_pvp_batalhas_temporada ON pvp_batalhas_log(temporada_id);
CREATE INDEX idx_pvp_batalhas_jogador1 ON pvp_batalhas_log(jogador1_id);
CREATE INDEX idx_pvp_batalhas_jogador2 ON pvp_batalhas_log(jogador2_id);

-- Mercado
CREATE INDEX idx_mercado_transacoes_avatar ON mercado_transacoes(avatar_id);
CREATE INDEX idx_mercado_transacoes_created ON mercado_transacoes(created_at DESC);
```

---

## Constraints e Validações

### Mercado (avatares)

```sql
-- Preço obrigatório se em venda
ALTER TABLE avatares ADD CONSTRAINT check_em_venda_preco
CHECK (
  (em_venda = false) OR
  (em_venda = true AND (preco_venda > 0 OR preco_fragmentos > 0))
);

-- Limites de preço
ALTER TABLE avatares ADD CONSTRAINT check_preco_venda_min
CHECK (preco_venda IS NULL OR preco_venda >= 100);

ALTER TABLE avatares ADD CONSTRAINT check_preco_venda_max
CHECK (preco_venda IS NULL OR preco_venda <= 10000);

ALTER TABLE avatares ADD CONSTRAINT check_preco_fragmentos_min
CHECK (preco_fragmentos IS NULL OR preco_fragmentos >= 1);

ALTER TABLE avatares ADD CONSTRAINT check_preco_fragmentos_max
CHECK (preco_fragmentos IS NULL OR preco_fragmentos <= 500);
```

### PVP (pvp_temporadas)

```sql
-- Apenas 1 temporada ativa
CREATE UNIQUE INDEX idx_pvp_temporada_ativa ON pvp_temporadas(ativa) WHERE ativa = true;
```

---

## Resumo

### Pontos Fortes
- ✅ Estrutura normalizada e organizada
- ✅ Foreign keys bem definidas
- ✅ Transações atômicas via RPC
- ✅ Índices para performance
- ✅ Constraints de integridade

### Pontos a Melhorar
- ⚠️ Implementar **Row Level Security (RLS)** no Supabase
- ⚠️ Adicionar mais triggers de validação
- ⚠️ Implementar soft delete (em vez de hard delete)
- ⚠️ Adicionar audit log (quem alterou o quê)

---

**Última atualização:** Novembro 2025

**Para mais informações, veja:**
- [API_REFERENCE.md](./API_REFERENCE.md) - Documentação de APIs
- [SISTEMAS.md](./SISTEMAS.md) - Explicação dos sistemas do jogo
