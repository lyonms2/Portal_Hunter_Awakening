# 📋 APIs Restantes que Ainda Usam Supabase

## ⚔️ IMPORTANTE: Dois Sistemas PvP Diferentes!
- 🎯 **Treino PvP** (antes "PvP IA"): Batalhas assíncronas contra avatares de outros players (controlados por IA localmente)
- 🔥 **Arena PvP** (tempo real): Batalhas síncronas ao vivo, jogador vs jogador

Ambos usam o mesmo ranking e temporada!

## ✅ Já Migradas para Firestore:
- ✅ Authentication (login, cadastro)
- ✅ Story Mode (save, load, reset)
- ✅ Mercado/Trade (listar, vender, comprar)
- ✅ Sistema de Avatares (inicializar, invocar, meus-avatares, atualizar)
- ✅ PvP Ranking (ranking, batalha - usado por ambos os modos)
- ✅ Treino PvP (oponentes, finalizar - batalhas assíncronas)
- ✅ Arena PvP (queue, battle/room, battle/action - batalhas tempo real)
- ✅ Sistema de Inventário (inventário, usar item, loja, comprar)

---

## ⚠️ AINDA USANDO SUPABASE (16 arquivos):

### 🟡 **PRIORIDADE ALTA** (Funcionalidades Secundárias):

#### 1. **PvP - Funcionalidades Extras**
- `/api/pvp/historico` - Histórico de batalhas
- `/api/pvp/leaderboard` - Leaderboard geral PvP
- `/api/pvp/ia/leaderboard` - Leaderboard PvP IA
- `/api/pvp/titulos` - Sistema de títulos
- `/api/pvp/recompensas` (GET) - Ver recompensas disponíveis
- `/api/pvp/recompensas/coletar` (POST) - Coletar recompensas

#### 2. **Gestão de Temporadas**
- `/api/pvp/temporada` (GET) - Ver temporada ativa
- `/api/pvp/temporada/encerrar` (POST) - Encerrar temporada

---

### 🟢 **PRIORIDADE BAIXA** (Pode Esperar):

#### 3. **Arena/Treino**
- `/api/arena/treino/iniciar` - Iniciar treino na arena

---

## 📊 Estatísticas:

- **Total de APIs**: ~50
- **Já Migradas**: 34 (68%)
- **Faltam Migrar**: 16 (32%)

---

## 🎯 Sugestão de Ordem de Migração:

### ✅ **Fase 7** - Gestão de Avatar (4 APIs) - CONCLUÍDA
### ✅ **Fase 8** - Avatar Avançado (4 APIs) - CONCLUÍDA
### ✅ **Fase 9** - Inventário (4 APIs) - CONCLUÍDA

### **Fase 10** - PvP Extras (8 APIs)
1. Leaderboards
2. Histórico
3. Títulos
4. Recompensas
5. Temporadas

### **Fase 11** - Arena/Outros (1 API)
1. `/api/arena/treino/iniciar`

---

## ✅ Quando Tudo Estiver Migrado:

- 🔥 **100% Firebase/Firestore**
- ❌ **0% Supabase**
- 🚀 **Sistema completamente unificado**

---

**Quer que eu continue migrando? Qual fase quer fazer primeiro?**
