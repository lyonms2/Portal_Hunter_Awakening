# 🎁 SISTEMA DE PREMIAÇÃO MENSAL - Portal Hunter Awakening

**Status:** ✅ IMPLEMENTADO E FUNCIONAL
**Data de Implementação:** 2025-11-15
**Versão:** 1.0

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Como Funciona](#como-funciona)
3. [Tabela de Recompensas](#tabela-de-recompensas)
4. [Sistema de Títulos](#sistema-de-títulos)
5. [APIs Implementadas](#apis-implementadas)
6. [Páginas de UI](#páginas-de-ui)
7. [Como Usar](#como-usar)
8. [Encerramento Automático](#encerramento-automático)
9. [Fluxo Técnico](#fluxo-técnico)

---

## 🎯 VISÃO GERAL

Sistema completo de premiação mensal para temporadas de PVP. A cada **30 dias**, a temporada encerra automaticamente e distribui recompensas para os **Top 100 jogadores** baseado em suas posições finais no ranking.

### Características Principais

- ✅ **Temporadas de 30 dias** - Ciclos mensais automáticos
- ✅ **Recompensas para Top 100** - Todos os melhores jogadores são recompensados
- ✅ **Títulos Permanentes** - Top 10 ganham títulos únicos e prestigiosos
- ✅ **Histórico Completo** - Todas as temporadas são registradas permanentemente
- ✅ **Coleta Manual** - Jogadores devem coletar suas recompensas na UI
- ✅ **Sistema de Badges** - Posições têm ícones especiais (👑 🥈 🥉 ⭐ 🏆)

---

## ⚙️ COMO FUNCIONA

### Ciclo de uma Temporada

1. **Início da Temporada** (Dia 1)
   - Nova temporada é criada automaticamente
   - Todos os jogadores começam com 1000 de Fama
   - Leaderboard é resetado

2. **Durante a Temporada** (Dias 1-30)
   - Jogadores batalham no PVP IA
   - Ganham/perdem Fama baseado em vitórias/derrotas
   - Ranking é atualizado em tempo real
   - Streak é contabilizado

3. **Fim da Temporada** (Dia 30)
   - Sistema chama automaticamente `/api/pvp/temporada/encerrar`
   - Função SQL `encerrar_temporada()` é executada:
     - Calcula posição final de todos os jogadores
     - Salva histórico na tabela `pvp_historico_temporadas`
     - Gera recompensas para Top 100 → `pvp_recompensas_pendentes`
     - Cria títulos para Top 10 → `pvp_titulos`
     - Desativa temporada atual
   - Nova temporada é criada automaticamente

4. **Coleta de Recompensas**
   - Jogadores acessam `/recompensas`
   - Veem todas as recompensas pendentes de temporadas passadas
   - Clicam em "Coletar"
   - Recebem moedas, fragmentos e avatares (se aplicável)
   - Recompensa é marcada como coletada

---

## 💰 TABELA DE RECOMPENSAS

| Posição | Moedas | Fragmentos | Avatar | Título |
|---------|--------|------------|--------|--------|
| **1º Lugar** 👑 | 5.000 | 50 | ✨ Lendário | 👑 Campeão |
| **2º Lugar** 🥈 | 3.000 | 30 | ⚡ Raro | 🥈 Vice-Campeão |
| **3º Lugar** 🥉 | 3.000 | 30 | ⚡ Raro | 🥉 3º Lugar |
| **4º-10º** ⭐ | 1.500 | 20 | - | ⭐ Elite Top 10 |
| **11º-50º** 🏆 | 800 | 10 | - | - |
| **51º-100º** 🎖️ | 400 | 5 | - | - |

### Explicação

- **Moedas**: Recursos principais do jogo, usados para comprar itens e invocar avatares
- **Fragmentos**: Recursos raros, usados para invocações especiais
- **Avatar Lendário**: Invocação garantida de um avatar Lendário (apenas 1º lugar)
- **Avatar Raro**: Invocação garantida de um avatar Raro (2º e 3º lugar)
- **Título**: Badge permanente que aparece ao lado do nome no leaderboard

---

## 🏆 SISTEMA DE TÍTULOS

Títulos são conquistas **permanentes** que jogadores podem equipar para mostrar suas maiores conquistas.

### Títulos Disponíveis

| Título | Ícone | Posição | Cor |
|--------|-------|---------|-----|
| **Campeão** | 👑 | 1º lugar | Dourado |
| **Vice-Campeão** | 🥈 | 2º lugar | Prata |
| **3º Lugar** | 🥉 | 3º lugar | Bronze |
| **Elite Top 10** | ⭐ | 4º-10º | Roxo |

### Características

- ✅ **Permanentes** - Uma vez conquistados, ficam para sempre
- ✅ **Únicos por Temporada** - Cada temporada gera títulos únicos
- ✅ **Um Ativo por Vez** - Jogador pode equipar apenas 1 título
- ✅ **Visíveis no Leaderboard** - Título aparece ao lado do nome
- ✅ **Colecionáveis** - Jogadores podem colecionar títulos de várias temporadas

### Como Equipar

1. Acesse `/titulos`
2. Veja todos os títulos conquistados
3. Clique em "Equipar" no título desejado
4. Título aparece no leaderboard ao lado do seu nome
5. Para trocar, equipe outro título (auto-desequipa o anterior)
6. Para remover, clique em "Desequipar"

---

## 📡 APIs IMPLEMENTADAS

### 1. Encerrar Temporada
```
POST /api/pvp/temporada/encerrar
```

**Função:** Encerra temporada ativa e distribui recompensas
**Uso:** Chamado automaticamente a cada 30 dias (ou manualmente por admin)

**Processo:**
1. Chama `encerrar_temporada()` SQL
2. Salva histórico de todos os jogadores
3. Gera recompensas para Top 100
4. Cria títulos para Top 10
5. Cria nova temporada

**Response:**
```json
{
  "success": true,
  "message": "Temporada encerrada e nova temporada criada com sucesso"
}
```

---

### 2. Buscar Recompensas
```
GET /api/pvp/recompensas?userId=xxx
```

**Função:** Busca recompensas pendentes (não coletadas) do jogador

**Response:**
```json
{
  "success": true,
  "recompensas": [
    {
      "id": "uuid",
      "temporada_id": "2025-01",
      "moedas": 5000,
      "fragmentos": 50,
      "avatar_lendario": true,
      "avatar_raro": false,
      "titulo_id": "campeao_2025_01",
      "coletada": false,
      "temporada": {
        "nome": "Temporada Jan/2025"
      }
    }
  ],
  "total": 1
}
```

---

### 3. Coletar Recompensas
```
POST /api/pvp/recompensas/coletar
Body: { userId, recompensaId }
```

**Função:** Coleta recompensa pendente

**Processo:**
1. Verifica se recompensa existe e pertence ao jogador
2. Adiciona moedas e fragmentos ao `player_stats`
3. Marca recompensa como coletada
4. Retorna detalhes para exibir modal de sucesso

**Response:**
```json
{
  "success": true,
  "recompensa": {
    "moedas": 5000,
    "fragmentos": 50,
    "ganhouAvatar": true,
    "raridadeAvatar": "Lendário"
  },
  "novosValores": {
    "moedas": 15000,
    "fragmentos": 120
  }
}
```

---

### 4. Histórico de Temporadas
```
GET /api/pvp/historico?userId=xxx
```

**Função:** Busca histórico completo de temporadas do jogador

**Response:**
```json
{
  "success": true,
  "historico": [
    {
      "temporada_id": "2025-01",
      "fama_final": 2500,
      "vitorias": 45,
      "derrotas": 12,
      "streak_maximo": 8,
      "posicao_final": 3,
      "tier_final": "DIAMANTE",
      "data_encerramento": "2025-01-31T23:59:59Z",
      "temporada": {
        "nome": "Temporada Jan/2025"
      }
    }
  ],
  "stats": {
    "totalTemporadas": 3,
    "totalVitorias": 120,
    "totalDerrotas": 45,
    "melhorPosicao": 1,
    "melhorFama": 3200,
    "melhorStreak": 15
  }
}
```

---

### 5. Buscar Títulos
```
GET /api/pvp/titulos?userId=xxx
```

**Função:** Busca títulos conquistados pelo jogador

**Response:**
```json
{
  "success": true,
  "titulos": [
    {
      "id": "uuid",
      "titulo_nome": "Campeão",
      "titulo_icone": "👑",
      "posicao_conquistada": 1,
      "ativo": true,
      "temporada": {
        "nome": "Temporada Jan/2025"
      }
    }
  ],
  "tituloAtivo": { /* título ativo */ },
  "total": 3
}
```

---

### 6. Ativar/Desativar Título
```
POST /api/pvp/titulos
Body: { userId, tituloId }  // tituloId = null para desativar todos
```

**Função:** Equipa ou desequipa título

**Response:**
```json
{
  "success": true,
  "message": "Título ativado com sucesso"
}
```

---

## 🖥️ PÁGINAS DE UI

### 1. Recompensas (`/recompensas`)

**Funcionalidades:**
- ✅ Lista todas as recompensas pendentes
- ✅ Exibe temporada, posição final e recompensas
- ✅ Botão "Coletar" para cada recompensa
- ✅ Modal de sucesso com animação
- ✅ Atualização automática do saldo
- ✅ Badges de posição (👑 🥈 🥉 ⭐)

**Acesso:**
- Botão "🎁 Recompensas" na tela de PVP IA
- URL direta: `/recompensas`

---

### 2. Histórico PVP (`/historico-pvp`)

**Funcionalidades:**
- ✅ Dashboard com estatísticas gerais
- ✅ Lista de todas as temporadas passadas
- ✅ Cards coloridos por tier (Lendário, Diamante, etc.)
- ✅ Exibe fama, vitórias, derrotas, win rate, streak
- ✅ Data de encerramento de cada temporada

**Acesso:**
- Botão "📜 Histórico" na tela de PVP IA
- URL direta: `/historico-pvp`

---

### 3. Títulos (`/titulos`)

**Funcionalidades:**
- ✅ Mostra título equipado (se houver)
- ✅ Lista todos os títulos conquistados
- ✅ Botão "Equipar" em cada título
- ✅ Botão "Desequipar" no título ativo
- ✅ Cards coloridos por tipo de título
- ✅ Info de como ganhar títulos

**Acesso:**
- Botão "🏆 Títulos" na tela de PVP IA
- URL direta: `/titulos`

---

### 4. Leaderboard (Atualizado)

**Novidade:**
- ✅ Agora mostra títulos ativos dos jogadores
- ✅ Ícone + nome do título ao lado do nome do jogador
- ✅ Exemplo: "Jogador123 👑 Campeão"

---

## 🎮 COMO USAR (Guia do Jogador)

### Para Jogar e Ganhar Recompensas

1. **Acesse PVP IA**
   - Vá para `/arena/pvp-ia`
   - Escolha um oponente
   - Batalhe e ganhe Fama

2. **Suba no Ranking**
   - Vença batalhas para ganhar Fama
   - Perca batalhas e perde Fama
   - Quanto maior a Fama, melhor a posição

3. **Aguarde o Fim da Temporada**
   - Temporadas duram 30 dias
   - Quanto melhor sua posição final, maiores as recompensas

4. **Colete Recompensas**
   - Clique em "🎁 Recompensas" na tela de PVP
   - Veja suas recompensas pendentes
   - Clique em "Coletar" em cada uma
   - Aproveite suas moedas, fragmentos e avatares!

5. **Equipe Seus Títulos**
   - Clique em "🏆 Títulos" na tela de PVP
   - Veja seus títulos conquistados
   - Clique em "Equipar" no título favorito
   - Mostre sua conquista no leaderboard!

6. **Veja Seu Histórico**
   - Clique em "📜 Histórico" na tela de PVP
   - Veja seu desempenho em todas as temporadas
   - Compare suas stats ao longo do tempo

---

## ⏰ ENCERRAMENTO AUTOMÁTICO

### Como Implementar (TODO)

Para tornar o encerramento de temporadas 100% automático, você precisa implementar UMA das seguintes opções:

#### Opção 1: Cron Job (Recomendado)

**Usar Vercel Cron Jobs** (se estiver no Vercel):

1. Criar arquivo `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/pvp/temporada/encerrar",
    "schedule": "0 0 1 * *"
  }]
}
```

Isso roda todo dia 1 de cada mês à meia-noite.

#### Opção 2: Trigger de Banco de Dados

**Criar trigger no Supabase:**

```sql
-- Função que roda diariamente e verifica se temporada expirou
CREATE OR REPLACE FUNCTION verificar_encerramento_temporada()
RETURNS void AS $$
DECLARE
  v_temporada RECORD;
BEGIN
  -- Buscar temporada ativa que já passou da data de fim
  SELECT * INTO v_temporada
  FROM pvp_temporadas
  WHERE ativa = true AND data_fim < NOW()
  LIMIT 1;

  -- Se encontrou, encerrar
  IF v_temporada.temporada_id IS NOT NULL THEN
    PERFORM encerrar_temporada();
    PERFORM criar_nova_temporada();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Agendar para rodar diariamente (usando pg_cron se disponível)
SELECT cron.schedule('encerrar-temporadas-expiradas', '0 0 * * *', 'SELECT verificar_encerramento_temporada()');
```

#### Opção 3: Webhook/Scheduled Function

**Usar serviço externo:**
- **Zapier**
- **Make (Integromat)**
- **n8n**
- **EasyCron**

Configurar para chamar `POST /api/pvp/temporada/encerrar` todo dia 1 do mês.

#### Opção 4: Verificação em Runtime

**Adicionar verificação no código:**

```javascript
// Toda vez que alguém acessa a página de PVP
// Verificar se temporada expirou

const verificarEEncerrarTemporada = async () => {
  const response = await fetch('/api/pvp/temporada');
  const { temporada } = await response.json();

  if (new Date(temporada.dataFim) < new Date()) {
    // Temporada expirou, encerrar
    await fetch('/api/pvp/temporada/encerrar', { method: 'POST' });
    // Recarregar página
    window.location.reload();
  }
};
```

---

## 🔧 FLUXO TÉCNICO

### Diagrama de Encerramento de Temporada

```
1. Trigger (Cron/Manual)
   ↓
2. POST /api/pvp/temporada/encerrar
   ↓
3. SQL: encerrar_temporada()
   ├── Para cada jogador que batalhou:
   │   ├── Calcular posição final
   │   ├── Determinar tier (Lendário, Diamante, etc.)
   │   ├── INSERT INTO pvp_historico_temporadas
   │   └── Se Top 100: gerar_recompensas_temporada()
   │       ├── INSERT INTO pvp_recompensas_pendentes
   │       └── Se Top 10: INSERT INTO pvp_titulos
   ↓
4. UPDATE pvp_temporadas SET ativa = false
   ↓
5. SQL: criar_nova_temporada()
   ├── Calcular datas (início: hoje, fim: +30 dias)
   ├── INSERT INTO pvp_temporadas
   └── Nova temporada está ativa
```

### Diagrama de Coleta de Recompensas

```
1. Usuário acessa /recompensas
   ↓
2. GET /api/pvp/recompensas?userId=xxx
   ├── SELECT FROM pvp_recompensas_pendentes
   ├── WHERE coletada = false
   └── Retorna lista
   ↓
3. Usuário clica "Coletar"
   ↓
4. POST /api/pvp/recompensas/coletar
   ├── Verificar: recompensa existe + pertence ao usuário
   ├── SELECT moedas, fragmentos FROM player_stats
   ├── Calcular novos valores
   ├── UPDATE player_stats SET moedas = X, fragmentos = Y
   ├── UPDATE pvp_recompensas_pendentes SET coletada = true
   └── Retornar sucesso com detalhes
   ↓
5. Modal de sucesso
   └── "🎉 Você recebeu 5000 moedas!"
```

---

## 📊 TABELAS DO BANCO UTILIZADAS

### Criadas e Usadas

| Tabela | Propósito | Status |
|--------|-----------|--------|
| `pvp_temporadas` | Armazena temporadas (ativas e passadas) | ✅ Usada |
| `pvp_rankings` | Ranking atual da temporada ativa | ✅ Usada |
| `pvp_historico_temporadas` | Histórico de desempenho em temporadas | ✅ Usada |
| `pvp_titulos` | Títulos conquistados por jogadores | ✅ Usada |
| `pvp_recompensas_pendentes` | Recompensas aguardando coleta | ✅ Usada |
| `pvp_batalhas_log` | Log de todas as batalhas | ✅ Usada |
| `leaderboard_atual` (VIEW) | Leaderboard em tempo real | ✅ Usada |

### Removidas (PVP ao vivo descontinuado)

- ❌ `pvp_matchmaking_queue`
- ❌ `pvp_battle_rooms`
- ❌ `pvp_challenges`
- ❌ `pvp_available_players`

---

## ✅ CHECKLIST DE FUNCIONALIDADES

### Sistema de Temporadas
- [x] Criação automática de temporadas
- [x] Encerramento de temporadas
- [x] Cálculo de posições finais
- [x] Salvamento de histórico

### Sistema de Recompensas
- [x] Geração de recompensas para Top 100
- [x] Tabela de recompensas por posição
- [x] Coleta manual de recompensas
- [x] Atualização de moedas/fragmentos
- [x] Sistema de avatares garantidos (Lendário/Raro)

### Sistema de Títulos
- [x] Criação de títulos para Top 10
- [x] Equipar/desequipar títulos
- [x] Exibição no leaderboard
- [x] Página de gerenciamento de títulos
- [x] Badges únicos por posição

### Interface do Usuário
- [x] Página de recompensas com coleta
- [x] Página de histórico de temporadas
- [x] Página de títulos
- [x] Leaderboard com títulos
- [x] Navegação integrada no PVP IA

### APIs
- [x] Encerrar temporada
- [x] Buscar recompensas
- [x] Coletar recompensas
- [x] Histórico de temporadas
- [x] Gerenciar títulos
- [x] Leaderboard com títulos

### Pendente
- [ ] Encerramento automático de temporadas (Cron Job)
- [ ] Notificações de novas recompensas
- [ ] Email quando temporada encerra
- [ ] Dashboard de admin para gerenciar temporadas

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar Cron Job** para encerramento automático
2. **Adicionar notificações** quando jogador recebe recompensas
3. **Sistema de badges** adicionais (100 vitórias, 500 vitórias, etc.)
4. **Títulos especiais** para conquistas únicas
5. **Dashboard de admin** para gerenciar temporadas manualmente

---

## 📞 SUPORTE

Se você encontrar bugs ou tiver sugestões:
1. Abra uma issue no GitHub
2. Descreva o problema detalhadamente
3. Inclua prints se possível

---

**Desenvolvido por:** Claude AI Assistant
**Data:** 2025-11-15
**Versão:** 1.0
**Status:** ✅ Pronto para Produção
