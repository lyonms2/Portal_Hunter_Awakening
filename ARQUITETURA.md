# 🏗️ Arquitetura do Portal Hunter Awakening

Este documento explica em detalhes a estrutura de pastas, módulos e a organização do código do projeto.

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Estrutura de Pastas Completa](#estrutura-de-pastas-completa)
3. [Módulo: /app (Frontend e API)](#módulo-app-frontend-e-api)
4. [Módulo: /lib (Bibliotecas Compartilhadas)](#módulo-lib-bibliotecas-compartilhadas)
5. [Módulo: /database (SQL e Schema)](#módulo-database-sql-e-schema)
6. [Módulo: /components (Componentes Globais)](#módulo-components-componentes-globais)
7. [Configurações do Projeto](#configurações-do-projeto)
8. [Fluxo de Dados](#fluxo-de-dados)

---

## Visão Geral da Arquitetura

Portal Hunter Awakening utiliza uma **arquitetura moderna baseada em Next.js 14** com App Router:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                     │
│  Next.js Pages (React) + Tailwind CSS + Client JS       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/HTTPS
                     │
┌────────────────────▼────────────────────────────────────┐
│              NEXT.JS SERVER (Vercel/Node)               │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  API Routes (Serverless Functions)             │    │
│  │  - /api/mercado/*                              │    │
│  │  - /api/pvp/*                                  │    │
│  │  - /api/inventario/*                           │    │
│  │  - ...                                         │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────┐    │
│  │  Bibliotecas Compartilhadas (/lib)             │    │
│  │  - Motor de Batalha                            │    │
│  │  - Lógica de Negócio                           │    │
│  │  - Utilitários                                 │    │
│  └────────────────┬───────────────────────────────┘    │
└───────────────────┼──────────────────────────────────────┘
                    │
                    │ Supabase Client SDK
                    │
┌───────────────────▼──────────────────────────────────────┐
│                  SUPABASE (Backend)                       │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  PostgreSQL Database                            │    │
│  │  - 15 Tabelas                                   │    │
│  │  - Views e Triggers                             │    │
│  │  - RPC Functions                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Auth (Autenticação)                            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Realtime (Subscriptions)                       │    │
│  └─────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

### Padrões de Arquitetura Utilizados

1. **Separation of Concerns** - Frontend, API e lógica de negócio separados
2. **API-First** - Todas as operações passam por APIs REST
3. **Server-Side Rendering (SSR)** - Next.js renderiza no servidor quando necessário
4. **Client-Side State Management** - React hooks (useState, useEffect)
5. **Database-First** - Schema robusto com constraints e triggers
6. **Atomic Transactions** - Operações críticas via RPC do PostgreSQL

---

## Estrutura de Pastas Completa

```
Portal_Hunter_Awakening/
│
├── app/                          # 🎯 Next.js App Router (Frontend + API)
│   ├── api/                      # 🔌 API Routes (Backend)
│   ├── avatares/                 # 📄 Página de avatares
│   ├── arena/                    # ⚔️ Sistema de arena
│   ├── mercado/                  # 🛒 Mercado de avatares
│   ├── dashboard/                # 📊 Dashboard principal
│   ├── login/                    # 🔐 Login
│   ├── cadastro/                 # 📝 Cadastro
│   ├── components/               # 🧩 Componentes locais
│   ├── lib/                      # 📚 Bibliotecas do app
│   ├── layout.tsx                # 🎨 Layout raiz
│   ├── page.tsx                  # 🏠 Página inicial
│   └── globals.css               # 🎨 Estilos globais
│
├── lib/                          # 📦 Bibliotecas Compartilhadas
│   ├── arena/                    # Motor de batalha
│   ├── pvp/                      # Lógica de PVP
│   ├── combat/                   # Cálculos de combate
│   ├── supabase/                 # Cliente Supabase
│   ├── utils/                    # Utilitários
│   └── gameLogic.js              # Lógica geral do jogo
│
├── database/                     # 💾 Scripts SQL e Documentação
│   ├── *.sql                     # Scripts SQL
│   └── *.md                      # Documentação do banco
│
├── components/                   # 🧩 Componentes React Globais
│   └── BackgroundEffects.tsx
│
├── supabase/                     # 🗄️ Configuração do Supabase
│   └── migrations/               # Migrações do banco
│
├── public/                       # 📁 Arquivos Estáticos
│   └── favicon.svg
│
├── scripts/                      # 🛠️ Scripts Auxiliares
│   └── *.js
│
├── next.config.mjs               # ⚙️ Configuração do Next.js
├── tailwind.config.js            # 🎨 Configuração do Tailwind
├── tsconfig.json                 # 📘 Configuração do TypeScript
├── package.json                  # 📦 Dependências do projeto
└── README.md                     # 📖 Documentação principal
```

---

## Módulo: /app (Frontend e API)

O diretório `/app` segue o **Next.js App Router** (Next.js 14+), onde cada pasta representa uma rota.

### Estrutura do /app

```
app/
├── api/                    # 🔌 Backend (API Routes)
├── [páginas]/              # 📄 Frontend (React Pages)
├── components/             # 🧩 Componentes locais do app
├── lib/                    # 📚 Bibliotecas específicas do app
├── layout.tsx              # 🎨 Layout principal
├── page.tsx                # 🏠 Página inicial (/)
└── globals.css             # 🎨 Estilos globais
```

---

### 🔌 /app/api - API Routes (Backend)

Todas as operações de backend são realizadas através de **API Routes serverless**.

#### Estrutura das APIs

```
app/api/
├── mercado/
│   ├── listar/
│   │   └── route.js       # GET - Listar avatares à venda
│   ├── vender/
│   │   └── route.js       # POST/DELETE - Vender/Cancelar venda
│   └── comprar/
│       └── route.js       # POST - Comprar avatar
│
├── pvp/
│   ├── temporada/
│   │   ├── route.js       # GET - Info da temporada
│   │   └── encerrar/
│   │       └── route.js   # POST - Encerrar temporada
│   ├── ranking/
│   │   └── route.js       # GET - Ranking do jogador
│   ├── leaderboard/
│   │   └── route.js       # GET - Leaderboard completo
│   ├── batalha/
│   │   └── route.js       # POST - Registrar batalha
│   ├── historico/
│   │   └── route.js       # GET - Histórico de temporadas
│   ├── recompensas/
│   │   ├── route.js       # GET - Listar recompensas
│   │   └── coletar/
│   │       └── route.js   # POST - Coletar recompensas
│   ├── titulos/
│   │   └── route.js       # GET/POST - Gerenciar títulos
│   └── ia/
│       ├── oponentes/
│       │   └── route.js   # GET - Buscar oponentes IA
│       ├── batalha/
│       │   └── route.js   # POST - Batalha contra IA
│       ├── finalizar/
│       │   └── route.js   # POST - Finalizar batalha
│       └── leaderboard/
│           └── route.js   # GET - Leaderboard PVP IA
│
├── inventario/
│   ├── route.js           # GET - Listar inventário
│   ├── loja/
│   │   └── route.js       # GET - Listar loja
│   └── comprar/
│       └── route.js       # POST - Comprar item
│
├── arena/
│   └── treino/
│       └── iniciar/
│           └── route.js   # POST - Iniciar treino
│
├── cadastro/
│   └── route.js           # POST - Cadastro de jogador
├── login/
│   └── route.js           # POST - Login
├── inicializar-jogador/
│   └── route.js           # POST - Inicializar dados do jogador
├── atualizar-nome/
│   └── route.js           # PUT - Atualizar nome de operação
├── atualizar-stats/
│   └── route.js           # PUT - Atualizar stats
├── atualizar-avatar/
│   └── route.js           # PUT - Atualizar avatar
├── meus-avatares/
│   └── route.js           # GET/PUT - Listar/Ativar avatares
├── buscar-avatar/
│   └── route.js           # GET - Buscar avatar específico
├── invocar-avatar/
│   └── route.js           # POST - Invocar novo avatar
├── descansar-avatar/
│   └── route.js           # POST - Descansar avatar
├── merge-avatares/
│   └── route.js           # POST - Fusão de avatares
├── sacrificar-avatar/
│   └── route.js           # POST - Sacrificar avatar
├── ressuscitar-avatar/
│   └── route.js           # POST - Ressurreição
└── purificar-avatar/
    └── route.js           # POST - Purificação
```

#### Padrão de API Route

Todas as APIs seguem este padrão:

```javascript
// app/api/exemplo/route.js
import { createClient } from '@/lib/supabase/serverClient';

export async function POST(request) {
  try {
    // 1. Parse do body
    const body = await request.json();
    const { campo1, campo2 } = body;

    // 2. Criar cliente Supabase (server-side)
    const supabase = createClient();

    // 3. Validações de entrada
    if (!campo1) {
      return Response.json(
        { error: 'Campo obrigatório' },
        { status: 400 }
      );
    }

    // 4. Operações no banco de dados
    const { data, error } = await supabase
      .from('tabela')
      .insert({ campo1, campo2 });

    if (error) throw error;

    // 5. Retorno de sucesso
    return Response.json({
      success: true,
      data
    });

  } catch (error) {
    // 6. Tratamento de erros
    console.error('Erro:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

#### APIs Críticas Explicadas

##### 🛒 /api/mercado/comprar

**Arquivo:** `app/api/mercado/comprar/route.js`

**Função:** Comprar um avatar do mercado de forma **atômica**.

**Fluxo:**
1. Recebe `avatarId` e `userId`
2. Busca informações do avatar à venda
3. Valida se está disponível e se comprador tem moedas
4. **Chama RPC `executar_compra_avatar`** (transação atômica no PostgreSQL)
5. RPC executa:
   - Lock pessimista no avatar (`FOR UPDATE`)
   - Deduz moedas do comprador
   - Calcula taxa de 5% e adiciona ao vendedor
   - Transfere avatar (muda `user_id`)
   - Reseta `em_venda`, `vínculo`, `exaustão`
   - Registra transação em `mercado_transacoes`
   - Se qualquer etapa falhar, rollback automático
6. Retorna sucesso ou erro

**Por que é crítica:** Evita race conditions (dois compradores simultâneos).

##### ⚔️ /api/pvp/ia/finalizar

**Arquivo:** `app/api/pvp/ia/finalizar/route.js`

**Função:** Finalizar batalha PVP contra IA e aplicar resultados.

**Fluxo:**
1. Recebe `userId`, `oponenteId`, `vencedorId`, `estadoBatalha`
2. Valida se batalha foi legítima
3. Calcula ganho/perda de Fama (ELO):
   - Base: +20 vitória, -15 derrota
   - Bônus Upset (underdog vence): +5 a +20
   - Bônus Streak: +2 (a cada 3 vitórias)
4. Atualiza `pvp_rankings`:
   - Fama
   - Vitorias/Derrotas
   - Streak
5. Calcula recompensas:
   - Moedas: 50-200 (baseado em fama)
   - Fragmentos: 5-20
   - XP para avatar: variável
6. Atualiza avatar (XP, vínculo, exaustão)
7. Aplica morte ou incapacitação (30% / 70%)
8. Registra log em `pvp_batalhas_log`
9. Retorna resultado completo

**Por que é crítica:** Coordena múltiplas tabelas (rankings, avatares, stats) com lógica complexa.

##### 🎁 /api/pvp/recompensas/coletar

**Arquivo:** `app/api/pvp/recompensas/coletar/route.js`

**Função:** Coletar recompensas de fim de temporada.

**Fluxo:**
1. Busca recompensa pendente não coletada do jogador
2. Valida se existe e não foi coletada
3. **Inicia transação:**
   - Adiciona moedas e fragmentos ao `player_stats`
   - Se tiver avatar lendário/raro na recompensa, invoca avatar
   - Se tiver título, insere em `pvp_titulos`
   - Marca recompensa como coletada
4. Retorna detalhes da recompensa coletada

**Por que é crítica:** Garante que recompensas sejam entregues atomicamente.

---

### 📄 /app/[páginas] - Frontend (React Pages)

Cada pasta em `/app` (exceto `/api`) representa uma rota/página.

#### Estrutura das Páginas

```
app/
├── dashboard/
│   └── page.jsx          # /dashboard - Hub principal
├── avatares/
│   ├── page.jsx          # /avatares - Coleção de avatares
│   ├── components/       # Componentes específicos
│   │   ├── AvatarCard.jsx
│   │   ├── AvatarDetalhes.jsx
│   │   └── AvatarAtivo.jsx
│   └── sistemas/         # Lógica de avatares
│       ├── statsSystem.js
│       ├── progressionSystem.js
│       ├── bondSystem.js
│       ├── exhaustionSystem.js
│       ├── elementalSystem.js
│       ├── abilitiesSystem.js
│       └── loreSystem.js
├── arena/
│   ├── page.jsx          # /arena - Hub da arena
│   ├── treinamento/
│   │   └── page.jsx      # /arena/treinamento
│   ├── batalha/
│   │   └── page.jsx      # /arena/batalha (PVE)
│   ├── batalha-teste/
│   │   └── page.jsx      # /arena/batalha-teste
│   ├── sobrevivencia/
│   │   └── page.jsx      # /arena/sobrevivencia
│   ├── leaderboard/
│   │   └── page.jsx      # /arena/leaderboard
│   └── pvp-ia/
│       ├── page.jsx      # /arena/pvp-ia
│       ├── batalha/
│       │   └── page.jsx  # /arena/pvp-ia/batalha
│       └── leaderboard/
│           └── page.jsx  # /arena/pvp-ia/leaderboard
├── mercado/
│   └── page.jsx          # /mercado - Mercado de avatares
├── inventario/
│   └── page.jsx          # /inventario - Inventário
├── ocultista/
│   └── page.jsx          # /ocultista - Invocação
├── necromante/
│   └── page.jsx          # /necromante - Ressurreição
├── purificador/
│   └── page.jsx          # /purificador - Purificação
├── merge/
│   └── page.jsx          # /merge - Fusão de avatares
├── memorial/
│   └── page.jsx          # /memorial - Memorial de caídos
├── historico-pvp/
│   └── page.jsx          # /historico-pvp
├── recompensas/
│   └── page.jsx          # /recompensas
├── titulos/
│   └── page.jsx          # /titulos
├── missoes/
│   └── page.jsx          # /missoes (em desenvolvimento)
├── login/
│   └── page.jsx          # /login
├── cadastro/
│   └── page.jsx          # /cadastro
├── layout.tsx            # Layout raiz (header, footer)
└── page.tsx              # / - Landing page
```

#### Padrão de Página React

Todas as páginas seguem este padrão:

```javascript
// app/exemplo/page.jsx
'use client'; // Sempre client component para interatividade

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExemploPage() {
  // 1. Estados
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Router para navegação
  const router = useRouter();

  // 3. useEffect para carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/exemplo');
        const result = await res.json();

        if (result.error) throw new Error(result.error);

        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // 4. Handlers de ações
  const handleAction = async () => {
    try {
      const res = await fetch('/api/acao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campo: 'valor' })
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // Atualizar estado
      setData(result.data);
    } catch (err) {
      alert(err.message);
    }
  };

  // 5. Renderização condicional
  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  // 6. Renderização principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">
          Título da Página
        </h1>

        {/* Conteúdo aqui */}

        <button
          onClick={handleAction}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg"
        >
          Ação
        </button>
      </div>
    </div>
  );
}
```

#### Páginas Críticas Explicadas

##### 📊 /app/dashboard/page.jsx

**Função:** Hub principal do jogo. Central de comando do jogador.

**O que exibe:**
- Nome do jogador e recursos (💰 moedas, 💎 fragmentos)
- Avatar ativo atual com stats
- Links para todas as funcionalidades:
  - Ocultista, Necromante, Purificador
  - Avatares, Mercado, Inventário
  - Arena (Treino, PVE, PVP IA)
  - Histórico, Recompensas, Títulos

**Fluxo:**
1. Carrega `player_stats` da API
2. Carrega avatar ativo da API
3. Exibe cards com navegação

##### 🛒 /app/mercado/page.jsx

**Função:** Mercado de avatares entre jogadores.

**Funcionalidades:**
- **Listar avatares à venda** com filtros (raridade, elemento, nível, preço)
- **Ver detalhes** de um avatar (modal)
- **Comprar avatar** (chama `/api/mercado/comprar`)
- **Vender seus avatares** (modal de seleção + definir preço)
- **Cancelar venda** de seus avatares

**Fluxo de Compra:**
1. Usuário clica em "Comprar"
2. Confirma ação
3. Chama API `/api/mercado/comprar`
4. API executa RPC atômica
5. Atualiza lista de avatares

**Fluxo de Venda:**
1. Usuário clica em "Vender Avatar"
2. Abre modal com seus avatares
3. Seleciona avatar e define preço (💰 e/ou 💎)
4. Chama API `/api/mercado/vender`
5. Avatar aparece na lista do mercado

##### ⚔️ /app/arena/pvp-ia/batalha/page.jsx

**Função:** Tela de batalha contra IA.

**Componentes:**
- **Barra de HP** de ambos os avatares
- **Barra de Energia** do jogador
- **Histórico de ações** (log de combate)
- **Botões de ação** (Ataque, Habilidade, Defender, Esperar)
- **Seletor de habilidades** (modal)
- **Efeitos de status** ativos
- **Resultado final** (modal de vitória/derrota)

**Fluxo:**
1. Recebe `oponenteId` via query params
2. Carrega avatar do jogador e oponente
3. Inicializa motor de batalha (`lib/pvp/ai-engine.js`)
4. Loop de batalha:
   - Jogador escolhe ação
   - IA escolhe ação (automático)
   - Processa rodada
   - Atualiza estado (HP, energia, efeitos)
   - Verifica condição de vitória
5. Ao finalizar, chama `/api/pvp/ia/finalizar`
6. Exibe resultado (fama ganha, recompensas, XP)

##### 🧙 /app/avatares/page.jsx

**Função:** Coleção de avatares do jogador.

**Funcionalidades:**
- **Listar todos os avatares** (vivos e mortos separados)
- **Visualizar detalhes** (modal completo)
- **Ativar avatar** (troca o avatar ativo)
- **Descansar avatar** (reduz exaustão)
- **Ver stats, vínculo, exaustão, habilidades**

**Componentes:**
- `AvatarCard.jsx` - Card visual do avatar
- `AvatarDetalhes.jsx` - Modal com todos os detalhes
- `AvatarAtivo.jsx` - Componente do avatar ativo

**Sistemas Importados:**
- `statsSystem.js` - Cálculo de stats finais
- `progressionSystem.js` - XP e níveis
- `bondSystem.js` - Modificadores de vínculo
- `exhaustionSystem.js` - Penalidades de exaustão
- `elementalSystem.js` - Vantagens elementais
- `abilitiesSystem.js` - Geração de habilidades
- `loreSystem.js` - Geração de lore

---

### 🧩 /app/components

Componentes React específicos do módulo `/app`.

```
app/components/
└── AvatarSVG.jsx    # Gerador procedural de SVG de avatar
```

#### AvatarSVG.jsx

**Função:** Gera uma representação visual SVG única de um avatar baseada em suas características.

**Entrada:**
```javascript
<AvatarSVG
  nome="Avatar do Fogo"
  elemento="Fogo"
  raridade="Lendário"
  nivel={25}
/>
```

**Saída:** SVG procedural com cores baseadas em elemento e raridade.

---

### 📚 /app/lib

Bibliotecas e utilitários específicos do módulo `/app`.

```
app/lib/
└── supabase.js    # Cliente Supabase para client-side
```

#### supabase.js

**Função:** Cria cliente Supabase para uso em componentes client-side.

```javascript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();
```

**Uso:**
```javascript
import { supabase } from '@/app/lib/supabase';

const { data } = await supabase.from('avatares').select('*');
```

---

## Módulo: /lib (Bibliotecas Compartilhadas)

O diretório `/lib` contém toda a **lógica de negócio** reutilizável do jogo.

### Estrutura do /lib

```
lib/
├── arena/
│   ├── batalhaEngine.js      # Motor de batalha PVE
│   ├── iaEngine.js           # IA de combate PVE
│   └── recompensasCalc.js    # Cálculo de recompensas
├── pvp/
│   ├── ai-engine.js          # IA para PVP
│   ├── battleSync.js         # Sincronização de batalhas
│   ├── leaderboardSystem.js  # Sistema de leaderboard
│   ├── rankingSystem.js      # Cálculo de fama (ELO)
│   └── seasonSystem.js       # Gerenciamento de temporadas
├── combat/
│   └── statsCalculator.js    # Cálculos de stats de combate
├── supabase/
│   └── serverClient.js       # Cliente Supabase server-side
├── utils/
│   └── progressUtils.js      # Utilidades de progressão
└── gameLogic.js              # Lógica geral do jogo
```

---

### 🎮 /lib/arena

#### batalhaEngine.js

**Função:** Motor principal de batalha PVE.

**Exporta:**
- `iniciarBatalha(avatarJogador, avatarOponente)` - Inicializa estado da batalha
- `processarRodada(estadoBatalha, acaoJogador, acaoIA)` - Processa uma rodada
- `calcularDano(atacante, defensor, tipoAtaque)` - Calcula dano
- `aplicarEfeito(alvo, efeito)` - Aplica efeito de status
- `verificarVitoria(estadoBatalha)` - Verifica condição de fim

**Exemplo:**
```javascript
import { iniciarBatalha, processarRodada } from '@/lib/arena/batalhaEngine';

const estado = iniciarBatalha(meuAvatar, oponente);

while (!estado.finalizada) {
  const acaoJogador = { tipo: 'ataque_basico' };
  const acaoIA = iaEngine.escolherAcao(estado);

  processarRodada(estado, acaoJogador, acaoIA);
}
```

#### iaEngine.js

**Função:** Inteligência artificial para oponentes PVE.

**Exporta:**
- `escolherAcao(estadoBatalha, personalidade)` - IA escolhe ação

**Personalidades:**
- `agressivo` - Sempre ataca
- `defensivo` - Prioriza defender/curar
- `tatico` - Analisa fraquezas
- `equilibrado` - Balanceado
- `imprevisivel` - Aleatório

#### recompensasCalc.js

**Função:** Calcula recompensas de batalhas.

**Exporta:**
- `calcularRecompensas(resultado, dificuldade)` - Retorna moedas, fragmentos, XP

---

### 🏆 /lib/pvp

#### ai-engine.js

**Função:** IA específica para batalhas PVP.

**Diferença do iaEngine.js:** Mais sofisticado, considera fama e stats detalhados.

**Exporta:**
- `criarOponenteIA(fama, usuario)` - Gera oponente balanceado
- `escolherAcaoInteligente(estado)` - IA avançada

#### rankingSystem.js

**Função:** Sistema de fama (ELO) e ranking.

**Exporta:**
- `calcularGanhoFama(famaJogador, famaOponente, vitoria)` - Calcula +/- fama
- `calcularBonusUpset(diferencaFama)` - Bônus underdog
- `calcularBonusStreak(streak)` - Bônus de sequência
- `determinarTier(fama)` - Bronze, Prata, Ouro, etc

**Fórmulas:**
```javascript
// Base
const base = vitoria ? 20 : -15;

// Upset (underdog vence)
let bonusUpset = 0;
const diff = Math.abs(famaJogador - famaOponente);
if (vitoria && famaJogador < famaOponente) {
  if (diff > 1000) bonusUpset = 20;
  else if (diff > 500) bonusUpset = 10;
  else if (diff > 200) bonusUpset = 5;
}

// Streak (a cada 3 vitórias)
const bonusStreak = Math.min(Math.floor(streak / 3) * 2, 10);

return base + bonusUpset + bonusStreak;
```

#### seasonSystem.js

**Função:** Gerenciamento de temporadas mensais.

**Exporta:**
- `obterTemporadaAtual()` - Retorna temporada atual (YYYY-MM)
- `criarNovaTemporada()` - Cria nova temporada
- `encerrarTemporada(temporadaId)` - Encerra e distribui recompensas
- `calcularRecompensas(posicao, fama)` - Calcula recompensas por posição

**Distribuição de Recompensas:**
```javascript
const recompensas = {
  1: { moedas: 5000, fragmentos: 50, avatar: 'lendario', titulo: 'Campeão' },
  2: { moedas: 3000, fragmentos: 30, avatar: 'raro', titulo: 'Vice-Campeão' },
  3: { moedas: 3000, fragmentos: 30, avatar: 'raro', titulo: '3º Lugar' },
  // 4-10: Elite Top 10
  // 11-50: Recompensas menores
  // 51-100: Recompensas básicas
};
```

#### leaderboardSystem.js

**Função:** Sistema de leaderboard completo.

**Exporta:**
- `obterLeaderboard(temporadaId, limit)` - Retorna ranking completo
- `obterPosicaoJogador(userId, temporadaId)` - Posição específica
- `obterTop100()` - Top 100 para distribuição

---

### ⚔️ /lib/combat

#### statsCalculator.js

**Função:** Cálculos centralizados de stats de combate.

**Exporta:**
- `calcularHPMaximo(avatar)` - HP = (Resistência × 10) + (Nível × 5)
- `calcularDanoFisico(avatar)` - Dano = (Força × 1.0) + (Nível × 2)
- `calcularDanoMagico(avatar)` - Dano = (Foco × 1.2) + (Nível × 2.5)
- `calcularEvasao(avatar)` - Evasão% = (Agilidade × 0.5) [Max 75%]
- `calcularCritico(avatar)` - Crítico% = (Foco × 0.3) [Max 50%]
- `calcularReducaoDano(avatar)` - Redução% = (Resistência × 0.5)

**Modificadores Aplicados:**
- Vínculo (0-100): -10% a +15%
- Exaustão (0-100): 0% a -35%
- Efeitos de status temporários

**Exemplo:**
```javascript
import { calcularHPMaximo, calcularDanoFisico } from '@/lib/combat/statsCalculator';

const avatar = {
  nivel: 25,
  resistencia: 20,
  forca: 18,
  vinculo: 75, // Leal: +10%
  exaustao: 15 // Alerta: -5%
};

const hpMax = calcularHPMaximo(avatar); // (20*10) + (25*5) = 325
const dano = calcularDanoFisico(avatar); // (18*1.0) + (25*2) = 68
// Com modificadores: 68 * 1.10 * 0.95 = 71
```

---

### 🗄️ /lib/supabase

#### serverClient.js

**Função:** Cliente Supabase para uso em **API Routes** (server-side).

```javascript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Service role bypassa RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
```

**Uso em APIs:**
```javascript
import { createClient } from '@/lib/supabase/serverClient';

export async function POST(request) {
  const supabase = createClient();

  const { data } = await supabase.from('avatares').select('*');
  // ...
}
```

**Diferença do client-side:**
- Usa **Service Role Key** (acesso total, bypassa RLS)
- Não mantém sessão
- Ideal para operações administrativas

---

### 🛠️ /lib/utils

#### progressUtils.js

**Função:** Utilidades de progressão e XP.

**Exporta:**
- `calcularXPNecessario(nivel)` - XP necessário para próximo nível
- `calcularNivelPorXP(xpTotal)` - Qual nível com X XP
- `calcularProgressao(xpAtual, nivel)` - Progresso % para próximo nível

**Fórmulas:**
```javascript
// XP necessário para próximo nível
const xpBase = 100;
const multiplicador = 1.15;
const xpNecessario = Math.floor(xpBase * Math.pow(multiplicador, nivel - 1));

// XP total para alcançar um nível
let xpTotal = 0;
for (let i = 1; i < nivel; i++) {
  xpTotal += Math.floor(xpBase * Math.pow(multiplicador, i - 1));
}
```

---

### 🎲 /lib/gameLogic.js

**Função:** Lógica geral do jogo (funções auxiliares).

**Exporta:**
- `gerarID()` - Gera UUID único
- `randomizar(min, max)` - Número aleatório
- `sortearRaridade()` - Sorteia raridade (60% Comum, 30% Raro, 10% Lendário)
- `sortearElemento()` - Sorteia elemento aleatório
- `formatarMoedas(valor)` - Formata número como moedas (1000 → 1.000)

---

## Módulo: /database (SQL e Schema)

Scripts SQL e documentação do banco de dados.

### Estrutura do /database

```
database/
├── *.sql                          # Scripts SQL
│   ├── pvp_system.sql             # Sistema PVP completo
│   ├── RPC_COMPRA_ATOMICA.sql     # RPC de compra atômica
│   ├── ADD_FK_AVATARES_PLAYER_STATS.sql
│   ├── ADD_MERCADO_CONSTRAINTS.sql
│   └── ...
│
└── *.md                           # Documentação
    ├── SUPABASE_SCHEMA_COMPLETE.md  # Schema completo (950 linhas)
    ├── PVP_DATABASE_README.md       # Sistema PVP
    └── ...
```

### Scripts SQL Principais

#### pvp_system.sql

**Função:** Cria todo o sistema PVP (tabelas, views, triggers).

**O que cria:**
- Tabelas: `pvp_temporadas`, `pvp_rankings`, `pvp_historico_temporadas`, `pvp_batalhas_log`, `pvp_titulos`, `pvp_recompensas_pendentes`
- Views: `leaderboard_atual`, `top_100_atual`, `estatisticas_jogador`
- Triggers: Diversos para validação e automação

**Quando executar:** Na primeira configuração do banco.

#### RPC_COMPRA_ATOMICA.sql

**Função:** Cria função RPC `executar_compra_avatar` para compras atômicas.

**Por que RPC:** Garante que todas as operações (deduzir moedas, transferir avatar, registrar transação) aconteçam atomicamente. Se qualquer etapa falhar, rollback automático.

**Como funciona:**
```sql
CREATE OR REPLACE FUNCTION executar_compra_avatar(
  p_avatar_id UUID,
  p_comprador_id UUID,
  p_preco_moedas INTEGER DEFAULT 0,
  p_preco_fragmentos INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Lock pessimista
  SELECT * FROM avatares WHERE id = p_avatar_id FOR UPDATE;

  -- Validações
  -- Deduz moedas do comprador
  -- Calcula taxa (5%) e adiciona ao vendedor
  -- Transfere avatar
  -- Reseta em_venda, vinculo, exaustao
  -- Registra em mercado_transacoes

  RETURN json_build_object('success', true, ...);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
```

#### ADD_MERCADO_CONSTRAINTS.sql

**Função:** Adiciona constraints de integridade ao mercado.

**Constraints criadas:**
1. `check_em_venda_preco` - Se em_venda=true, deve ter preço > 0
2. `check_preco_venda_min` - Preço mínimo: 100 moedas
3. `check_preco_fragmentos_min` - Preço mínimo: 1 fragmento
4. `check_preco_venda_max` - Preço máximo: 10.000 moedas
5. `check_preco_fragmentos_max` - Preço máximo: 500 fragmentos

**Trigger criado:**
- `trigger_limpar_precos` - Ao alterar `em_venda=false`, zera preços automaticamente

---

## Módulo: /components (Componentes Globais)

Componentes React reutilizáveis em todo o projeto.

```
components/
└── BackgroundEffects.tsx    # Efeitos de fundo (partículas, blur)
```

### BackgroundEffects.tsx

**Função:** Adiciona efeitos visuais de fundo (partículas flutuantes, gradientes animados).

**Uso:**
```javascript
import BackgroundEffects from '@/components/BackgroundEffects';

export default function Page() {
  return (
    <div className="relative">
      <BackgroundEffects />
      {/* Conteúdo da página */}
    </div>
  );
}
```

---

## Configurações do Projeto

### next.config.mjs

```javascript
const nextConfig = {
  output: 'standalone', // Otimizado para deploy (Vercel, Docker)
  reactStrictMode: true, // Modo estrito do React
  swcMinify: true,       // Minificação otimizada
};

export default nextConfig;
```

### tailwind.config.js

```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores personalizadas do tema
      }
    },
  },
  plugins: [],
};
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]  // Alias @ aponta para raiz
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## Fluxo de Dados

### Cliente → API → Banco de Dados

```
┌─────────────────────────────────────────────────────────────┐
│  1. CLIENTE (Browser)                                       │
│                                                             │
│  Usuário clica em "Comprar Avatar"                         │
│  ↓                                                          │
│  JavaScript faz fetch('/api/mercado/comprar')              │
│  com body: { avatarId, userId }                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTP POST
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  2. API ROUTE (Server)                                      │
│                                                             │
│  app/api/mercado/comprar/route.js                          │
│  ↓                                                          │
│  Valida entrada                                            │
│  ↓                                                          │
│  Cria cliente Supabase (lib/supabase/serverClient.js)     │
│  ↓                                                          │
│  Chama RPC: executar_compra_avatar(...)                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Supabase SDK
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  3. SUPABASE (PostgreSQL)                                   │
│                                                             │
│  RPC Function: executar_compra_avatar                      │
│  ↓                                                          │
│  BEGIN TRANSACTION                                         │
│  ↓                                                          │
│  SELECT ... FOR UPDATE (lock avatar)                       │
│  ↓                                                          │
│  UPDATE player_stats (deduz moedas comprador)             │
│  ↓                                                          │
│  UPDATE player_stats (adiciona moedas vendedor - 5%)      │
│  ↓                                                          │
│  UPDATE avatares (transfere ownership, reseta stats)       │
│  ↓                                                          │
│  INSERT INTO mercado_transacoes (registra transação)       │
│  ↓                                                          │
│  COMMIT                                                    │
│  ↓                                                          │
│  RETURN { success: true, ... }                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ JSON Response
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  4. API ROUTE (Server)                                      │
│                                                             │
│  Recebe resultado do RPC                                   │
│  ↓                                                          │
│  return Response.json({ success: true, data })             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTP Response
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  5. CLIENTE (Browser)                                       │
│                                                             │
│  Recebe { success: true, data }                            │
│  ↓                                                          │
│  Atualiza UI (remove avatar da lista)                      │
│  ↓                                                          │
│  Exibe mensagem de sucesso                                 │
└─────────────────────────────────────────────────────────────┘
```

### Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│  1. Login (app/login/page.jsx)                              │
│  ↓                                                          │
│  POST /api/login { email, senha }                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  2. API /api/login/route.js                                 │
│  ↓                                                          │
│  SELECT * FROM auth.users WHERE email = ...                │
│  ↓                                                          │
│  Valida senha                                              │
│  ↓                                                          │
│  return { userId, nome }                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  3. Cliente armazena                                        │
│  ↓                                                          │
│  localStorage.setItem('userId', userId)                    │
│  localStorage.setItem('nomeOperacao', nome)                │
│  ↓                                                          │
│  router.push('/dashboard')                                 │
└─────────────────────────────────────────────────────────────┘
```

**Nota:** Todas as APIs verificam `userId` do body/query. Não há sistema de sessão/token robusto (apenas localStorage).

---

## Resumo

A arquitetura do Portal Hunter Awakening é:

1. **Modular** - Cada funcionalidade em seu próprio diretório
2. **Escalável** - Fácil adicionar novos módulos
3. **Manutenível** - Código organizado e documentado
4. **Performática** - Next.js SSR + API Routes serverless
5. **Robusta** - Transações atômicas no PostgreSQL

### Próximos Documentos

- **[API_REFERENCE.md](./API_REFERENCE.md)** - Documentação completa de cada API
- **[DATABASE.md](./DATABASE.md)** - Estrutura detalhada do banco
- **[SISTEMAS.md](./SISTEMAS.md)** - Explicação de cada sistema do jogo
- **[GUIA_MANUTENCAO.md](./GUIA_MANUTENCAO.md)** - Como manter e estender o projeto

---

**Última atualização:** Novembro 2025
