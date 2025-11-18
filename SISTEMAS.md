# ⚙️ Sistemas do Jogo - Portal Hunter Awakening

Documentação completa de todos os sistemas e mecânicas do jogo.

---

## 📋 Índice

1. [Sistema de Avatares](#sistema-de-avatares)
2. [Sistema de Stats](#sistema-de-stats)
3. [Sistema Elemental](#sistema-elemental)
4. [Sistema de Vínculo](#sistema-de-vínculo)
5. [Sistema de Exaustão](#sistema-de-exaustão)
6. [Sistema de Progressão e XP](#sistema-de-progressão-e-xp)
7. [Sistema de Habilidades](#sistema-de-habilidades)
8. [Sistema de Combate](#sistema-de-combate)
9. [Sistema de Morte e Ressurreição](#sistema-de-morte-e-ressurreição)
10. [Sistema PVP e Ranking](#sistema-pvp-e-ranking)
11. [Sistema de Temporadas](#sistema-de-temporadas)
12. [Sistema de Mercado](#sistema-de-mercado)
13. [Sistema de Lore](#sistema-de-lore)

---

## Sistema de Avatares

### Visão Geral

Avatares são **entidades invocadas de outras dimensões** que batalham ao lado dos jogadores. Cada avatar possui características únicas, personalidade própria e evoluí através de batalhas.

### Invocação

#### Primeira Invocação
- **GRATUITA** para todos os novos jogadores
- Sempre resulta em avatar **Comum**
- Escolha aleatória de elemento

#### Invocações Seguintes
- **Custo:** 250 moedas + 5 fragmentos
- **Probabilidades:**
  - 70% → Comum
  - 28% → Raro
  - 2% → Lendário

### Raridades

#### Comum (70%)
- **Stats Base:** 20-35 (soma total)
- **Crescimento/Nível:** +0.8 por stat
- **Cor:** Cinza

#### Raro (28%)
- **Stats Base:** 45-60 (soma total)
- **Crescimento/Nível:** +1.2 por stat
- **Cor:** Azul

#### Lendário (2%)
- **Stats Base:** 70-90 (soma total)
- **Crescimento/Nível:** +1.8 por stat
- **Cor:** Dourado

### Elementos

| Elemento | Emoji | Cor | Características |
|----------|-------|-----|----------------|
| Fogo | 🔥 | Vermelho | Alto dano, baixa defesa |
| Água | 💧 | Azul | Balanceado, cura |
| Terra | 🌍 | Verde | Alta resistência, lento |
| Vento | 💨 | Cyan | Alta agilidade, evasão |
| Eletricidade | ⚡ | Amarelo | Críticos, velocidade |
| Sombra | 🌑 | Roxo | Dano mágico, furtividade |
| Luz | ✨ | Branco | Suporte, purificação |

### Limite de Avatares

- **Máximo:** 15 avatares por jogador
- **Contagem:** Exclui avatares no memorial (morte permanente)
- **Gestão:** Sacrifício ou deixar morrer para liberar slots

---

## Sistema de Stats

### Os 4 Atributos Principais

#### 💪 Força
- **Função:** Dano físico
- **Fórmula:** Dano Físico = (Força × 1.0) + (Nível × 2)
- **Efeitos:**
  - Aumenta dano de ataques básicos
  - Melhora habilidades físicas
  - +1% de dano por ponto

#### ⚡ Agilidade
- **Função:** Velocidade e evasão
- **Fórmula:** Evasão% = (Agilidade × 0.5) [Max: 75%]
- **Efeitos:**
  - Chance de esquivar ataques
  - Velocidade de ataque
  - Ordem de turnos (futuro)

#### 🛡️ Resistência
- **Função:** HP e defesa
- **Fórmulas:**
  - HP Máximo = (Resistência × 10) + (Nível × 5)
  - Redução de Dano% = (Resistência × 0.5)
- **Efeitos:**
  - Aumenta HP máximo
  - Reduz dano recebido
  - Resistência a efeitos negativos

#### 🔮 Foco
- **Função:** Dano mágico e crítico
- **Fórmulas:**
  - Dano Mágico = (Foco × 1.2) + (Nível × 2.5)
  - Crítico% = (Foco × 0.3) [Max: 50%]
- **Efeitos:**
  - Aumenta dano mágico
  - Chance de crítico
  - Efetividade de habilidades

### Ranges por Raridade

| Raridade | Stats/Cada | Total Base | Crescimento/Nível |
|----------|------------|------------|-------------------|
| Comum | 5-10 | 20-35 | +0.8 |
| Raro | 10-16 | 45-60 | +1.2 |
| Lendário | 16-25 | 70-90 | +1.8 |

### Modificadores de Stats

#### Vínculo
- **0-19 (Estranho):** -10% em todos os stats
- **20-39 (Conhecido):** Sem modificadores
- **40-59 (Amigável):** +5% em todos os stats
- **60-79 (Leal):** +10% em todos os stats
- **80-100 (Alma Gêmea):** +15% em todos os stats + 10% crítico

#### Exaustão
- **0-19 (Descansado):** Sem penalidades
- **20-39 (Cansado):** -10% stats, -10% energia
- **40-59 (Exausto):** -20% stats, -20% energia
- **60-79 (Colapso Iminente):** -35% stats, -30% energia
- **80-100 (Colapsado):** Não pode batalhar

### Exemplo de Cálculo

```javascript
Avatar Lendário Nível 25:
  - Força base: 22
  - Vínculo: 75 (Leal) → +10%
  - Exaustão: 15 (Alerta) → -5% energia (sem penalidade em stats)

Força Final: 22 + (25-1) * 1.8 = 22 + 43.2 = 65.2
Força com Vínculo: 65.2 * 1.10 = 71.7

Dano Físico: (71.7 * 1.0) + (25 * 2) = 71.7 + 50 = 121.7
```

---

## Sistema Elemental

### Cadeia de Vantagens

```
Fogo → Vento → Terra → Água → Fogo
           ↓           ↓
        (Ciclo)    (Ciclo)

Luz ←→ Sombra (Mútuo)

Eletricidade: Neutro contra todos (exceto condutores)
```

### Multiplicadores de Dano

| Relação | Multiplicador | Exemplo |
|---------|---------------|---------|
| Vantagem | **1.5x** | Fogo vs Vento = 150% dano |
| Desvantagem | **0.75x** | Fogo vs Água = 75% dano |
| Neutro | **1.0x** | Fogo vs Sombra = 100% dano |
| Mútuo (Luz/Sombra) | **1.3x** | Luz vs Sombra = 130% dano |

### Bônus Elementais por Stat

Cada elemento tem afinidade com um stat principal:

| Elemento | Stat Primário | Bônus |
|----------|---------------|-------|
| Fogo | Força | +20% |
| Água | Resistência | +20% |
| Terra | Resistência | +25% |
| Vento | Agilidade | +20% |
| Eletricidade | Agilidade | +15%, Foco +10% |
| Sombra | Foco | +20% |
| Luz | Foco | +15%, Resistência +10% |

### Características Elementais

#### 🔥 Fogo
- **Personalidade:** Agressivo, impulsivo
- **Estilo de Combate:** Alto dano burst
- **Fraqueza:** Baixa defesa
- **Efeito de Status:** Queimadura (dano contínuo)

#### 💧 Água
- **Personalidade:** Calmo, adaptável
- **Estilo de Combate:** Balanceado, suporte
- **Fortaleza:** Cura e buffs
- **Efeito de Status:** Afogamento (reduz energia)

#### 🌍 Terra
- **Personalidade:** Teimoso, protetor
- **Estilo de Combate:** Tank defensivo
- **Fortaleza:** Alta resistência
- **Efeito de Status:** Lentidão

#### 💨 Vento
- **Personalidade:** Ágil, imprevisível
- **Estilo de Combate:** Hit-and-run
- **Fortaleza:** Evasão
- **Efeito de Status:** Desorientado

#### ⚡ Eletricidade
- **Personalidade:** Energético, volátil
- **Estilo de Combate:** Críticos e velocidade
- **Fortaleza:** Ataques rápidos
- **Efeito de Status:** Paralisado

#### 🌑 Sombra
- **Personalidade:** Misterioso, furtivo
- **Estilo de Combate:** Dano mágico, debuffs
- **Fortaleza:** Controle de campo
- **Efeito de Status:** Maldição

#### ✨ Luz
- **Personalidade:** Nobre, protetor
- **Estilo de Combate:** Suporte e purificação
- **Fortaleza:** Cura e buffs
- **Efeito de Status:** Benção

---

## Sistema de Vínculo

### Visão Geral

O **Vínculo** (0-100) representa a conexão emocional e tática entre o invocador e o avatar. Quanto maior o vínculo, mais efetivo o avatar em combate.

### Níveis de Vínculo

| Nível | Range | Emoji | Modificador | Efeitos |
|-------|-------|-------|-------------|---------|
| Estranho | 0-19 | ❓ | **-10%** stats | Avatar pode desobedecer (5%) |
| Conhecido | 20-39 | 🤝 | **+0%** | Normal |
| Amigável | 40-59 | 😊 | **+5%** stats | Bônus de cooperação |
| Leal | 60-79 | 💙 | **+10%** stats | Combo attacks |
| Alma Gêmea | 80-100 | 💖 | **+15%** stats + 10% crítico | Perfeita sintonia |

### Como Ganhar Vínculo

| Ação | Ganho de Vínculo |
|------|------------------|
| Vencer batalha | +5 a +8 |
| Perder batalha juntos | +2 a +3 |
| Usar habilidade cooperativa | +3 |
| Treinar avatar | +1 a +2 |
| Descansar avatar (quando cansado) | +1 |
| Avatar quase morre mas sobrevive | +5 |

### Como Perder Vínculo

| Ação | Perda de Vínculo |
|------|------------------|
| Avatar morre em batalha | -20 |
| Deixar avatar exausto (80+) | -5 |
| Não usar avatar por 7 dias | -10 |
| Ressurreição pelo Necromante | -50 |
| Tentar vender avatar | -10 |

### Efeitos Práticos

**Vínculo 0 (Estranho):**
```
Avatar Lendário nível 25:
  Stats normais: 65 em cada
  Com vínculo 0: 58.5 em cada (-10%)
  Pode desobedecer comandos (5% chance)
```

**Vínculo 90 (Alma Gêmea):**
```
Avatar Lendário nível 25:
  Stats normais: 65 em cada
  Com vínculo 90: 74.75 em cada (+15%)
  Chance crítico: Base 15% → 25% (+10%)
  Acesso a habilidades ultimate
```

---

## Sistema de Exaustão

### Visão Geral

Avatares ficam **exaustos** após combates e precisam descansar. Exaustão alta penaliza severamente o desempenho.

### Níveis de Exaustão

| Nível | Range | Emoji | Penalidades |
|-------|-------|-------|-------------|
| Descansado | 0-19 | 💚 | Sem penalidades |
| Alerta | 20-39 | 💛 | -5% energia máxima |
| Cansado | 40-59 | 🟠 | -10% stats, -10% energia |
| Exausto | 60-79 | 🔴 | -20% stats, -20% energia |
| Colapso Iminente | 80-99 | 💀 | -35% stats, -30% energia |
| Colapsado | 100 | 🛑 | **Não pode batalhar** |

### Como Ganhar Exaustão

| Ação | Ganho |
|------|-------|
| Batalha PVE comum | +10 a +15 |
| Batalha PVP | +15 a +20 |
| Batalha Boss | +30 a +40 |
| Usar habilidade Ultimate | +10 |
| Missão longa | +20 |

### Como Reduzir Exaustão

| Ação | Redução |
|------|---------|
| Descansar (botão) | **-20** |
| Tempo passivo (1 hora) | -5 (não implementado) |
| Item "Elixir de Vigor" | -50 |

### Sistema de Descanso

```javascript
// Descansar avatar
POST /api/descansar-avatar

Efeitos:
  - Exaustão: -20 (mínimo 0)
  - Vínculo: +1 (se exaustão era > 60)
  - Sem custo
  - Sem cooldown
```

### Impacto em Combate

**Exemplo: Avatar Exausto (70 de exaustão)**

```
Stats base: 65
Penalidade: -20%
Stats finais: 52

HP base: 650
HP final: 520 (-20%)

Energia base: 100
Energia final: 80 (-20%)

Resultado: Avatar muito mais fraco!
```

---

## Sistema de Progressão e XP

### Níveis

- **Mínimo:** 1
- **Máximo:** 100
- **XP Inicial:** 0

### Curva de XP

```javascript
XP necessário = 100 * (1.15 ^ (nivel - 1))

Nível 2: 100 XP
Nível 5: 175 XP
Nível 10: 405 XP
Nível 25: 3.247 XP
Nível 50: 108.367 XP
Nível 100: 8.200.000+ XP
```

### Ganho de XP

| Fonte | XP Ganho |
|-------|----------|
| Vencer batalha PVE | 50-150 (baseado em dificuldade) |
| Vencer batalha PVP | 100-300 (baseado em fama do oponente) |
| Completar missão | 200-500 |
| Boss derrotado | 1000+ |

### Crescimento de Stats por Nível

Ao subir de nível, os stats aumentam automaticamente:

```javascript
Stats nível N = Stats base + ((N - 1) * Crescimento)

Avatar Lendário:
  Força base: 22
  Crescimento: 1.8 por nível

  Nível 1: 22
  Nível 10: 22 + (9 * 1.8) = 38.2
  Nível 50: 22 + (49 * 1.8) = 110.2
  Nível 100: 22 + (99 * 1.8) = 200.2
```

### Milestones (Marcos)

| Nível | Marco | Benefício |
|-------|-------|-----------|
| 10 | Despertar | Nova habilidade desbloqueada |
| 25 | Ascensão Menor | Habilidade evolui |
| 50 | Ascensão Maior | Habilidade Ultimate |
| 75 | Transcendência | Forma transcendente (visual) |
| 100 | Perfeição | Stats máximos, título especial |

---

## Sistema de Habilidades

### Estrutura de Habilidades

Cada avatar possui **3-5 habilidades** baseadas em elemento e raridade.

#### Tipos de Habilidades

1. **Ofensivas** - Causam dano
2. **Defensivas** - Buffs de defesa
3. **Suporte** - Cura e buffs
4. **Controle** - Debuffs e CC

### Atributos de uma Habilidade

```json
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
```

### Custos de Energia

| Tipo | Custo Típico |
|------|--------------|
| Ataque básico | 0 |
| Habilidade comum | 20-30 |
| Habilidade rara | 30-50 |
| Habilidade ultimate | 60-80 |
| Defender | 0 (recupera 15) |
| Esperar | 0 (recupera 30) |

### Efeitos de Status

#### Dano Contínuo
- **Queimadura** 🔥 - 5-10 dano/turno por 3 turnos
- **Afogamento** 💧 - 3-7 dano/turno + reduz energia
- **Maldição** 🌑 - 8-12 dano/turno

#### Cura Contínua
- **Regeneração** 💚 - +10 HP/turno por 5 turnos
- **Auto-Cura** ✨ - +15 HP/turno por 3 turnos

#### Buffs
- **Defesa Aumentada** 🛡️ - +30% resistência por 3 turnos
- **Evasão** 💨 - +20% evasão por 2 turnos
- **Velocidade** ⚡ - +15% agilidade por 4 turnos
- **Benção** ✨ - +10% todos stats por 3 turnos

#### Debuffs
- **Lentidão** 🐌 - -20% agilidade por 3 turnos
- **Enfraquecido** 💔 - -15% força por 3 turnos
- **Desorientado** 😵 - -10% precisão por 2 turnos

#### Controle
- **Congelado** ❄️ - Pula 1 turno
- **Atordoado** 💫 - Pula 1 turno, -20% defesa
- **Paralisado** ⚡ - 50% chance de não agir

---

## Sistema de Combate

### Estrutura de Batalha

#### Energia
- **Inicial:** 100
- **Máxima:** 100
- **Por Turno:** Não regenera automaticamente
- **Recuperação:** Via ações (Defender +15, Esperar +30)

#### Rodadas
- **Máximo:** 20 rodadas
- **Vitória:** HP oponente = 0
- **Derrota:** Seu HP = 0 OU 20 rodadas sem vencer

### Ações Disponíveis

#### 1. Ataque Básico
- **Custo:** 0 energia
- **Dano:** Força × 1.0 + Nível × 2
- **Chance Acerto:** 90%
- **Cooldown:** Nenhum

#### 2. Habilidade
- **Custo:** Variável (20-80)
- **Dano:** Baseado na habilidade
- **Chance Acerto:** Variável
- **Cooldown:** Variável

#### 3. Defender
- **Custo:** 0 energia
- **Efeito:** +50% resistência no próximo turno
- **Recupera:** +15 energia
- **Cooldown:** Nenhum

#### 4. Esperar
- **Custo:** 0 energia
- **Efeito:** Nenhum
- **Recupera:** +30 energia
- **Cooldown:** Nenhum

### Cálculo de Dano

```javascript
// Dano Base
if (habilidade.tipo === 'fisica') {
  danoBase = (Força * multiplicador) + (Nivel * 2);
} else {
  danoBase = (Foco * multiplicador) + (Nivel * 2.5);
}

// Crítico (baseado em Foco)
chanceCritico = (Foco * 0.3) / 100; // Max 50%
if (random() < chanceCritico) {
  danoBase *= 2.0;
}

// Vantagem Elemental
danoBase *= multiplicadorElemental; // 1.5x, 1.0x, ou 0.75x

// Defesa do Alvo
reducao = (Resistencia_alvo * 0.5) / 100;
danoFinal = danoBase * (1 - reducao);

// Evasão
chanceEvasao = (Agilidade_alvo * 0.5) / 100; // Max 75%
if (random() < chanceEvasao) {
  danoFinal = 0; // Esquivou!
}
```

### Fluxo de uma Rodada

```
1. Jogador escolhe ação
2. IA escolhe ação (automático)
3. Processa ação do jogador:
   - Calcula dano
   - Aplica efeitos de status
   - Atualiza HP e energia
4. Processa ação da IA:
   - Calcula dano
   - Aplica efeitos de status
   - Atualiza HP e energia
5. Processa efeitos contínuos (queimadura, regeneração, etc)
6. Incrementa cooldowns
7. Verifica condição de vitória
8. Se não terminou, próxima rodada
```

### Condições de Vitória

- **Vitória:** HP do oponente = 0
- **Derrota:** Seu HP = 0
- **Empate:** 20 rodadas sem resultado (conta como derrota)

---

## Sistema de Morte e Ressurreição

### Morte em Batalha

Ao ser derrotado em PVP IA:

- **30% chance:** MORTE REAL (`vivo = false`, `hp_atual = 0`)
- **70% chance:** INCAPACITADO (`vivo = true`, `hp_atual = 1`)

### Necromante (Ressurreição)

#### Custos por Raridade

| Raridade | Moedas | Fragmentos |
|----------|--------|------------|
| Comum | 500 💰 | 50 💎 |
| Raro | 1.000 💰 | 100 💎 |
| Lendário | 1.500 💰 | 150 💎 |

#### Penalidades Aplicadas

```
✅ Avatar volta à vida (vivo = true)
✅ HP = 1 (incapacitado)
❌ Stats: -30% em TODOS os atributos
❌ Vínculo: -50 pontos
❌ XP: -30% da experiência total
❌ Exaustão: +60 (Exausto)
🔴 Marca da Morte: true (SÓ PODE RESSUSCITAR 1X)
```

#### Exemplo de Ressurreição

```
Avatar Lendário nível 25 ANTES de morrer:
  Força: 65
  Vínculo: 80
  XP: 10.000
  Exaustão: 20

Avatar DEPOIS de ressurreição:
  Força: 45.5 (-30%)
  Vínculo: 30 (-50)
  XP: 7.000 (-30%)
  Exaustão: 80 (Colapso Iminente)
  Marca da Morte: true
```

### Purificador

#### Função
Remove a **Marca da Morte** e restaura parcialmente os stats perdidos.

#### Custos por Raridade

| Raridade | Moedas | Fragmentos |
|----------|--------|------------|
| Comum | 1.000 💰 | 100 💎 |
| Raro | 2.000 💰 | 200 💎 |
| Lendário | 3.000 💰 | 300 💎 |

#### Benefícios

```
✅ Marca da Morte: Removida (pode ressuscitar novamente)
✅ Stats: +15% (restaura 50% do que foi perdido)
✅ Vínculo: +25
✅ Exaustão: = 30 (Cansado)
```

#### Exemplo de Purificação

```
Avatar com Marca da Morte:
  Força: 45.5 (perdeu 30% = 19.5)
  Vínculo: 30
  Exaustão: 80

Avatar DEPOIS de purificação:
  Força: 54.75 (+9.75, metade do perdido)
  Vínculo: 55 (+25)
  Exaustão: 30
  Marca da Morte: false
```

### Memorial

Avatares que morrem **com Marca da Morte** ativa vão para o **Memorial** (morte permanente).

```
marca_morte = true AND vivo = false → MEMORIAL

Efeitos:
  - Avatar perdido PERMANENTEMENTE
  - Não conta no limite de 15 avatares
  - Aparece na página /memorial como homenagem
```

---

## Sistema PVP e Ranking

### Sistema de Fama (ELO)

#### Fama Inicial
- **Base:** 1000 pontos para todos

#### Ganho/Perda de Fama

**Base:**
- Vitória: **+20**
- Derrota: **-15**

**Bônus Upset** (quando underdog vence):
- Diferença > 200 fama: **+5** extra
- Diferença > 500 fama: **+10** extra
- Diferença > 1000 fama: **+20** extra

**Bônus Streak** (sequência de vitórias):
- A cada 3 vitórias consecutivas: **+2**
- Máximo: **+10** (15 vitórias seguidas)

#### Exemplo de Cálculo

```
Cenário 1: Vitória Normal
  Você: 1500 fama
  Oponente: 1480 fama
  Resultado: VITÓRIA

  Ganho:
    Base: +20
    Upset: 0 (você é favorito)
    Streak: +2 (3 vitórias seguidas)
    Total: +22 fama
    Nova fama: 1522

Cenário 2: Upset (Underdog vence)
  Você: 1200 fama
  Oponente: 2500 fama
  Resultado: VITÓRIA

  Ganho:
    Base: +20
    Upset: +20 (diferença de 1300)
    Streak: 0
    Total: +40 fama
    Nova fama: 1240
```

### Tiers de Ranking

| Tier | Fama | Cor | Recompensas Mensais |
|------|------|-----|---------------------|
| Bronze | 0-999 | 🟤 | - |
| Prata | 1000-1999 | ⚪ | 100💰 |
| Ouro | 2000-2999 | 🟡 | 300💰 + 5💎 |
| Platina | 3000-3999 | 💎 | 800💰 + 15💎 |
| Diamante | 4000-4999 | 💠 | 1500💰 + 30💎 |
| Lendário | 5000+ | 🌟 | Top 100 rewards |

---

## Sistema de Temporadas

### Estrutura

- **Duração:** 1 mês (dia 1 ao dia 30/31)
- **Formato ID:** YYYY-MM (ex: 2025-11)
- **Reset:** Automático (futuro) ou manual

### Ciclo de Vida

```
┌─────────────────────────────────────────────────┐
│  Dia 1: Nova Temporada Inicia                   │
│  - Criar registro em pvp_temporadas             │
│  - ativa = true                                 │
│  - Todos começam com 1000 fama                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Dias 1-30: Temporada Ativa                     │
│  - Jogadores batalham                           │
│  - pvp_rankings atualizado em tempo real        │
│  - Leaderboard visível                          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Dia 30: Encerramento (POST /api/pvp/temporada/encerrar) │
│  1. Marca temporada.ativa = false               │
│  2. Copia pvp_rankings → pvp_historico_temporadas │
│  3. Calcula posições finais (ROW_NUMBER)        │
│  4. Distribui recompensas Top 100               │
│  5. Cria títulos para Top 10                    │
│  6. Cria nova temporada (mês seguinte)          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Jogadores Coletam Recompensas                  │
│  - /recompensas (lista pendentes)               │
│  - /recompensas/coletar (coleta)                │
│  - Moedas/fragmentos adicionados                │
│  - Avatares invocados (1º-3º)                   │
│  - Títulos ativados (Top 10)                    │
└─────────────────────────────────────────────────┘
```

### Distribuição de Recompensas

| Posição | Moedas | Fragmentos | Avatar | Título |
|---------|--------|------------|--------|--------|
| 1º | 5.000 | 50 | 🌟 Lendário | 👑 Campeão |
| 2º | 3.000 | 30 | 💎 Raro | 🥈 Vice |
| 3º | 3.000 | 30 | 💎 Raro | 🥉 3º |
| 4º-10º | 1.500 | 20 | - | ⭐ Elite |
| 11º-50º | 800 | 10 | - | - |
| 51º-100º | 400 | 5 | - | - |

### Títulos Permanentes

- **Permanentes:** Uma vez conquistados, ficam para sempre
- **Únicos:** Por temporada (pode ter múltiplos de diferentes temporadas)
- **Equipáveis:** Um ativo por vez
- **Visíveis:** Aparece ao lado do nome no leaderboard

```
Exemplo:
  1º - 👑 Invocador Supremo - 5500 fama
  2º - ⭐ Mestre das Sombras - 5200 fama (título de 5º lugar em temporada anterior)
```

---

## Sistema de Mercado

### Regras de Venda

#### Restrições
- ❌ Não pode vender avatar **ativo**
- ❌ Não pode vender avatar **morto**
- ❌ Não pode vender avatar com **marca da morte**
- ✅ Deve definir preço mínimo (100💰 OU 1💎)

#### Preços

| Moeda | Mínimo | Máximo |
|-------|--------|--------|
| Moedas 💰 | 100 | 10.000 |
| Fragmentos 💎 | 1 | 500 |

#### Opções de Preço
- Apenas moedas
- Apenas fragmentos
- **Ambos** (comprador precisa dos dois)

### Taxa de Mercado

- **Moedas:** 5% de taxa
- **Fragmentos:** 0% de taxa (sem taxa)

#### Exemplo

```
Venda: 5000💰 + 50💎

Comprador paga: 5000💰 + 50💎
Taxa do sistema: 250💰 (5%)
Vendedor recebe: 4750💰 + 50💎
```

### Transação Atômica

Todas as compras usam RPC `executar_compra_avatar` para garantir atomicidade:

```sql
BEGIN TRANSACTION;
  1. Lock avatar (FOR UPDATE)
  2. Valida disponibilidade
  3. Deduz recursos do comprador
  4. Adiciona recursos ao vendedor (com taxa)
  5. Transfere avatar (user_id)
  6. Reseta em_venda, vinculo, exaustao
  7. Registra transação
COMMIT; -- Tudo ou nada!
```

### Efeitos da Compra

Quando um avatar é comprado:
- `user_id` → muda para comprador
- `em_venda` → false
- `preco_venda` → null
- `preco_fragmentos` → null
- `vinculo` → **0** (reseta vínculo)
- `exaustao` → **0** (descansado)

---

## Sistema de Lore

### Geração Procedural

Cada avatar possui **lore único** gerado com base em elemento e raridade.

### Componentes do Lore

#### Nome
- **Formato:** `[Prefixo] + [Sufixo] + [Título]`
- **Exemplos:**
  - Ignis, o Arauto das Chamas Eternas (Fogo Lendário)
  - Aqualis, Guardião das Profundezas (Água Raro)
  - Zephyr, o Errante dos Ventos (Vento Comum)

#### Descrição Narrativa

Gerada com base em:
- **Elemento:** Origem, habitat, poderes
- **Raridade:** Importância, feitos, lenda

**Exemplo (Fogo Lendário):**
```
"Nascido das profundezas de um vulcão ancestral onde a própria essência
do fogo primordial ainda pulsa, Ignis é uma entidade lendária que
testemunhou o nascimento e queda de civilizações inteiras. Suas chamas
não apenas destroem, mas purificam e renovam, sendo capaz de incinerar
exércitos com um único gesto ou aquecer um reino inteiro durante o
inverno mais cruel."
```

**Exemplo (Água Comum):**
```
"Um espírito das águas calmas, nascido de um lago cristalino nas
montanhas. Apesar de jovem e inexperiente, Aqua possui grande
potencial e uma conexão natural com os fluxos de energia vital."
```

---

## Resumo dos Sistemas

| Sistema | Arquivo | Função |
|---------|---------|--------|
| Avatares | `/app/api/invocar-avatar` | Invocação e gestão |
| Stats | `/app/avatares/sistemas/statsSystem.js` | Atributos base |
| Elemental | `/app/avatares/sistemas/elementalSystem.js` | Vantagens elementais |
| Vínculo | `/app/avatares/sistemas/bondSystem.js` | Relação jogador-avatar |
| Exaustão | `/app/avatares/sistemas/exhaustionSystem.js` | Cansaço e descanso |
| Progressão | `/app/avatares/sistemas/progressionSystem.js` | XP e níveis |
| Habilidades | `/app/avatares/sistemas/abilitiesSystem.js` | Skills de combate |
| Combate | `/lib/arena/batalhaEngine.js` | Motor de batalha |
| Morte | `/app/api/ressuscitar-avatar` | Ressurreição |
| PVP | `/lib/pvp/rankingSystem.js` | Fama e ranking |
| Temporadas | `/lib/pvp/seasonSystem.js` | Temporadas mensais |
| Mercado | `/app/api/mercado/*` | Compra e venda |
| Lore | `/app/avatares/sistemas/loreSystem.js` | Geração de narrativa |

---

**Última atualização:** Novembro 2025

**Para mais detalhes técnicos, veja:**
- [API_REFERENCE.md](./API_REFERENCE.md) - APIs de cada sistema
- [DATABASE.md](./DATABASE.md) - Estrutura de dados
- [ARQUITETURA.md](./ARQUITETURA.md) - Organização do código
