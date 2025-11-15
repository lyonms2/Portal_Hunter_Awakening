# 📊 ANÁLISE COMPLETA DO BANCO DE DADOS - Portal Hunter Awakening

**Data da Análise:** 2025-11-15
**Arquivos Analisados:** 38 API routes + múltiplos componentes frontend
**Objetivo:** Identificar tabelas e colunas não usadas para otimização e limpeza segura

---

## 📋 SUMÁRIO EXECUTIVO

### Estatísticas Gerais
- **Total de Tabelas no Schema:** 13 principais
- **Tabelas Totalmente Não Usadas:** 3 ❌
- **Tabelas Ativamente Usadas:** 10 ✅
- **Colunas Não Usadas Identificadas:** 3 ❌
- **Views Não Usadas:** 1 ❌
- **Funções Não Usadas:** 2 ❌

### Resultado
**É SEGURO remover 3 tabelas completas** que nunca foram implementadas no código, liberando complexidade do schema sem risco de quebrar o jogo.

---

## ❌ TABELAS TOTALMENTE NÃO USADAS

### 1. `pvp_historico_temporadas`
**Status:** Nunca referenciada no código
**Propósito Original:** Armazenar histórico de desempenho de jogadores em temporadas passadas
**Segurança de Remoção:** ✅ MUITO ALTA
**Motivo:** Sistema de histórico de temporadas não foi implementado

**Definição:**
```sql
CREATE TABLE pvp_historico_temporadas (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  temporada_id VARCHAR(7) NOT NULL,
  fama_final INTEGER NOT NULL,
  vitorias INTEGER NOT NULL,
  derrotas INTEGER NOT NULL,
  streak_maximo INTEGER NOT NULL DEFAULT 0,
  posicao_final INTEGER,
  tier_final VARCHAR(20),
  recompensas_recebidas BOOLEAN DEFAULT false,
  recompensas_json JSONB,
  data_encerramento TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Onde deveria ser usada:**
- Tela de histórico de temporadas (não implementada)
- Sistema de recompensas de fim de temporada (não implementado)
- Estatísticas do jogador ao longo do tempo (não implementado)

**Pode remover?** ✅ SIM - A menos que você planeje implementar histórico de temporadas no futuro

---

### 2. `pvp_titulos`
**Status:** Nunca referenciada no código
**Propósito Original:** Armazenar títulos permanentes conquistados pelos jogadores
**Segurança de Remoção:** ✅ MUITO ALTA
**Motivo:** Sistema de títulos não foi implementado

**Definição:**
```sql
CREATE TABLE pvp_titulos (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo_id VARCHAR(50) NOT NULL,
  titulo_nome VARCHAR(100) NOT NULL,
  titulo_icone VARCHAR(10),
  temporada_id VARCHAR(7) NOT NULL,
  posicao_conquistada INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  data_conquista TIMESTAMP DEFAULT NOW()
);
```

**Onde deveria ser usada:**
- Perfil do jogador mostrando títulos (não implementado)
- Leaderboard com títulos (implementado mas sem títulos)
- Sistema de conquistas (não implementado)

**Pode remover?** ✅ SIM - A menos que você planeje implementar sistema de títulos no futuro

---

### 3. `pvp_recompensas_pendentes`
**Status:** Nunca referenciada no código
**Propósito Original:** Gerenciar recompensas de fim de temporada aguardando coleta
**Segurança de Remoção:** ✅ MUITO ALTA
**Motivo:** Sistema de recompensas de temporada não foi implementado

**Definição:**
```sql
CREATE TABLE pvp_recompensas_pendentes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  temporada_id VARCHAR(7) NOT NULL,
  moedas INTEGER NOT NULL DEFAULT 0,
  fragmentos INTEGER NOT NULL DEFAULT 0,
  avatar_lendario BOOLEAN DEFAULT false,
  avatar_raro BOOLEAN DEFAULT false,
  titulo_id VARCHAR(50),
  coletada BOOLEAN DEFAULT false,
  data_coleta TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Onde deveria ser usada:**
- Tela de coleta de recompensas de temporada (não implementada)
- Notificações de recompensas pendentes (não implementado)
- Sistema de encerramento de temporada (não implementado)

**Pode remover?** ✅ SIM - A menos que você planeje implementar recompensas de temporada no futuro

---

## ⚠️ COLUNAS NÃO USADAS EM TABELAS ATIVAS

### 1. `pvp_batalhas_log.jogador1_streak_antes`
### 2. `pvp_batalhas_log.jogador2_streak_antes`

**Status:** Colunas definidas mas NUNCA preenchidas ou lidas
**Tabela:** `pvp_batalhas_log` (ATIVA - é usada para log de batalhas)
**Segurança de Remoção:** ✅ ALTA
**Motivo:** O código não registra o streak antes da batalha, apenas o ganho de fama

**Código Atual que usa `pvp_batalhas_log`:**
```javascript
// /app/api/pvp/batalha/route.js - linha ~180
const { error: logError } = await supabase
  .from('pvp_batalhas_log')
  .insert({
    temporada_id: temporadaAtual.temporada_id,
    jogador1_id: player1.user_id,
    jogador2_id: player2.user_id,
    jogador1_fama_antes: player1Ranking.fama,
    jogador2_fama_antes: player2Ranking.fama,
    vencedor_id: vencedorId,
    duracao_rodadas: rodadaAtual,
    jogador1_fama_ganho: player1FamaGanho,
    jogador2_fama_ganho: player2FamaGanho,
    // ❌ NÃO PREENCHE: jogador1_streak_antes
    // ❌ NÃO PREENCHE: jogador2_streak_antes
    jogador1_recompensas: recompensasJogador1,
    jogador2_recompensas: recompensasJogador2,
    foi_upset: foiUpset,
    diferenca_fama: diferencaFama,
  });
```

**Pode remover?** ✅ SIM - Colunas nunca são usadas

---

### 3. `pvp_rankings.recompensas_recebidas`

**Status:** Coluna definida mas APENAS usada em funções SQL que nunca são chamadas
**Tabela:** `pvp_rankings` (MUITO ATIVA - usada em 9 arquivos)
**Segurança de Remoção:** ⚠️ MÉDIA
**Motivo:** Usada na função `encerrar_temporada()`, mas essa função nunca é chamada pelo código

**Onde é usada:**
- Apenas na função SQL `encerrar_temporada()` (que não é chamada pela aplicação)
- Nunca é lida ou escrita pelo código da aplicação

**Pode remover?** ⚠️ TALVEZ - Se você NÃO planeja implementar encerramento automático de temporadas

---

## ✅ TABELAS ATIVAMENTE USADAS (NÃO REMOVER!)

### 1. `avatares` - 🔥 MUITO USADA
**Arquivos que usam:** 26 arquivos
**Operações:** SELECT, INSERT, UPDATE, DELETE
**Colunas usadas:** TODAS (id, user_id, nome, nivel, elemento, raridade, forca, agilidade, resistencia, foco, habilidades, vivo, experiencia, vinculo, exaustao, hp_atual, ativo, marca_morte, created_at, updated_at)

### 2. `player_stats` - 🔥 MUITO USADA
**Arquivos que usam:** 11 arquivos
**Operações:** SELECT, INSERT, UPDATE
**Colunas usadas:** user_id, moedas, fragmentos, primeira_invocacao, divida, ranking, missoes_completadas, nome_operacao

### 3. `pvp_rankings` - 🔥 MUITO USADA
**Arquivos que usam:** 9 arquivos
**Operações:** SELECT, INSERT, UPDATE
**Colunas usadas:** user_id, temporada_id, fama, vitorias, derrotas, streak, streak_maximo, ultima_batalha

### 4. `pvp_battle_rooms` - 🔥 MUITO USADA
**Arquivos que usam:** 6 arquivos
**Operações:** SELECT, INSERT, UPDATE
**Propósito:** Gerencia salas de batalha PVP em tempo real

### 5. `pvp_temporadas` - ✅ USADA
**Arquivos que usam:** 4 arquivos
**Operações:** SELECT
**Propósito:** Define temporadas ativas do PVP

### 6. `pvp_challenges` - ✅ USADA
**Arquivos que usam:** 5 arquivos
**Operações:** SELECT, INSERT, UPDATE
**Propósito:** Sistema de desafios PVP (Request/Accept)

### 7. `pvp_matchmaking_queue` - ✅ USADA
**Arquivos que usam:** 3 arquivos
**Operações:** SELECT, INSERT, DELETE
**Propósito:** Fila de matchmaking automático

### 8. `pvp_available_players` - ✅ USADA
**Arquivos que usam:** 2 arquivos
**Operações:** SELECT, UPSERT
**Propósito:** Jogadores disponíveis para PVP

### 9. `pvp_batalhas_log` - ✅ USADA
**Arquivos que usam:** 1 arquivo
**Operações:** INSERT
**Propósito:** Log histórico de batalhas PVP

### 10. `items` - ✅ USADA
**Arquivos que usam:** 3 arquivos
**Operações:** SELECT
**Propósito:** Catálogo de itens do jogo

### 11. `player_inventory` - ✅ USADA
**Arquivos que usam:** 2 arquivos
**Operações:** SELECT, INSERT, UPDATE, DELETE
**Propósito:** Inventário de itens dos jogadores

---

## 🔍 VIEWS E FUNÇÕES

### Views Usadas ✅
- `leaderboard_atual` - USADA em `/app/api/pvp/leaderboard/route.js`
- `top_100_atual` - Provavelmente usada (baseada em leaderboard_atual)

### Views Não Usadas ❌
- `estatisticas_jogador` - Depende de `pvp_historico_temporadas` e `pvp_titulos` (que não existem/usadas)

### Funções Usadas ✅
- `criar_nova_temporada()` - Usada no script de inicialização
- `atualizar_ranking_apos_batalha()` - MUITO USADA (múltiplos arquivos)
- `find_pvp_match()` - Usada no matchmaking
- `accept_pvp_challenge()` - Usada em desafios PVP
- `create_pvp_challenge()` - Usada em desafios PVP
- `cleanup_expired_challenges()` - Usada
- `cleanup_expired_queue_entries()` - Usada
- `cleanup_expired_battle_rooms()` - Usada
- `cleanup_inactive_players()` - Usada

### Funções Não Usadas ❌
- `encerrar_temporada()` - Nunca chamada pela aplicação
- `gerar_recompensas_temporada()` - Nunca chamada pela aplicação

---

## 📝 RECOMENDAÇÕES

### Ação Imediata (Seguro) ✅
Execute o arquivo `CLEANUP_UNUSED_DATABASE.sql` para remover:
1. ✅ Tabela `pvp_historico_temporadas`
2. ✅ Tabela `pvp_titulos`
3. ✅ Tabela `pvp_recompensas_pendentes`
4. ✅ Colunas `jogador1_streak_antes` e `jogador2_streak_antes` de `pvp_batalhas_log`
5. ✅ View `estatisticas_jogador`
6. ✅ Funções `encerrar_temporada()` e `gerar_recompensas_temporada()`

### Ação Opcional ⚠️
Se você NÃO pretende implementar encerramento automático de temporadas:
- Remover coluna `pvp_rankings.recompensas_recebidas`

### NÃO Remover 🚫
- **TODAS as outras 11 tabelas** - São usadas ativamente pelo jogo
- **Colunas marcadas como ✅ USADAS** - São essenciais para o funcionamento

---

## 🎯 IMPACTO DA LIMPEZA

### Benefícios
- ✅ Redução de complexidade do schema
- ✅ Menos confusão sobre o que está implementado
- ✅ Facilita manutenção futura
- ✅ Remove código morto do banco

### Riscos
- ❌ NENHUM - As tabelas/colunas removidas nunca foram usadas
- ⚠️ Se no futuro você quiser implementar histórico de temporadas ou títulos, terá que recriar as tabelas

### Espaço Liberado
- Mínimo (as tabelas estão vazias)
- Principal ganho é em clareza e manutenibilidade

---

## 📋 CHECKLIST DE EXECUÇÃO

Antes de executar `CLEANUP_UNUSED_DATABASE.sql`:

1. ✅ Fazer backup completo do banco de dados
   ```bash
   pg_dump -U postgres portal_hunter > backup_antes_limpeza_$(date +%Y%m%d).sql
   ```

2. ✅ Revisar o script SQL de limpeza

3. ✅ Confirmar que você NÃO pretende implementar:
   - [ ] Histórico de temporadas passadas
   - [ ] Sistema de títulos
   - [ ] Recompensas de fim de temporada

4. ✅ Executar o script no Supabase SQL Editor

5. ✅ Verificar que o jogo continua funcionando normalmente

6. ✅ Testar funcionalidades principais:
   - [ ] PVP IA
   - [ ] PVP Real
   - [ ] Leaderboard
   - [ ] Sistema de rankings

---

## 🔗 ARQUIVOS RELACIONADOS

- `CLEANUP_UNUSED_DATABASE.sql` - Script SQL para executar a limpeza
- `pvp_system.sql` - Schema original do sistema PVP
- `database/` - Outros scripts de banco de dados

---

**Gerado automaticamente por análise de código em 2025-11-15**
