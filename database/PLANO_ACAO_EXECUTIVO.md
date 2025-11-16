# 🎯 PLANO DE AÇÃO EXECUTIVO - Portal Hunter Awakening

**Data:** 2025-11-15
**Status do Projeto:** 85% Pronto para Produção
**Prioridade:** ALTA

---

## 📋 RESUMO EXECUTIVO

O jogo **Portal Hunter Awakening** está com a arquitetura sólida e bem implementada. O código está limpo, modular e bem documentado. No entanto, há **gaps críticos de segurança e persistência** que precisam ser resolvidos antes de ir para produção.

### ✅ **O QUE ESTÁ EXCELENTE:**
- Sistema de avatares completamente funcional
- PVP IA com ranking e temporadas implementado
- Sistema de recompensas mensais funcionando
- Sistema de inventário e loja operacional
- Views otimizadas no banco de dados
- Código modular e bem organizado

### ⚠️ **O QUE PRECISA SER CORRIGIDO:**
1. **CRÍTICO:** Row Level Security (RLS) não configurado
2. **CRÍTICO:** Estado de batalha em localStorage (perde dados no refresh)
3. **IMPORTANTE:** Faltam índices de performance
4. **IMPORTANTE:** Evolução de habilidades não executa nos level-ups

---

## 🚨 PRIORIDADE 1: SEGURANÇA (URGENTE)

### Problema
Atualmente TODAS as requisições usam `SERVICE_ROLE_KEY`, que **bypassa todas as políticas de segurança**. Qualquer jogador pode teoricamente acessar dados de outros.

### Solução

#### 1️⃣ Migrar para ANON_KEY com RLS

**Arquivo:** `/lib/supabase/serverClient.js`

**ANTES (Inseguro):**
```javascript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ❌ INSEGURO
);
```

**DEPOIS (Seguro):**
```javascript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // ✅ SEGURO
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

#### 2️⃣ Configurar RLS no Supabase

Execute no **SQL Editor** do Supabase:

```sql
-- AVATARES
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

-- PLAYER_STATS
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON player_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON player_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- INVENTÁRIO
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory"
  ON player_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own inventory"
  ON player_inventory FOR ALL
  USING (auth.uid() = user_id);

-- PVP RANKINGS (Todos podem ver, mas só sistema atualiza)
ALTER TABLE pvp_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rankings"
  ON pvp_rankings FOR SELECT
  USING (true);

-- ITEMS (Todos podem ver catálogo)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  USING (true);
```

#### 3️⃣ Criar funções SECURITY DEFINER para operações críticas

```sql
-- Função para atualizar ranking (executa com permissões elevadas)
CREATE OR REPLACE FUNCTION atualizar_ranking_pvp(
  p_user_id UUID,
  p_temporada_id VARCHAR(7),
  p_venceu BOOLEAN,
  p_fama_mudanca INTEGER,
  p_streak_novo INTEGER
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE pvp_rankings
  SET
    fama = fama + p_fama_mudanca,
    vitorias = CASE WHEN p_venceu THEN vitorias + 1 ELSE vitorias END,
    derrotas = CASE WHEN NOT p_venceu THEN derrotas + 1 ELSE derrotas END,
    streak = p_streak_novo,
    streak_maximo = GREATEST(streak_maximo, p_streak_novo),
    ultima_batalha = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND temporada_id = p_temporada_id;
END;
$$;
```

**Chamada no código:**
```javascript
// Ao invés de UPDATE direto
await supabase.rpc('atualizar_ranking_pvp', {
  p_user_id: userId,
  p_temporada_id: temporadaId,
  p_venceu: true,
  p_fama_mudanca: 25,
  p_streak_novo: 5
});
```

**Tempo estimado:** 4-6 horas
**Prioridade:** 🔴 CRÍTICA

---

## 🚨 PRIORIDADE 2: PERSISTÊNCIA DE BATALHAS

### Problema
O estado de batalha é salvo em `localStorage`, o que causa:
- ❌ Perda de dados ao atualizar página
- ❌ Impossibilidade de análises
- ❌ Possibilidade de cheating

### Solução

#### 1️⃣ Criar tabela `batalhas_ativas`

```sql
CREATE TABLE batalhas_ativas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- 'treino', 'pvp_ia', 'sobrevivencia'

  -- Avatares
  jogador_avatar_id UUID REFERENCES avatares(id) NOT NULL,
  oponente_avatar_data JSONB NOT NULL,

  -- Estado da batalha
  rodada_atual INTEGER DEFAULT 1,
  turno_de VARCHAR(10) DEFAULT 'jogador',

  -- HP e Energia
  jogador_hp INTEGER NOT NULL,
  jogador_energia INTEGER DEFAULT 100,
  oponente_hp INTEGER NOT NULL,
  oponente_energia INTEGER DEFAULT 100,

  -- Buffs e Debuffs
  jogador_buffs JSONB DEFAULT '[]'::jsonb,
  jogador_debuffs JSONB DEFAULT '[]'::jsonb,
  oponente_buffs JSONB DEFAULT '[]'::jsonb,
  oponente_debuffs JSONB DEFAULT '[]'::jsonb,

  -- Histórico
  acoes_historico JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  iniciada_em TIMESTAMP DEFAULT NOW(),
  ultima_acao TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour'),

  UNIQUE(user_id, tipo)
);

CREATE INDEX idx_batalhas_ativas_user_id ON batalhas_ativas(user_id);
CREATE INDEX idx_batalhas_ativas_expires ON batalhas_ativas(expires_at);

-- RLS
ALTER TABLE batalhas_ativas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own battles"
  ON batalhas_ativas FOR ALL
  USING (auth.uid() = user_id);
```

#### 2️⃣ Criar endpoints de batalha

**Arquivo:** `/app/api/batalha/iniciar/route.js`
```javascript
export async function POST(request) {
  const { tipo, avatarId, oponenteData } = await request.json();
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user.id;

  // Deletar batalha anterior do mesmo tipo (se existir)
  await supabase
    .from('batalhas_ativas')
    .delete()
    .eq('user_id', userId)
    .eq('tipo', tipo);

  // Criar nova batalha
  const { data: batalha } = await supabase
    .from('batalhas_ativas')
    .insert({
      user_id: userId,
      tipo: tipo,
      jogador_avatar_id: avatarId,
      oponente_avatar_data: oponenteData,
      jogador_hp: calcularHP(avatar),
      oponente_hp: calcularHP(oponenteData)
    })
    .select()
    .single();

  return NextResponse.json({ sucesso: true, batalhaId: batalha.id });
}
```

**Arquivo:** `/app/api/batalha/acao/route.js`
```javascript
export async function POST(request) {
  const { batalhaId, acao } = await request.json();
  const supabase = await createClient();

  // Buscar estado atual
  const { data: batalha } = await supabase
    .from('batalhas_ativas')
    .select('*')
    .eq('id', batalhaId)
    .single();

  // Processar turno
  const resultado = processarTurno(batalha, acao);

  // Atualizar estado
  await supabase
    .from('batalhas_ativas')
    .update({
      rodada_atual: batalha.rodada_atual + 1,
      jogador_hp: resultado.jogadorHP,
      oponente_hp: resultado.oponenteHP,
      jogador_energia: resultado.jogadorEnergia,
      oponente_energia: resultado.oponenteEnergia,
      acoes_historico: [...batalha.acoes_historico, resultado.acao],
      ultima_acao: new Date()
    })
    .eq('id', batalhaId);

  return NextResponse.json({ sucesso: true, resultado });
}
```

#### 3️⃣ Atualizar frontend

**Arquivo:** `/app/arena/pvp-ia/batalha/page.jsx`

**ANTES:**
```javascript
const [estado, setEstado] = useState(() => {
  const saved = localStorage.getItem('estadoBatalha');
  return saved ? JSON.parse(saved) : null;
});
```

**DEPOIS:**
```javascript
const [batalhaId, setBatalhaId] = useState(null);
const [estado, setEstado] = useState(null);

useEffect(() => {
  async function carregarBatalha() {
    const res = await fetch('/api/batalha/estado');
    const data = await res.json();
    if (data.batalha) {
      setBatalhaId(data.batalha.id);
      setEstado(data.batalha);
    }
  }
  carregarBatalha();
}, []);

async function executarAcao(acao) {
  const res = await fetch('/api/batalha/acao', {
    method: 'POST',
    body: JSON.stringify({ batalhaId, acao })
  });
  const resultado = await res.json();
  setEstado(resultado.novoEstado);
}
```

**Tempo estimado:** 1-2 dias
**Prioridade:** 🔴 CRÍTICA

---

## 🟡 PRIORIDADE 3: PERFORMANCE

### Criar índices no banco

```sql
-- AVATARES
CREATE INDEX idx_avatares_user_vivo ON avatares(user_id, vivo);
CREATE INDEX idx_avatares_user_ativo ON avatares(user_id) WHERE ativo = true;
CREATE INDEX idx_avatares_raridade ON avatares(raridade);

-- PVP_RANKINGS
CREATE INDEX idx_pvp_rankings_temporada_fama
  ON pvp_rankings(temporada_id, fama DESC);

-- PVP_BATALHAS_LOG
CREATE INDEX idx_pvp_batalhas_temporada
  ON pvp_batalhas_log(temporada_id, data_batalha DESC);
CREATE INDEX idx_pvp_batalhas_jogador1
  ON pvp_batalhas_log(jogador1_id);

-- INVOCACOES_HISTORICO
CREATE INDEX idx_invocacoes_user_created
  ON invocacoes_historico(user_id, created_at DESC);

-- PLAYER_INVENTORY
CREATE INDEX idx_player_inventory_user
  ON player_inventory(user_id);
```

**Tempo estimado:** 30 minutos
**Prioridade:** 🟡 IMPORTANTE

---

## 🟡 PRIORIDADE 4: MELHORIAS DE DADOS

### 1. Adicionar HP Máximo e Energia Máxima

```sql
ALTER TABLE avatares
ADD COLUMN hp_max INTEGER,
ADD COLUMN energia_max INTEGER DEFAULT 100;

-- Atualizar existentes
UPDATE avatares
SET hp_max = (resistencia * 10) + (nivel * 5) +
  CASE
    WHEN raridade = 'Lendário' THEN 100
    WHEN raridade = 'Raro' THEN 50
    ELSE 0
  END;

-- Garantir que hp_atual não exceda hp_max
UPDATE avatares
SET hp_atual = LEAST(hp_atual, hp_max)
WHERE hp_atual > hp_max;
```

### 2. Implementar Evolução de Habilidades

**Arquivo:** `/app/api/atualizar-stats/route.js`

**Adicionar após level up:**
```javascript
import { abilitiesSystem } from '@/app/avatares/sistemas/abilitiesSystem';

// Verificar milestones de evolução
const milestones = [10, 25, 50, 75, 100];
if (milestones.includes(novoNivel)) {
  const habilidadesEvoluidas = abilitiesSystem.evoluirHabilidades(
    avatar.habilidades,
    avatar.elemento,
    novoNivel
  );

  await supabase
    .from('avatares')
    .update({ habilidades: habilidadesEvoluidas })
    .eq('id', avatarId);
}
```

**Tempo estimado:** 2-3 horas
**Prioridade:** 🟡 IMPORTANTE

---

## 🟢 PRIORIDADE 5: FEATURES ADICIONAIS

### 1. Sistema de Necromante - Histórico

```sql
CREATE TABLE necromante_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  avatar_id UUID REFERENCES avatares(id),
  custo INTEGER NOT NULL,
  metodo_pagamento VARCHAR(20) NOT NULL,
  nivel_avatar_na_morte INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_necromante_historico_user ON necromante_historico(user_id);
```

### 2. Endpoint de Estatísticas do Jogador

```javascript
// /app/api/perfil/estatisticas/route.js
export async function GET() {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user.id;

  const { data: stats } = await supabase
    .from('estatisticas_jogador')
    .select('*')
    .eq('user_id', userId)
    .single();

  return NextResponse.json(stats);
}
```

### 3. Análise de Drop Rates

```javascript
// /app/api/estatisticas/invocacoes/route.js
export async function GET() {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user.id;

  const { data: historico } = await supabase
    .from('invocacoes_historico')
    .select('raridade, elemento, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const stats = {
    total: historico.length,
    comum: historico.filter(h => h.raridade === 'Comum').length,
    raro: historico.filter(h => h.raridade === 'Raro').length,
    lendario: historico.filter(h => h.raridade === 'Lendário').length,
    taxaDropLendario: (lendario / total * 100).toFixed(2) + '%'
  };

  return NextResponse.json(stats);
}
```

**Tempo estimado:** 1 dia
**Prioridade:** 🟢 OPCIONAL

---

## 📅 CRONOGRAMA SUGERIDO

### 🔴 **SPRINT 1: SEGURANÇA (3-4 dias)**
**Objetivo:** Sistema 100% seguro

- [ ] **Dia 1-2:** Configurar RLS em todas as tabelas
- [ ] **Dia 2:** Migrar de SERVICE_ROLE para ANON_KEY
- [ ] **Dia 3:** Criar funções SECURITY DEFINER
- [ ] **Dia 4:** Testar todas as funcionalidades

**Deliverables:**
- ✅ RLS configurado em 100% das tabelas
- ✅ Código usando ANON_KEY
- ✅ Testes de segurança passando

---

### 🔴 **SPRINT 2: PERSISTÊNCIA (2-3 dias)**
**Objetivo:** Batalhas salvas no DB

- [ ] **Dia 1:** Criar tabela `batalhas_ativas` e índices
- [ ] **Dia 2:** Criar endpoints de batalha
- [ ] **Dia 3:** Migrar frontend para usar DB
- [ ] **Dia 3:** Testar persistência (refresh, reconexão)

**Deliverables:**
- ✅ Batalhas persistem no DB
- ✅ Jogador pode retomar batalha após refresh
- ✅ Histórico de ações completo

---

### 🟡 **SPRINT 3: PERFORMANCE E MELHORIAS (2 dias)**
**Objetivo:** Jogo otimizado e completo

- [ ] **Dia 1:** Criar todos os índices
- [ ] **Dia 1:** Adicionar `hp_max` e `energia_max`
- [ ] **Dia 2:** Implementar evolução de habilidades
- [ ] **Dia 2:** Testes de carga e performance

**Deliverables:**
- ✅ Queries 50%+ mais rápidas
- ✅ Habilidades evoluem automaticamente
- ✅ Dados consistentes

---

### 🟢 **SPRINT 4: POLIMENTO (1-2 dias)**
**Objetivo:** Features extras e documentação

- [ ] **Dia 1:** Histórico de necromante
- [ ] **Dia 1:** Endpoint de estatísticas
- [ ] **Dia 2:** Análise de drop rates
- [ ] **Dia 2:** Documentação final

**Deliverables:**
- ✅ Features extras funcionando
- ✅ Documentação completa
- ✅ Projeto 100% pronto para produção

---

## 🏁 CRITÉRIOS DE SUCESSO

### ✅ **MÍNIMO VIÁVEL (MVP)**
- [x] Autenticação funcionando
- [x] Sistema de avatares completo
- [x] Batalhas PVP IA funcionais
- [x] Sistema de ranking e temporadas
- [x] Inventário e loja
- [ ] **RLS configurado (BLOCKER)**
- [ ] **Batalhas persistentes (BLOCKER)**

### ✅ **PRODUÇÃO READY**
- [ ] RLS em 100% das tabelas
- [ ] Batalhas salvas no DB
- [ ] Índices de performance criados
- [ ] Evolução de habilidades funcionando
- [ ] Testes de segurança OK
- [ ] Testes de performance OK
- [ ] Documentação completa

### ✅ **VERSÃO 1.0 COMPLETA**
- [ ] Todos os itens acima
- [ ] Histórico de necromante
- [ ] Estatísticas do jogador
- [ ] Análise de invocações
- [ ] Sistema de limpeza de dados
- [ ] Backup automatizado

---

## 🛠️ COMANDOS ÚTEIS

### Conectar ao Supabase
```bash
npx supabase login
npx supabase link --project-ref <YOUR_PROJECT_REF>
```

### Aplicar migrations
```bash
npx supabase db push
```

### Executar SQL no Supabase
```bash
npx supabase db execute --file database/migrations/001_add_rls.sql
```

### Testar RLS localmente
```bash
npx supabase start
npx supabase db reset
```

---

## 📞 PRÓXIMOS PASSOS IMEDIATOS

### 🚨 **FAZER AGORA (Próximas 24h):**

1. **Backup do banco atual**
   ```bash
   npx supabase db dump > backup_$(date +%Y%m%d).sql
   ```

2. **Criar branch para segurança**
   ```bash
   git checkout -b feature/rls-security
   ```

3. **Aplicar RLS básico**
   - Copiar SQL de RLS do documento
   - Executar no Supabase SQL Editor
   - Testar acesso com usuário real

4. **Testar aplicação**
   - Login
   - Invocar avatar
   - Batalha
   - Inventário
   - Ranking

5. **Se tudo OK, fazer merge**
   ```bash
   git add .
   git commit -m "Add Row Level Security policies"
   git push origin feature/rls-security
   ```

---

## 📚 DOCUMENTAÇÃO GERADA

1. **SUPABASE_SCHEMA_COMPLETE.md** - Schema completo do banco
2. **ANALISE_INTEGRACAO_CODIGO_DB.md** - Análise detalhada código ↔ DB
3. **PLANO_ACAO_EXECUTIVO.md** - Este documento

---

## ✅ APROVAÇÃO PARA PRODUÇÃO

Antes de fazer deploy em produção, verificar:

- [ ] RLS configurado e testado
- [ ] Batalhas persistindo corretamente
- [ ] Índices criados
- [ ] Backup configurado
- [ ] Testes de segurança OK
- [ ] Testes de performance OK
- [ ] Variáveis de ambiente corretas (usar ANON_KEY)
- [ ] Logs de erro configurados
- [ ] Monitoramento ativo

**Assinatura do Responsável:** _________________
**Data:** _____/_____/_____

---

**Última Atualização:** 2025-11-15
**Versão:** 1.0
**Responsável:** Claude Code Assistant
**Status:** 🟡 AGUARDANDO IMPLEMENTAÇÃO
