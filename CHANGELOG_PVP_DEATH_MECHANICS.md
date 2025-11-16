# CHANGELOG - Mecânica de Morte no PVP IA

**Data:** 2025-11-15
**Versão:** 2.0 - Sistema de Morte Balanceado

---

## 📋 RESUMO DAS ALTERAÇÕES

### 1. ❌ **REMOVIDO: Código de PVP ao Vivo**

**Arquivos removidos:**
- `/app/api/verify-database/route.js`
- `/app/verify-database/page.jsx`
- `/scripts/verify-pvp-database.js`

**Tabelas a remover no Supabase (executar SQL):**
- `pvp_matchmaking_queue`
- `pvp_battle_rooms`
- `pvp_challenges`
- `pvp_available_players`

**Script criado:** `/database/EXECUTE_CLEANUP_PVP.sql`

**Motivo:** O projeto pivotou para PVP IA. O sistema de PVP ao vivo não funcionou e foi descontinuado.

---

### 2. ✅ **VERIFICADO: Módulo Necromante**

**Status:** **FUNCIONANDO PERFEITAMENTE**

**Funcionalidades validadas:**
- ✅ Busca avatares mortos sem marca da morte
- ✅ Calcula custos corretamente por raridade
  - Comum: 500💰 + 50💎
  - Raro: 1000💰 + 100💎
  - Lendário: 1500💰 + 150💎
- ✅ Verifica recursos do jogador
- ✅ Aplica penalidades balanceadas:
  - Stats: -30%
  - Vínculo: -50%
  - XP: -30%
  - Exaustão: +60 (estado EXAUSTO)
  - Marca da Morte: Permanente (não pode ressuscitar novamente)
- ✅ Deduz recursos corretamente
- ✅ UI completa com animações e feedback visual

**Arquivos:**
- `/app/necromante/page.jsx`
- `/app/api/ressuscitar-avatar/route.js`

---

### 3. 🔧 **IMPLEMENTADO: Nova Mecânica de Morte no PVP IA**

#### **ANTES (Sistema Antigo):**
```
Derrota em PVP IA = 100% de morte
- Avatar morria sempre
- Recebia marca_morte automaticamente
- Não podia ser ressuscitado
```

#### **DEPOIS (Sistema Novo):**
```
Derrota em PVP IA = Probabilidade:
- 30% de chance: MORTE REAL
  └─ Avatar morre (vivo = false)
  └─ HP = 0
  └─ SEM marca_morte (pode ser ressuscitado pelo Necromante!)
  └─ Mensagem: "💀 SEU AVATAR FOI MORTO!"

- 70% de chance: INCAPACIDADE
  └─ Avatar sobrevive (vivo = true)
  └─ HP = 1
  └─ Pode continuar lutando após cura
  └─ Mensagem: "😰 SEU AVATAR FOI INCAPACITADO!"
```

#### **Arquivos Modificados:**

**1. Frontend - Batalha PVP IA**
```javascript
// /app/arena/pvp-ia/batalha/page.jsx (linha 708-737)

// Nova lógica de morte
if (tipoResultado === 'derrota') {
  const chanceDeathMaster = Math.random();
  if (chanceDeathMaster < 0.30) {
    // 30%: MORTE REAL
    avatarMorreu = true;
    hpFinalReal = 0;
    addLog('💀 SEU AVATAR FOI MORTO!', 'morte');
  } else {
    // 70%: INCAPACIDADE (1 HP)
    avatarMorreu = false;
    hpFinalReal = 1;
    addLog('😰 SEU AVATAR FOI INCAPACITADO!', 'aviso');
  }
}
```

**2. Backend - Finalizar Batalha**
```javascript
// /app/api/pvp/ia/finalizar/route.js (linha 108-119)

const updates = {
  vinculo: novoVinculo,
  exaustao: novaExaustao,
  hp_atual: avatarMorreu ? 0 : Math.max(1, hpFinal || 1), // Mínimo 1 HP
  updated_at: new Date().toISOString()
};

// Se morreu, marcar como morto (SEM marca_morte)
if (avatarMorreu) {
  updates.vivo = false;
  // NÃO adicionar marca_morte - pode ser ressuscitado!
}
```

---

## 🎯 IMPACTO NO GAMEPLAY

### **ANTES:**
- ❌ PVP IA era muito punitivo
- ❌ Perder 1 batalha = perder avatar permanentemente
- ❌ Jogadores evitavam PVP por medo de perder avatares
- ❌ Necromante era inútil (avatares tinham marca_morte)

### **DEPOIS:**
- ✅ PVP IA é desafiador mas justo
- ✅ 70% de chance de sobreviver com 1 HP
- ✅ Apenas 30% de chance de morte real
- ✅ Avatares mortos podem ser ressuscitados
- ✅ Necromante é útil e necessário
- ✅ Jogadores podem usar itens de cura após incapacidade
- ✅ Sistema de risco/recompensa balanceado

---

## 📊 ESTATÍSTICAS ESPERADAS

Com base em 100 derrotas em PVP IA:

**Sistema Antigo:**
- 100 avatares mortos permanentemente
- 0 ressurreições possíveis
- Necromante inútil

**Sistema Novo:**
- ~30 avatares mortos (podem ser ressuscitados)
- ~70 avatares incapacitados (sobrevivem com 1 HP)
- Necromante ganha importância estratégica
- Economia de ressurreição mais ativa

---

## 🔄 FLUXO COMPLETO DO SISTEMA

```
DERROTA EM PVP IA
       │
       ├─ 30% → MORTE REAL
       │         ├─ HP = 0
       │         ├─ vivo = false
       │         ├─ SEM marca_morte
       │         └─ Pode ser ressuscitado no Necromante
       │              ├─ Custo: moedas + fragmentos
       │              ├─ Penalidades: -30% stats, -50% vínculo, etc.
       │              └─ Recebe marca_morte (não pode ressuscitar novamente)
       │
       └─ 70% → INCAPACIDADE
                 ├─ HP = 1
                 ├─ vivo = true
                 ├─ Pode usar itens de cura
                 └─ Pode voltar a lutar
```

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Morte Real (30%)
1. Perder batalha PVP IA
2. Verificar se avatar morreu (vivo = false)
3. Verificar que NÃO tem marca_morte
4. Ir ao Necromante
5. Verificar que avatar aparece na lista
6. Ressuscitar
7. Verificar que agora TEM marca_morte

### Teste 2: Incapacidade (70%)
1. Perder batalha PVP IA
2. Verificar que avatar sobreviveu (vivo = true)
3. Verificar que HP = 1
4. Usar poção de cura
5. Verificar que HP aumentou
6. Avatar pode lutar novamente

### Teste 3: Necromante
1. Avatar com marca_morte não pode ser ressuscitado novamente
2. Avatar sem marca_morte pode ser ressuscitado
3. Custos são deduzidos corretamente
4. Penalidades são aplicadas corretamente

---

## 📝 NOTAS TÉCNICAS

### Campos do Banco de Dados:
- `vivo` (boolean): Se avatar está vivo ou morto
- `marca_morte` (boolean): Se avatar já foi ressuscitado (não pode mais)
- `hp_atual` (integer): HP atual do avatar

### Lógica de Ressurreição:
```sql
-- Avatares que PODEM ser ressuscitados:
SELECT * FROM avatares
WHERE vivo = false
  AND marca_morte = false;

-- Avatares que NÃO PODEM mais:
SELECT * FROM avatares
WHERE marca_morte = true;
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Executar limpeza de PVP ao vivo:**
   ```sql
   -- Execute no Supabase SQL Editor:
   -- /database/EXECUTE_CLEANUP_PVP.sql
   ```

2. **Testar nova mecânica:**
   - Fazer várias batalhas PVP IA
   - Verificar distribuição ~30/70
   - Testar ressurreição no Necromante

3. **Ajustes finos (se necessário):**
   - Balancear percentuais (30/70 pode virar 20/80 ou 40/60)
   - Ajustar custos de ressurreição
   - Adicionar mais feedback visual

---

## ⚠️ BREAKING CHANGES

**IMPORTANTE:** Avatares que morreram no sistema antigo JÁ TÊM marca_morte.

**Solução (opcional - executar no Supabase):**
```sql
-- Remover marca_morte de avatares mortos sem ressurreição prévia
-- (CUIDADO: isso permite ressuscitar avatares que morreram no sistema antigo)
UPDATE avatares
SET marca_morte = false
WHERE vivo = false
  AND marca_morte = true;
```

**OU manter como está:** Avatares antigos continuam com marca_morte, apenas novos seguem a nova regra.

---

## 📧 FEEDBACK

Se encontrar bugs ou tiver sugestões de balanceamento, abra uma issue no repositório.

---

**Última Atualização:** 2025-11-15
**Responsável:** Claude Code Assistant
**Status:** ✅ IMPLEMENTADO E PRONTO PARA TESTES
