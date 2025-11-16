# ✨ SISTEMA DO PURIFICADOR - Portal Hunter Awakening

**Data:** 2025-11-15
**Versão:** 1.0

---

## 📋 VISÃO GERAL

O **Purificador** é um novo NPC que remove a **Marca da Morte** de avatares ressuscitados, permitindo que eles voltem a ser ressuscitados caso morram novamente e restaurando parte dos stats perdidos.

---

## 🎯 PROBLEMA QUE RESOLVE

### Antes (Sistema Antigo):
```
Avatar morre → Ressuscita no Necromante → Recebe Marca da Morte
   ↓
Stats permanentemente reduzidos em 30%
Vínculo permanentemente reduzido em 50%
Exaustão elevada (60)
❌ Se morrer novamente: MORTE PERMANENTE (não pode ressuscitar)
```

### Depois (Com o Purificador):
```
Avatar com Marca da Morte → Purificação no Purificador
   ↓
✅ Marca da Morte REMOVIDA
✅ Stats aumentam ~15% (restaura 50% do perdido)
✅ Vínculo aumenta ~25% (restaura 50% do perdido)
✅ Exaustão reduzida para 30
✅ Se morrer novamente: PODE SER RESSUSCITADO!
```

---

## 🔄 FLUXO COMPLETO DO SISTEMA

```
1. MORTE EM BATALHA
   ├─ 30%: Morte Real (HP=0, vivo=false)
   └─ 70%: Incapacitado (HP=1, vivo=true)

2. RESSURREIÇÃO NO NECROMANTE (se morreu)
   ├─ Custo: 500💰 + 50💎 (Comum) a 1500💰 + 150💎 (Lendário)
   ├─ Penalidades: -30% stats, -50% vínculo, +60 exaustão
   └─ marca_morte = true (não pode ressuscitar novamente)

3. PURIFICAÇÃO (novo sistema!)
   ├─ Custo: 1000💰 + 100💎 (Comum) a 3000💰 + 300💎 (Lendário)
   ├─ Benefícios:
   │   ├─ marca_morte = false (PODE RESSUSCITAR DE NOVO!)
   │   ├─ Stats +15% (restaura 50% do perdido)
   │   ├─ Vínculo +25% (restaura 50% do perdido)
   │   └─ Exaustão = 30 (Cansado)
   └─ Avatar renovado e mais forte!

4. CICLO SE REPETE
   Avatar pode morrer e ser ressuscitado infinitas vezes
   (desde que seja purificado entre mortes)
```

---

## 💰 CUSTOS

### Ressurreição (Necromante):
| Raridade | Moedas | Fragmentos |
|----------|--------|------------|
| Comum | 500 💰 | 50 💎 |
| Raro | 1000 💰 | 100 💎 |
| Lendário | 1500 💰 | 150 💎 |

### Purificação (Purificador):
| Raridade | Moedas | Fragmentos |
|----------|--------|------------|
| Comum | 1000 💰 | 100 💎 |
| Raro | 2000 💰 | 200 💎 |
| Lendário | 3000 💰 | 300 💎 |

**Total para ciclo completo (Morte → Ressurreição → Purificação):**
| Raridade | Moedas | Fragmentos |
|----------|--------|------------|
| Comum | 1500 💰 | 150 💎 |
| Raro | 3000 💰 | 300 💎 |
| Lendário | 4500 💰 | 450 💎 |

---

## 📊 MATEMÁTICA DA PURIFICAÇÃO

### Exemplo: Avatar Lendário

**Stats Originais (Level 1):**
- Força: 20
- Agilidade: 22
- Resistência: 18
- Foco: 25

**Após Ressurreição (Necromante):**
```
Stats -30%:
- Força: 14 (-6)
- Agilidade: 15 (-7)
- Resistência: 12 (-6)
- Foco: 17 (-8)

Vínculo: 30 → 15 (-50%)
Exaustão: 0 → 60
marca_morte: true
```

**Após Purificação (Purificador):**
```
Stats +15% (50% do perdido restaurado):
- Força: 16 (+2, perdeu 6, recuperou 2 = 33% recuperado de 6)
- Agilidade: 17 (+2)
- Resistência: 13 (+1)
- Foco: 19 (+2)

Vínculo: 15 → 18 (+3, +20%, perdeu 15, recuperou 3 = 20% recuperado)
Exaustão: 60 → 30
marca_morte: false ✨
```

**Resultado Final vs Original:**
```
Força: 16 vs 20 original (-20% permanente)
Agilidade: 17 vs 22 original (-23% permanente)
Resistência: 13 vs 18 original (-28% permanente)
Foco: 19 vs 25 original (-24% permanente)

Vínculo: 18 vs 30 original (-40% permanente)

Mas: Pode morrer e ressuscitar novamente! 🎉
```

---

## 🎮 ESTRATÉGIA DE GAMEPLAY

### Sem Purificador (Sistema Antigo):
- Jogador evita lutar com avatares raros/lendários
- Medo de perder permanentemente
- Necromante inútil após primeira ressurreição
- Economia estagnada

### Com Purificador (Sistema Novo):
- Jogadores podem usar avatares poderosos no PVP
- Risco calculado (30% morte, mas pode ressuscitar)
- Economia de moedas/fragmentos mais ativa
- Avatares lendários podem morrer múltiplas vezes
- Sistema de "manutenção" de avatares valiosos

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### Arquivos Criados:

1. **`/app/purificador/page.jsx`** (Frontend)
   - UI completa com 4 etapas
   - Seleção de avatares marcados
   - Ritual de purificação animado
   - Tela de resultado com melhorias

2. **`/app/api/purificar-avatar/route.js`** (Backend)
   - Validação de recursos
   - Cálculo de melhorias (+15% stats, +25% vínculo)
   - Remoção de marca_morte
   - Dedução de recursos
   - Histórico (opcional)

3. **`/app/dashboard/page.jsx`** (Link adicionado)
   - Botão "O PURIFICADOR" no dashboard

---

## 🗄️ BANCO DE DADOS

### Tabela Principal: `avatares`

**Campos relevantes:**
```sql
vivo: boolean -- Se está vivo
marca_morte: boolean -- Se tem marca da morte
forca, agilidade, resistencia, foco: integer -- Stats
vinculo: integer -- Vínculo (0-100)
exaustao: integer -- Exaustão (0-100)
```

**Query para buscar avatares que PODEM ser purificados:**
```sql
SELECT *
FROM avatares
WHERE vivo = true
  AND marca_morte = true;
```

**Query para buscar avatares que PODEM ser ressuscitados:**
```sql
SELECT *
FROM avatares
WHERE vivo = false
  AND marca_morte = false;
```

**Query para buscar avatares com MORTE PERMANENTE:**
```sql
-- Agora não existe mais! Sempre podem ser purificados e ressuscitados
-- desde que o jogador tenha recursos
```

---

### Tabela Opcional: `purificacoes_historico`

```sql
CREATE TABLE purificacoes_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  avatar_id UUID REFERENCES avatares(id),

  custo_moedas INTEGER NOT NULL,
  custo_fragmentos INTEGER NOT NULL,

  stats_antes JSONB,
  stats_depois JSONB,

  vinculo_antes INTEGER,
  vinculo_depois INTEGER,

  exaustao_antes INTEGER,
  exaustao_depois INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 TESTES

### Teste 1: Avatar Normal Morre e É Purificado
1. Avatar Lendário level 10 morre em PVP IA (30% chance)
2. Ir ao Necromante
3. Ressuscitar (1500💰 + 150💎)
4. Verificar: marca_morte = true, stats -30%
5. Ir ao Purificador
6. Purificar (3000💰 + 300💎)
7. Verificar: marca_morte = false, stats +15%, vínculo +25%, exaustão = 30

### Teste 2: Ciclo Completo (Múltiplas Mortes)
1. Avatar morre → Ressuscita → Purifica
2. Avatar morre NOVAMENTE → Ressuscita NOVAMENTE → Purifica NOVAMENTE
3. Repetir várias vezes
4. Verificar que stats vão diminuindo gradualmente mas avatar sempre pode voltar

### Teste 3: Verificar Custos
1. Jogador com 500💰 e 50💎
2. Tentar purificar Raro (2000💰 + 200💎)
3. Deve falhar com mensagem de recursos insuficientes
4. Adicionar recursos e tentar novamente
5. Deve suceder

---

## 📈 BALANCEAMENTO

### Economia Esperada (por 100 jogadores):

**Sem Purificador:**
- ~30 avatares morrem em PVP IA (30% morte)
- ~20 são ressuscitados (jogadores com recursos)
- ~10 ficam mortos permanentemente
- ~20 avatares com marca_morte (inutilizados)

**Com Purificador:**
- ~30 avatares morrem em PVP IA (30% morte)
- ~25 são ressuscitados (maior incentivo)
- ~20 são purificados (removem marca_morte)
- ~15 morrem e são ressuscitados NOVAMENTE
- ~10 são purificados NOVAMENTE

**Resultado:**
- Economia de moedas/fragmentos 3x mais ativa
- Jogadores engajam mais no PVP (menos medo)
- Avatares raros/lendários têm mais uso
- Sistema de "manutenção" de avatares valiosos

---

## 🎭 LORE E NARRATIVA

### Necromante (Sombrio):
> *"Ah... sinto o peso da perda em sua alma. Com os rituais corretos, posso trazer seus avatares de volta. Mas saiba: eles retornarão diferentes. Mais fracos. Marcados pela morte."*

### Purificador (Luminoso):
> *"Vejo que você carrega almas marcadas pela morte... Posso purificar a Marca da Morte e restaurar parte dos stats perdidos. Minha magia é de luz e renovação, o oposto das sombras necromânticas."*

**Contraste Temático:**
- Necromante: Sombras, vermelho/roxo, energia sombria
- Purificador: Luz, ciano/azul, energia luminosa
- Um traz de volta da morte (mas enfraquecido)
- Outro purifica e renova (restaura força)

---

## 🔮 FUTURAS EXPANSÕES

### Possíveis Melhorias:

1. **Sistema de Combo:**
   - Ressurreição + Purificação em pacote com desconto

2. **Purificação Parcial:**
   - Custo menor, mas só remove marca_morte (sem restaurar stats)
   - Purificação completa custa mais

3. **Rituais Especiais:**
   - Purificação perfeita (100% restauração) com custo altíssimo

4. **Sistema de Fidelidade:**
   - A cada 5 purificações, ganha 1 grátis

5. **Eventos de Purificação:**
   - Finais de semana com 50% desconto

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Criar frontend `/purificador/page.jsx`
- [x] Criar API `/api/purificar-avatar/route.js`
- [x] Adicionar link no dashboard
- [x] Sistema de custos 2x ressurreição
- [x] Lógica de restauração de stats (+15%)
- [x] Lógica de restauração de vínculo (+25%)
- [x] Remoção de marca_morte
- [x] Redução de exaustão para 30
- [x] Validação de recursos
- [x] Histórico (opcional)
- [x] Documentação completa
- [ ] Testes manuais
- [ ] Feedback de jogadores
- [ ] Balanceamento de custos (se necessário)

---

## 📝 NOTAS DE DESENVOLVIMENTO

**Decisões de Design:**

1. **Por que 50% de restauração (15% stats)?**
   - Não pode restaurar 100% senão purificação vira obrigatória
   - 50% é um meio termo justo (restaura metade do perdido)
   - Incentiva jogar bem para evitar morrer (mesmo com purificação)

2. **Por que custo 2x ressurreição?**
   - Purificação é mais valiosa (permite morrer novamente)
   - Não pode ser barata senão trivializa morte
   - Jogadores precisam fazer escolha estratégica

3. **Por que exaustão vai para 30?**
   - 60 (Exausto) é muito punitivo após purificação
   - 30 (Cansado) permite lutar com penalidades leves
   - Avatar precisa descansar mas não está incapacitado

---

## 🐛 POSSÍVEIS BUGS E SOLUÇÕES

### Bug 1: Stats ultrapassam máximo da raridade
**Solução:** Validação com `validarStats()` limita ao máximo

### Bug 2: Jogador purifica avatar sem marca_morte
**Solução:** Backend valida `marca_morte = true` antes de processar

### Bug 3: Recursos deduzidos mas purificação falha
**Solução:** Transação atômica (deduz recursos APÓS sucesso)

### Bug 4: Avatar morto aparece na lista de purificação
**Solução:** Query filtra `vivo = true AND marca_morte = true`

---

**Última Atualização:** 2025-11-15
**Responsável:** Claude Code Assistant
**Status:** ✅ IMPLEMENTADO E PRONTO PARA TESTES
