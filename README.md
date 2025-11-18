# 🌌 Portal Hunter Awakening

**Portal Hunter Awakening** é um RPG web completo desenvolvido em Next.js, onde jogadores invocam e gerenciam avatares para batalhar em portais dimensionais. O jogo apresenta mecânicas sofisticadas de progressão, combate PVP competitivo, sistema de morte/ressurreição e um mercado de avatares entre jogadores.

---

## 🎮 Visão Geral

No mundo de Portal Hunter Awakening, você é um **Invocador** com a habilidade de convocar **Avatares** de outras dimensões para lutar ao seu lado. Explore portais, battle em arenas, evolua seus avatares e compete em temporadas PVP para alcançar o topo do ranking.

### Principais Características

- 🎲 **Sistema de Invocação** - Invoque avatares com raridades e elementos únicos
- ⚔️ **Combate Profundo** - Sistema de batalha baseado em turnos com habilidades e estratégia
- 🏆 **PVP Competitivo** - Temporadas mensais com ranking, recompensas e títulos
- 💀 **Sistema de Morte** - Mecânica de morte permanente com ressurreição limitada
- 🛒 **Mercado de Avatares** - Compre e venda avatares com outros jogadores
- 📊 **Progressão RPG** - Sistema de níveis, XP, vínculo e exaustão
- 🎁 **Economia Balanceada** - Moedas, fragmentos e sistema de recompensas

---

## 🚀 Quick Start

### Requisitos
- Node.js 18+
- Conta no Supabase
- NPM ou Yarn

### Instalação

```bash
# 1. Clonar repositório
git clone <repository-url>
cd Portal_Hunter_Awakening

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
# Criar arquivo .env.local na raiz do projeto:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 4. Executar migrações SQL
# Acesse seu projeto no Supabase → SQL Editor
# Execute os scripts na pasta /database/ na seguinte ordem:
# - supabase/migrations/* (migrações base)
# - database/pvp_system.sql
# - database/ADD_FK_AVATARES_PLAYER_STATS.sql
# - database/ADD_MERCADO_CONSTRAINTS.sql
# - database/RPC_COMPRA_ATOMICA.sql

# 5. Rodar em desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

### Build para Produção

```bash
npm run build
npm start
```

---

## 📚 Documentação

Este projeto possui documentação completa e organizada:

### Documentação Principal
- **[ARQUITETURA.md](./ARQUITETURA.md)** - Estrutura de pastas e módulos detalhada
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Documentação completa de todas as APIs
- **[DATABASE.md](./DATABASE.md)** - Estrutura do banco de dados explicada
- **[SISTEMAS.md](./SISTEMAS.md)** - Explicação detalhada de cada sistema do jogo
- **[GUIA_MANUTENCAO.md](./GUIA_MANUTENCAO.md)** - Guia para manutenção e extensão

### Documentação Específica de Sistemas
- **[SISTEMA_MERCADO.md](./SISTEMA_MERCADO.md)** - Sistema de mercado de avatares
- **[SISTEMA_PURIFICADOR.md](./SISTEMA_PURIFICADOR.md)** - Sistema de purificação
- **[SISTEMA_PREMIACAO.md](./SISTEMA_PREMIACAO.md)** - Sistema de premiação PVP
- **[PVP_DATABASE_README.md](./database/PVP_DATABASE_README.md)** - Sistema PVP completo
- **[SUPABASE_SCHEMA_COMPLETE.md](./database/SUPABASE_SCHEMA_COMPLETE.md)** - Schema completo do banco

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14.2.3** (App Router)
- **React 18.2.0**
- **TypeScript 5.6.3**
- **Tailwind CSS 3.4.1** (estilização)

### Backend
- **Next.js API Routes** (serverless functions)
- **Supabase** (PostgreSQL + Auth + Realtime)
- **PostgreSQL** (banco de dados)

### Ferramentas
- **PostCSS** + **Autoprefixer**
- **ESLint**

---

## 📁 Estrutura do Projeto

```
Portal_Hunter_Awakening/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Backend)
│   │   ├── mercado/       # APIs do mercado
│   │   ├── pvp/           # APIs do PVP
│   │   ├── inventario/    # APIs de inventário
│   │   └── ...            # Outras APIs
│   ├── avatares/          # Página de avatares
│   ├── arena/             # Sistema de arena
│   ├── mercado/           # Mercado de avatares
│   ├── dashboard/         # Dashboard principal
│   └── ...                # Outras páginas
│
├── lib/                   # Bibliotecas compartilhadas
│   ├── arena/             # Motor de batalha
│   ├── pvp/               # Lógica de PVP
│   ├── combat/            # Cálculos de combate
│   └── supabase/          # Cliente Supabase
│
├── database/              # Scripts SQL e documentação
│   ├── pvp_system.sql
│   ├── RPC_COMPRA_ATOMICA.sql
│   └── ...
│
├── components/            # Componentes React globais
├── supabase/             # Migrações do Supabase
└── public/               # Arquivos estáticos
```

Para detalhes completos, veja **[ARQUITETURA.md](./ARQUITETURA.md)**.

---

## 🎮 Principais Funcionalidades

### 1. Sistema de Avatares
- **Invocação** de avatares com raridades (Comum, Raro, Lendário)
- **Elementos** (Fogo, Água, Terra, Vento, Eletricidade, Sombra, Luz)
- **Progressão** com sistema de níveis e XP
- **Vínculo** que aumenta com batalhas (0-100)
- **Exaustão** que penaliza uso excessivo

### 2. Combate e Arena
- **Batalhas baseadas em turnos** com 4 ações (Ataque, Habilidade, Defender, Esperar)
- **Sistema elemental** com vantagens e desvantagens
- **Habilidades únicas** por elemento e raridade
- **Efeitos de status** (queimadura, congelamento, buffs, etc)
- **Modo Treinamento**, **PVE** e **PVP contra IA**

### 3. Sistema PVP
- **Temporadas mensais** com ranking competitivo
- **Sistema de Fama (ELO)** de 0 a 5000+
- **Tiers**: Bronze → Prata → Ouro → Platina → Diamante → Lendário
- **Recompensas de fim de temporada** (Top 100)
- **Títulos permanentes** para Top 10
- **Leaderboard em tempo real**

### 4. Morte e Ressurreição
- **Morte em batalha** (30% chance de morte real)
- **Necromante** para ressurreição (com penalidades)
- **Marca da Morte** (limita ressurreições)
- **Purificador** para remover marca
- **Memorial** para avatares permanentemente perdidos

### 5. Mercado de Avatares
- **Compra e venda** de avatares entre jogadores
- **Sistema de preços** em moedas e/ou fragmentos
- **Transações atômicas** via RPC do PostgreSQL
- **Taxa de 5%** em moedas para vendas
- **Filtros** por raridade, elemento, nível e preço

### 6. Inventário e Economia
- **Moedas** (💰) e **Fragmentos** (💎)
- **Itens consumíveis** (poções, buffs)
- **Sistema de loja** integrado
- **Recompensas** por batalhas e temporadas

Para detalhes de cada sistema, veja **[SISTEMAS.md](./SISTEMAS.md)**.

---

## 🔄 Fluxo de Jogo

### Para Novos Jogadores

1. **Cadastro** → Crie sua conta
2. **Primeira Invocação Gratuita** → Vá ao Ocultista
3. **Ative seu Avatar** → Prepare-se para batalhar
4. **Explore o Dashboard** → Conheça todas as opções
5. **Entre na Arena** → Comece a batalhar e ganhar XP
6. **Participe do PVP** → Compete em temporadas mensais

### Progressão Contínua

1. **Battle regularmente** → Ganhe XP, moedas e fragmentos
2. **Evolua seus avatares** → Suba de nível e aumente o vínculo
3. **Gerencie exaustão** → Use o sistema de descanso
4. **Invoque novos avatares** → Expanda sua coleção
5. **Negocie no mercado** → Compre e venda avatares
6. **Compete no ranking** → Alcance o topo do PVP

---

## 🗄️ Banco de Dados

O projeto utiliza **PostgreSQL** via **Supabase** com 15 tabelas principais:

### Tabelas Core
- `avatares` - Todos os avatares invocados
- `player_stats` - Estatísticas dos jogadores
- `items` - Catálogo de itens
- `player_inventory` - Inventário dos jogadores

### Tabelas PVP
- `pvp_temporadas` - Gerenciamento de temporadas
- `pvp_rankings` - Rankings atuais
- `pvp_historico_temporadas` - Histórico de temporadas
- `pvp_batalhas_log` - Log de todas as batalhas
- `pvp_titulos` - Títulos conquistados
- `pvp_recompensas_pendentes` - Recompensas a coletar

### Views
- `leaderboard_atual` - Leaderboard completo
- `top_100_atual` - Top 100 para distribuição
- `estatisticas_jogador` - Stats agregadas

Para detalhes completos do schema, veja **[DATABASE.md](./DATABASE.md)**.

---

## 🔌 APIs

O projeto possui **33 endpoints de API** organizados por funcionalidade:

### Autenticação
- `POST /api/cadastro` - Criar conta
- `POST /api/login` - Login

### Avatares
- `GET /api/meus-avatares` - Listar avatares
- `POST /api/invocar-avatar` - Invocar novo avatar
- `POST /api/descansar-avatar` - Reduzir exaustão
- `POST /api/merge-avatares` - Fusão de avatares
- `POST /api/ressuscitar-avatar` - Ressurreição
- `POST /api/purificar-avatar` - Purificação

### Mercado
- `GET /api/mercado/listar` - Listar avatares à venda
- `POST /api/mercado/vender` - Vender avatar
- `POST /api/mercado/comprar` - Comprar avatar

### PVP
- `GET /api/pvp/temporada` - Info da temporada
- `GET /api/pvp/ranking` - Ranking do jogador
- `GET /api/pvp/leaderboard` - Leaderboard completo
- `POST /api/pvp/batalha` - Registrar batalha
- `POST /api/pvp/recompensas/coletar` - Coletar recompensas

Para documentação completa de todas as APIs, veja **[API_REFERENCE.md](./API_REFERENCE.md)**.

---

## 🎨 Design e UX

### Tema Visual
- **Estilo:** Cyberpunk/Sci-Fi Dark
- **Cores Principais:** Cyan (#22D3EE), Purple (#A855F7), Slate (fundo)
- **Efeitos:** Blur, gradientes, animações de pulso
- **Tipografia:** Sans-serif moderno

### Responsividade
- Design **mobile-first** com Tailwind CSS
- Breakpoints adaptativos (sm, md, lg, xl)
- Modais e componentes totalmente responsivos

---

## 🧪 Testando o Projeto

### Teste Básico

1. **Cadastre-se** e faça login
2. **Vá ao Ocultista** (`/ocultista`) e invoque seu primeiro avatar GRÁTIS
3. **Ative o avatar** na página `/avatares`
4. **Entre na Arena PVP IA** (`/arena/pvp-ia`) e escolha um oponente
5. **Batalhe** e veja o sistema de combate em ação
6. **Verifique o ranking** em `/arena/pvp-ia/leaderboard`

### Teste do Mercado

1. Tenha pelo menos **2 avatares**
2. Vá em `/mercado` e clique em "Vender Avatar"
3. Escolha um avatar e defina um preço
4. Publique a venda
5. Em outra conta (ou navegador anônimo), compre o avatar
6. Verifique a transferência de ownership

### Teste de Morte e Ressurreição

1. Batalhe no PVP IA até seu avatar **morrer** (30% de chance)
2. Vá ao **Necromante** (`/necromante`)
3. Ressuscite o avatar (ele receberá **Marca da Morte**)
4. Batalhe novamente até morrer
5. Vá ao **Purificador** (`/purificador`) para remover a marca
6. Agora pode ressuscitar novamente

---

## 🔧 Manutenção e Extensão

### Como Adicionar uma Nova Funcionalidade

Veja o guia completo em **[GUIA_MANUTENCAO.md](./GUIA_MANUTENCAO.md)**.

### Estrutura de uma Nova API

```javascript
// app/api/nova-funcionalidade/route.js
import { createClient } from '@/lib/supabase/serverClient';

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = createClient();

    // Sua lógica aqui

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Estrutura de uma Nova Página

```javascript
// app/nova-pagina/page.jsx
'use client';
import { useState, useEffect } from 'react';

export default function NovaPagina() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Carregar dados
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Seu conteúdo aqui */}
    </div>
  );
}
```

---

## 📊 Estatísticas do Projeto

- **Linhas de Código:** ~9.200+ (pasta /app)
- **Total de Páginas:** 24 rotas
- **Total de APIs:** 33 endpoints
- **Tabelas no Banco:** 15 principais + 3 views
- **Sistemas Integrados:** 10+ sistemas
- **Documentação:** 8+ arquivos .md

---

## 🎯 Roadmap

### ✅ Implementado
- Sistema de invocação completo
- Combate baseado em turnos
- PVP contra IA com ranking
- Temporadas mensais
- Sistema de morte/ressurreição
- Mercado de avatares
- Inventário de itens
- Sistema de recompensas

### 🚧 Em Desenvolvimento
- Sistema de missões (modo história)
- Dashboard de administração
- Notificações de eventos

### 📋 Planejado
- Encerramento automático de temporadas (Cron Job)
- PVP real-time entre jogadores humanos
- Sistema de clãs/guildas
- Eventos especiais
- Sistema de conquistas/achievements
- Analytics e métricas
- Sistema de email

---

## 🤝 Contribuindo

Este é um projeto educacional. Sugestões e melhorias são bem-vindas!

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Minha feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é de código aberto para fins educacionais.

---

## 📞 Suporte

Para dúvidas e suporte:
- Consulte a documentação completa na pasta raiz
- Veja os exemplos de código nos arquivos existentes
- Leia os comentários no código fonte

---

**Desenvolvido com ❤️ usando Next.js e Supabase**

*Última atualização: Novembro 2025*
