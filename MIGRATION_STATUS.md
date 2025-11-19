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
- ✅ PvP Extras (leaderboards, histórico, títulos, recompensas, temporadas)

---

## ⚠️ AINDA USANDO SUPABASE (1 arquivo):

### 🟢 **PRIORIDADE BAIXA** (Pode Esperar):

#### 1. **Arena/Treino**
- `/api/arena/treino/iniciar` - Iniciar treino na arena

---

## 📊 Estatísticas:

- **Total de APIs**: ~50
- **Já Migradas**: 42 (84%)
- **Faltam Migrar**: 1 (2%)

---

## 🎯 Sugestão de Ordem de Migração:

### ✅ **Fase 7** - Gestão de Avatar (4 APIs) - CONCLUÍDA
### ✅ **Fase 8** - Avatar Avançado (4 APIs) - CONCLUÍDA
### ✅ **Fase 9** - Inventário (4 APIs) - CONCLUÍDA
### ✅ **Fase 10** - PvP Extras (8 APIs) - CONCLUÍDA

### **Fase 11** - Arena/Treino (1 API) - PENDENTE
1. `/api/arena/treino/iniciar` - Treino de arena

---

## ✅ Quando Tudo Estiver Migrado:

- 🔥 **100% Firebase/Firestore**
- ❌ **0% Supabase**
- 🚀 **Sistema completamente unificado**

---

**Quer que eu continue migrando? Qual fase quer fazer primeiro?**
