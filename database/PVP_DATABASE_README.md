# 📊 Sistema PvP - Estrutura de Banco de Dados

Este documento explica a estrutura do banco de dados para o sistema PvP completo.

## 📁 Arquivo SQL

**Arquivo:** `pvp_system.sql`

## 🗂️ Tabelas

### 1. **pvp_temporadas**
Gerencia as temporadas mensais.

```sql
- id: ID único
- temporada_id: "2025-01", "2025-02" (formato YYYY-MM)
- nome: "Temporada Jan/2025"
- data_inicio: Início da temporada
- data_fim: Fim da temporada
- ativa: Boolean (apenas 1 temporada ativa por vez)
```

**Uso:** Armazena todas as temporadas do PvP.

---

### 2. **pvp_rankings**
Ranking ATUAL de cada jogador na temporada ativa.

```sql
- user_id: FK para usuarios(id)
- temporada_id: FK para pvp_temporadas(temporada_id)
- fama: Fama atual (começa em 1000)
- vitorias: Total de vitórias
- derrotas: Total de derrotas
- streak: Streak atual de vitórias
- streak_maximo: Maior streak alcançado
- ultima_batalha: Timestamp da última batalha
- recompensas_recebidas: Se já coletou recompensas
```

**Constraint:** UNIQUE(user_id, temporada_id) - um registro por jogador por temporada

**Uso:** Armazena o progresso atual do jogador na temporada.

---

### 3. **pvp_historico_temporadas**
Histórico de temporadas passadas.

```sql
- user_id: FK para usuarios(id)
- temporada_id: FK para pvp_temporadas(temporada_id)
- fama_final: Fama ao fim da temporada
- vitorias: Total de vitórias
- derrotas: Total de derrotas
- streak_maximo: Melhor streak
- posicao_final: Posição no leaderboard (1-100+)
- tier_final: Tier alcançado ("LENDARIO", "DIAMANTE", etc.)
- recompensas_json: JSON com detalhes das recompensas
- data_encerramento: Quando a temporada terminou
```

**Uso:** Preserva histórico de até 12 temporadas por jogador.

---

### 4. **pvp_batalhas_log** (Opcional)
Log completo de todas as batalhas.

```sql
- jogador1_id, jogador2_id: FKs para usuarios
- jogador1_fama_antes, jogador2_fama_antes: Fama antes da batalha
- vencedor_id: Quem venceu
- duracao_rodadas: Quantas rodadas durou
- jogador1_fama_ganho, jogador2_fama_ganho: Mudança de fama
- jogador1_recompensas, jogador2_recompensas: JSON com recompensas
- foi_upset: Boolean se foi upset
- diferenca_fama: Diferença de fama entre jogadores
```

**Uso:** Análises detalhadas, estatísticas, gráficos.

---

### 5. **pvp_titulos**
Títulos permanentes conquistados.

```sql
- user_id: FK para usuarios(id)
- titulo_id: "campeao_2025_01", "vice_campeao_2025_02"
- titulo_nome: "Campeão", "Vice-Campeão"
- titulo_icone: Emoji (👑, 🥈, etc.)
- temporada_id: Temporada que conquistou
- posicao_conquistada: Posição que ganhou o título
- ativo: Se está sendo exibido
```

**Uso:** Gerencia títulos permanentes dos jogadores.

---

### 6. **pvp_recompensas_pendentes**
Recompensas não coletadas.

```sql
- user_id: FK para usuarios(id)
- temporada_id: Temporada da recompensa
- moedas: Quantidade de moedas
- fragmentos: Quantidade de fragmentos
- avatar_lendario: Boolean
- avatar_raro: Boolean
- titulo_id: ID do título a conceder
- coletada: Boolean
- data_coleta: Quando foi coletada
```

**Uso:** Sistema de "cofre" para recompensas de fim de temporada.

---

## 📊 Views

### **leaderboard_atual**
Leaderboard completo da temporada ativa, com posição calculada.

```sql
SELECT * FROM leaderboard_atual;
```

Retorna:
- posicao (ROW_NUMBER calculado)
- user_id, nome_usuario
- fama, vitorias, derrotas
- streak, streak_maximo
- win_rate (%)
- temporada_id, temporada_nome

### **top_100_atual**
Top 100 jogadores.

```sql
SELECT * FROM top_100_atual;
```

### **estatisticas_jogador**
Stats completos de um jogador (todas as temporadas).

```sql
SELECT * FROM estatisticas_jogador WHERE user_id = 123;
```

Retorna:
- fama_atual
- vitorias_total, derrotas_total (soma de todas as temporadas)
- melhor_fama, melhor_streak, melhor_posicao
- temporadas_jogadas
- total_titulos

---

## ⚙️ Funções

### 1. **criar_nova_temporada()**
Cria uma nova temporada automaticamente.

```sql
SELECT criar_nova_temporada();
```

**Execução:** Rodar todo dia 1 do mês (cron job).

**O que faz:**
- Desativa temporada anterior
- Cria nova temporada com ID "YYYY-MM"
- Define data_inicio e data_fim

---

### 2. **encerrar_temporada()**
Encerra a temporada atual e salva histórico.

```sql
SELECT encerrar_temporada();
```

**Execução:** Rodar automaticamente no último dia do mês.

**O que faz:**
- Para cada jogador que batalhou:
  - Salva histórico em `pvp_historico_temporadas`
  - Calcula posição final no leaderboard
  - Determina tier final
  - Se top 100, gera recompensas
- Desativa a temporada

---

### 3. **gerar_recompensas_temporada()**
Gera recompensas baseado na posição.

```sql
SELECT gerar_recompensas_temporada(user_id, temporada_id, posicao);
```

**Recompensas:**
- 1º: 5000 moedas, 50 fragmentos, avatar lendário, título "Campeão"
- 2º-3º: 3000 moedas, 30 fragmentos, avatar raro, título
- 4º-10º: 1500 moedas, 20 fragmentos, título "Elite Top 10"
- 11º-50º: 800 moedas, 10 fragmentos
- 51º-100º: 400 moedas, 5 fragmentos

---

### 4. **atualizar_ranking_apos_batalha()**
Atualiza ranking de ambos os jogadores após batalha.

```sql
SELECT atualizar_ranking_apos_batalha(
  'temporada_id',
  jogador1_id,
  jogador2_id,
  vencedor_id,
  jogador1_fama_ganho,
  jogador2_fama_ganho
);
```

**O que faz:**
- Atualiza fama (não permite negativo)
- Incrementa vitórias/derrotas
- Atualiza streak (reseta se perder)
- Atualiza streak_maximo se necessário
- Registra ultima_batalha

---

## 🔄 Fluxo de Trabalho

### **Início de Nova Temporada (Dia 1 do Mês)**

```sql
-- 1. Encerrar temporada anterior
SELECT encerrar_temporada();

-- 2. Criar nova temporada
SELECT criar_nova_temporada();
```

**Automatizar com cron:**
```cron
0 0 1 * * psql -U usuario -d database -c "SELECT encerrar_temporada(); SELECT criar_nova_temporada();"
```

---

### **Após Uma Batalha PvP**

```sql
-- 1. Registrar batalha no log (opcional)
INSERT INTO pvp_batalhas_log (...) VALUES (...);

-- 2. Atualizar ranking
SELECT atualizar_ranking_apos_batalha(...);

-- 3. Atualizar stats do avatar (XP, moedas, etc.)
-- (isso você já tem nas suas APIs)
```

---

### **Buscar Leaderboard**

```sql
-- Top 100
SELECT * FROM top_100_atual;

-- Leaderboard completo
SELECT * FROM leaderboard_atual;

-- Posição de um jogador específico
SELECT posicao, fama, vitorias, derrotas, win_rate
FROM leaderboard_atual
WHERE user_id = 123;

-- Jogadores próximos ao jogador
SELECT * FROM leaderboard_atual
WHERE posicao BETWEEN
  (SELECT posicao - 10 FROM leaderboard_atual WHERE user_id = 123) AND
  (SELECT posicao + 10 FROM leaderboard_atual WHERE user_id = 123);
```

---

### **Coletar Recompensas de Fim de Temporada**

```sql
-- 1. Buscar recompensas pendentes
SELECT * FROM pvp_recompensas_pendentes
WHERE user_id = 123 AND coletada = false;

-- 2. Dar as recompensas ao jogador
UPDATE usuarios
SET moedas = moedas + r.moedas,
    fragmentos = fragmentos + r.fragmentos
FROM pvp_recompensas_pendentes r
WHERE usuarios.id = r.user_id
AND r.user_id = 123 AND r.coletada = false;

-- 3. Marcar como coletada
UPDATE pvp_recompensas_pendentes
SET coletada = true, data_coleta = NOW()
WHERE user_id = 123 AND coletada = false;

-- 4. Se tem título, ativar
INSERT INTO pvp_titulos (...)
SELECT ... FROM pvp_recompensas_pendentes WHERE ...;
```

---

## 🚀 Como Usar

### **Passo 1: Executar o SQL**

```bash
psql -U seu_usuario -d seu_database -f pvp_system.sql
```

Ou copie e cole no pgAdmin / Supabase SQL Editor.

---

### **Passo 2: Criar Primeira Temporada**

```sql
SELECT criar_nova_temporada();
```

---

### **Passo 3: Quando Jogador Entra no PvP pela Primeira Vez**

```sql
INSERT INTO pvp_rankings (user_id, temporada_id, fama, vitorias, derrotas, streak)
SELECT
  123, -- user_id
  temporada_id,
  1000, -- fama inicial
  0, 0, 0 -- vitorias, derrotas, streak
FROM pvp_temporadas
WHERE ativa = true
ON CONFLICT (user_id, temporada_id) DO NOTHING;
```

---

### **Passo 4: Após Cada Batalha**

```sql
-- Exemplo: Jogador 1 venceu e ganhou 25 de fama, Jogador 2 perdeu 15
SELECT atualizar_ranking_apos_batalha(
  (SELECT temporada_id FROM pvp_temporadas WHERE ativa = true LIMIT 1),
  123, -- jogador1_id
  456, -- jogador2_id
  123, -- vencedor_id
  25,  -- jogador1_fama_ganho
  -15  -- jogador2_fama_ganho (negativo = perda)
);
```

---

### **Passo 5: Fim do Mês (Automatizar)**

```sql
-- Último dia do mês às 23:59
SELECT encerrar_temporada();

-- Dia 1 do novo mês às 00:00
SELECT criar_nova_temporada();
```

---

## 📋 Queries Úteis

### **Buscar Posição do Jogador**
```sql
SELECT posicao, fama, vitorias, derrotas, streak, win_rate
FROM leaderboard_atual
WHERE user_id = 123;
```

### **Histórico do Jogador**
```sql
SELECT
  temporada_id,
  fama_final,
  posicao_final,
  tier_final,
  vitorias,
  derrotas
FROM pvp_historico_temporadas
WHERE user_id = 123
ORDER BY data_encerramento DESC
LIMIT 12;
```

### **Títulos do Jogador**
```sql
SELECT titulo_nome, titulo_icone, temporada_id, posicao_conquistada
FROM pvp_titulos
WHERE user_id = 123
ORDER BY data_conquista DESC;
```

### **Distribuição de Jogadores por Tier**
```sql
SELECT
  CASE
    WHEN fama >= 3500 THEN 'LENDARIO'
    WHEN fama >= 2500 THEN 'DIAMANTE'
    WHEN fama >= 1800 THEN 'PLATINA'
    WHEN fama >= 1400 THEN 'OURO'
    WHEN fama >= 1200 THEN 'PRATA'
    ELSE 'BRONZE'
  END AS tier,
  COUNT(*) as total_jogadores
FROM pvp_rankings
WHERE temporada_id = (SELECT temporada_id FROM pvp_temporadas WHERE ativa = true)
GROUP BY tier
ORDER BY MIN(fama) DESC;
```

---

## 🔐 Segurança

- Todas as FKs têm `ON DELETE CASCADE` ou `ON DELETE SET NULL`
- Constraints impedem fama negativa
- UNIQUE constraints previnem duplicatas
- Índices otimizam queries do leaderboard

---

## 📈 Performance

**Índices criados:**
- `idx_rankings_fama` - Ordenação do leaderboard
- `idx_rankings_temporada_fama` - Leaderboard por temporada
- `idx_batalhas_data` - Buscar batalhas recentes
- `idx_recompensas_pendentes` - Recompensas não coletadas

**Views materializadas** (opcional para MUITO alto volume):
```sql
CREATE MATERIALIZED VIEW leaderboard_cache AS
SELECT * FROM leaderboard_atual;

-- Atualizar a cada 5 minutos
CREATE INDEX ON leaderboard_cache(posicao);
REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
```

---

## 📝 Notas

1. **localStorage → Database:** O sistema atual usa localStorage. Em produção, substitua pelas queries SQL.

2. **API Endpoints Necessários:**
   - `GET /api/pvp/leaderboard` - Busca top 100
   - `GET /api/pvp/ranking/:userId` - Busca ranking do jogador
   - `POST /api/pvp/batalha` - Registra resultado de batalha
   - `GET /api/pvp/recompensas/:userId` - Busca recompensas pendentes
   - `POST /api/pvp/recompensas/coletar` - Coleta recompensas

3. **Cron Jobs:**
   - Dia 1, 00:00: `criar_nova_temporada()`
   - Último dia, 23:59: `encerrar_temporada()`

---

## ✅ Checklist de Implementação

- [ ] Executar `pvp_system.sql` no banco
- [ ] Criar primeira temporada
- [ ] Criar API endpoint para leaderboard
- [ ] Criar API endpoint para batalhas
- [ ] Substituir localStorage por API calls
- [ ] Configurar cron jobs para temporadas
- [ ] Testar fluxo completo
- [ ] Implementar coleta de recompensas

---

**Criado para:** Portal Hunter Awakening
**Data:** 2025-01
**Versão:** 1.0
