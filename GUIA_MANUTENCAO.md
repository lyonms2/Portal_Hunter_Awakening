# 🔧 Guia de Manutenção - Portal Hunter Awakening

Guia completo para manutenção, extensão e troubleshooting do projeto.

---

## 📋 Índice

1. [Primeiros Passos](#primeiros-passos)
2. [Como Adicionar Funcionalidades](#como-adicionar-funcionalidades)
3. [Padrões e Convenções](#padrões-e-convenções)
4. [Troubleshooting Comum](#troubleshooting-comum)
5. [Manutenção do Banco de Dados](#manutenção-do-banco-de-dados)
6. [Deploy e Produção](#deploy-e-produção)
7. [Testes](#testes)
8. [Performance](#performance)

---

## Primeiros Passos

### Entendendo o Projeto

1. **Leia a documentação principal:**
   - [README.md](./README.md) - Visão geral
   - [ARQUITETURA.md](./ARQUITETURA.md) - Estrutura de pastas
   - [SISTEMAS.md](./SISTEMAS.md) - Mecânicas do jogo

2. **Explore o código:**
   - Comece pelas páginas principais (`/app/dashboard`, `/app/avatares`)
   - Veja as APIs em `/app/api`
   - Entenda os sistemas em `/app/avatares/sistemas`

3. **Configure o ambiente:**
   ```bash
   git clone <repo>
   npm install
   cp .env.example .env.local
   # Configure as variáveis do Supabase
   npm run dev
   ```

---

## Como Adicionar Funcionalidades

### 1. Adicionar Nova API

#### Passo a Passo

**Exemplo: Criar API para trocar nome do avatar**

1. **Criar arquivo da API:**
   ```
   app/api/atualizar-nome-avatar/route.js
   ```

2. **Implementar a API:**
   ```javascript
   import { createClient } from '@/lib/supabase/serverClient';

   export async function PUT(request) {
     try {
       const { avatarId, novoNome } = await request.json();

       // Validações
       if (!avatarId || !novoNome) {
         return Response.json(
           { error: 'Dados incompletos' },
           { status: 400 }
         );
       }

       if (novoNome.length < 3 || novoNome.length > 50) {
         return Response.json(
           { error: 'Nome deve ter entre 3 e 50 caracteres' },
           { status: 400 }
         );
       }

       // Cliente Supabase
       const supabase = createClient();

       // Atualizar banco
       const { data, error } = await supabase
         .from('avatares')
         .update({ nome: novoNome })
         .eq('id', avatarId)
         .select()
         .single();

       if (error) throw error;

       return Response.json({
         message: 'Nome atualizado com sucesso',
         avatar: data
       });

     } catch (error) {
       console.error('Erro:', error);
       return Response.json(
         { error: error.message },
         { status: 500 }
       );
     }
   }
   ```

3. **Testar a API:**
   ```bash
   curl -X PUT http://localhost:3000/api/atualizar-nome-avatar \
     -H "Content-Type: application/json" \
     -d '{"avatarId": "uuid", "novoNome": "Novo Nome"}'
   ```

4. **Documentar:**
   - Adicionar endpoint em [API_REFERENCE.md](./API_REFERENCE.md)

---

### 2. Adicionar Nova Página

#### Passo a Passo

**Exemplo: Criar página de conquistas**

1. **Criar pasta e arquivo:**
   ```
   app/conquistas/page.jsx
   ```

2. **Implementar a página:**
   ```javascript
   'use client';

   import { useState, useEffect } from 'react';
   import { useRouter } from 'next/navigation';

   export default function ConquistasPage() {
     const [conquistas, setConquistas] = useState([]);
     const [loading, setLoading] = useState(true);
     const router = useRouter();

     useEffect(() => {
       const fetchConquistas = async () => {
         try {
           const userId = localStorage.getItem('userId');
           if (!userId) {
             router.push('/login');
             return;
           }

           const res = await fetch(`/api/conquistas?userId=${userId}`);
           const data = await res.json();

           setConquistas(data.conquistas || []);
         } catch (error) {
           console.error('Erro:', error);
         } finally {
           setLoading(false);
         }
       };

       fetchConquistas();
     }, [router]);

     if (loading) {
       return (
         <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
           <div className="text-white text-2xl">Carregando...</div>
         </div>
       );
     }

     return (
       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
         <div className="max-w-6xl mx-auto">
           <h1 className="text-4xl font-bold text-cyan-400 mb-8">
             Conquistas
           </h1>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {conquistas.map((conquista) => (
               <div
                 key={conquista.id}
                 className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4"
               >
                 <div className="text-3xl mb-2">{conquista.icone}</div>
                 <h3 className="text-xl font-bold text-white mb-2">
                   {conquista.nome}
                 </h3>
                 <p className="text-slate-300 text-sm">
                   {conquista.descricao}
                 </p>
                 {conquista.desbloqueada && (
                   <div className="mt-2 text-green-400 text-sm">
                     ✅ Desbloqueada
                   </div>
                 )}
               </div>
             ))}
           </div>

           <button
             onClick={() => router.push('/dashboard')}
             className="mt-8 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg"
           >
             ← Voltar ao Dashboard
           </button>
         </div>
       </div>
     );
   }
   ```

3. **Criar API correspondente:**
   ```
   app/api/conquistas/route.js
   ```

4. **Adicionar link no Dashboard:**
   ```javascript
   // Em app/dashboard/page.jsx
   <Link href="/conquistas" className="...">
     🏆 Conquistas
   </Link>
   ```

---

### 3. Adicionar Novo Sistema

#### Passo a Passo

**Exemplo: Sistema de Clãs**

1. **Criar tabela no banco:**
   ```sql
   -- database/CREATE_CLANS_SYSTEM.sql
   CREATE TABLE clans (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     nome VARCHAR(50) NOT NULL UNIQUE,
     descricao TEXT,
     lider_id UUID REFERENCES auth.users(id),
     nivel INTEGER DEFAULT 1,
     xp INTEGER DEFAULT 0,
     criado_em TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE clan_members (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     clan_id UUID REFERENCES clans(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     cargo VARCHAR(20) DEFAULT 'membro', -- lider, vice, membro
     contribuicao INTEGER DEFAULT 0,
     entrou_em TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id) -- Um jogador em apenas um clã
   );
   ```

2. **Criar sistema JavaScript:**
   ```javascript
   // lib/clans/clanSystem.js
   export const CARGOS = {
     LIDER: 'lider',
     VICE: 'vice',
     MEMBRO: 'membro'
   };

   export function calcularXPClan(nivel) {
     return 1000 * Math.pow(1.5, nivel - 1);
   }

   export function calcularBonusClan(nivel) {
     return {
       moedas: nivel * 50,
       fragmentos: nivel * 5,
       xp_bonus: nivel * 2 // % extra de XP
     };
   }
   ```

3. **Criar APIs:**
   ```
   app/api/clans/criar/route.js
   app/api/clans/entrar/route.js
   app/api/clans/sair/route.js
   app/api/clans/listar/route.js
   ```

4. **Criar página:**
   ```
   app/clans/page.jsx
   ```

5. **Documentar:**
   - Adicionar seção em [SISTEMAS.md](./SISTEMAS.md)
   - Adicionar APIs em [API_REFERENCE.md](./API_REFERENCE.md)
   - Adicionar tabelas em [DATABASE.md](./DATABASE.md)

---

### 4. Adicionar Novo Elemento

#### Passo a Passo

**Exemplo: Adicionar elemento "Gelo"**

1. **Atualizar elementalSystem.js:**
   ```javascript
   // app/avatares/sistemas/elementalSystem.js

   export const ELEMENTOS = {
     // ... elementos existentes ...
     GELO: 'Gelo'
   };

   export const CARACTERISTICAS_ELEMENTAIS = {
     // ... elementos existentes ...
     Gelo: {
       cor: 'text-blue-300',
       emoji: '❄️',
       vantagens: ['Água'], // Gelo > Água
       fraquezas: ['Fogo'], // Fogo > Gelo
       bonus_stats: {
         resistencia: 1.15,
         agilidade: 1.10
       },
       personalidade: 'Calmo e calculista',
       estilo_combate: 'Controle de campo e congelamento'
     }
   };
   ```

2. **Atualizar abilitiesSystem.js:**
   ```javascript
   // app/avatares/sistemas/abilitiesSystem.js

   const HABILIDADES_POR_ELEMENTO = {
     // ... elementos existentes ...
     Gelo: {
       comuns: [
         {
           nome: 'Rajada Gélida',
           tipo: 'ofensiva',
           custo_energia: 25,
           dano_base: 40,
           efeitos_status: ['lentidao']
         }
       ],
       raras: [
         {
           nome: 'Prisão de Gelo',
           tipo: 'controle',
           custo_energia: 35,
           efeitos_status: ['congelado']
         }
       ],
       lendarias: [
         {
           nome: 'Tempestade Ártica',
           tipo: 'ofensiva',
           custo_energia: 60,
           dano_base: 100,
           area: true,
           efeitos_status: ['congelado', 'lentidao']
         }
       ]
     }
   };
   ```

3. **Atualizar loreSystem.js:**
   ```javascript
   // app/avatares/sistemas/loreSystem.js

   const PREFIXOS_ELEMENTO = {
     // ... elementos existentes ...
     Gelo: ['Frost', 'Crystal', 'Glacius', 'Cryo', 'Nivis']
   };

   const TITULOS_ELEMENTO = {
     // ... elementos existentes ...
     Gelo: [
       'o Guardião do Inverno Eterno',
       'Senhor das Geleiras',
       'Mestre dos Cristais Congelados'
     ]
   };
   ```

4. **Testar:**
   - Invocar avatares até conseguir um de Gelo
   - Verificar se stats, habilidades e lore estão corretos
   - Testar vantagens elementais em combate

---

## Padrões e Convenções

### Nomenclatura

#### Arquivos
- **Páginas:** `page.jsx` (sempre minúsculo)
- **APIs:** `route.js` (sempre minúsculo)
- **Componentes:** `PascalCase.jsx` (ex: `AvatarCard.jsx`)
- **Sistemas:** `camelCase.js` (ex: `bondSystem.js`)
- **SQL:** `UPPERCASE_SNAKE.sql` (ex: `CREATE_TABLE.sql`)

#### Variáveis
```javascript
// JavaScript
const nomeVariavel = 'valor';      // camelCase
const CONSTANTE_GLOBAL = 'valor';  // UPPERCASE

// SQL
nome_coluna                         // snake_case
NOME_TABELA                         // UPPERCASE (opcional)
```

#### Funções
```javascript
// Funções normais
function calcularDano(avatar) { }

// Componentes React
export default function MinhaPage() { }

// Handlers
const handleClick = () => { }
const handleSubmit = async (e) => { }
```

### Estrutura de Código

#### API Routes

```javascript
import { createClient } from '@/lib/supabase/serverClient';

export async function POST(request) {
  try {
    // 1. Parse do body
    const body = await request.json();

    // 2. Validações
    if (!body.campo) {
      return Response.json({ error: 'Erro' }, { status: 400 });
    }

    // 3. Cliente Supabase
    const supabase = createClient();

    // 4. Operações no banco
    const { data, error } = await supabase.from('tabela').insert(body);
    if (error) throw error;

    // 5. Retorno
    return Response.json({ success: true, data });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

#### React Pages

```javascript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MinhaPage() {
  // 1. Estados
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. Router
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

        const res = await fetch('/api/endpoint');
        const result = await res.json();
        setData(result.data);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // 4. Handlers
  const handleAction = async () => {
    // lógica
  };

  // 5. Renderização condicional
  if (loading) return <div>Carregando...</div>;

  // 6. Renderização principal
  return (
    <div className="...">
      {/* Conteúdo */}
    </div>
  );
}
```

### Comentários

```javascript
// ==================== SEÇÃO ====================

/**
 * Função complexa que requer explicação
 * @param {Object} avatar - Avatar objeto
 * @returns {Number} - Dano calculado
 */
function calcularDano(avatar) {
  // Comentário inline para linha específica
  const dano = avatar.forca * 1.5;
  return dano;
}

// Comentário simples
const valor = 10;
```

---

## Troubleshooting Comum

### Problema: "Serviço temporariamente indisponível"

**Causa:** `SUPABASE_SERVICE_ROLE_KEY` não configurada.

**Solução:**
```bash
# Verificar .env.local
cat .env.local

# Adicionar se não existir
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

### Problema: "Could not find a relationship"

**Causa:** Foreign key não existe ou nome incorreto.

**Exemplo de Erro:**
```
Could not find a relationship between 'avatares' and 'player_stats'
using the hint 'fk_avatares_player_stats'
```

**Solução:**
1. Verificar se FK existe:
   ```sql
   SELECT constraint_name
   FROM information_schema.table_constraints
   WHERE table_name = 'avatares' AND constraint_type = 'FOREIGN KEY';
   ```

2. Criar FK se não existir:
   ```sql
   ALTER TABLE avatares
     ADD CONSTRAINT fk_avatares_player_stats
     FOREIGN KEY (user_id)
     REFERENCES player_stats(user_id);
   ```

3. Usar nome correto no JOIN:
   ```javascript
   .select('*, vendedor:player_stats!fk_avatares_player_stats(nome_operacao)')
   ```

---

### Problema: Avatar não aparece no mercado

**Diagnóstico:**

1. Verificar se `em_venda = true`:
   ```sql
   SELECT id, nome, em_venda FROM avatares WHERE id = 'uuid';
   ```

2. Verificar se filtros estão corretos:
   ```javascript
   // app/api/mercado/listar/route.js
   console.log('Avatares antes do filtro:', avatares.length);
   console.log('Avatares depois do filtro:', avataresFiltrados.length);
   ```

3. Verificar se API está filtrando em **JavaScript** (não no SQL):
   ```javascript
   // CORRETO (filtro em JS)
   let query = supabase.from('avatares').select('*');
   const { data } = await query;
   const filtrados = data.filter(a => a.em_venda === true);

   // INCORRETO (filtro no SQL pode falhar)
   const { data } = await supabase
     .from('avatares')
     .select('*')
     .eq('em_venda', true); // ❌ Não confiável
   ```

---

### Problema: Temporada não encerra automaticamente

**Causa:** Cron job não implementado.

**Solução Temporária:**
```bash
# Encerrar manualmente via API
curl -X POST http://localhost:3000/api/pvp/temporada/encerrar \
  -H "Content-Type: application/json" \
  -d '{"temporadaId": "2025-11", "adminKey": "sua-chave-admin"}'
```

**Solução Permanente (Futuro):**
- Implementar Vercel Cron Job
- Ou usar Supabase Edge Functions com pg_cron

---

## Manutenção do Banco de Dados

### Backup

```sql
-- Via Supabase Dashboard
-- Settings → Database → Backups
-- Configure automatic daily backups

-- Manual backup
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### Migrações

#### Criar Nova Migração

1. Criar arquivo SQL:
   ```bash
   touch database/ADD_NEW_FEATURE_$(date +%Y%m%d).sql
   ```

2. Escrever SQL:
   ```sql
   -- database/ADD_NEW_FEATURE_20251118.sql
   ALTER TABLE avatares ADD COLUMN nova_coluna INTEGER DEFAULT 0;

   CREATE INDEX idx_avatares_nova_coluna ON avatares(nova_coluna);
   ```

3. Executar no Supabase:
   - Supabase Dashboard → SQL Editor
   - Copiar e colar o SQL
   - Run

4. Versionar:
   ```bash
   git add database/ADD_NEW_FEATURE_20251118.sql
   git commit -m "Add: Nova coluna em avatares"
   ```

### Limpeza de Dados

#### Remover avatares do memorial antigos (> 30 dias)

```sql
DELETE FROM avatares
WHERE marca_morte = true
  AND vivo = false
  AND updated_at < NOW() - INTERVAL '30 days';
```

#### Limpar batalhas antigas (> 90 dias)

```sql
DELETE FROM pvp_batalhas_log
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Índices e Performance

#### Verificar Queries Lentas

```sql
-- Habilitar tracking
ALTER DATABASE postgres SET track_activities = ON;

-- Ver queries ativas
SELECT pid, usename, query, state
FROM pg_stat_activity
WHERE state = 'active';

-- Ver queries lentas
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### Adicionar Índices

```sql
-- Identificar colunas frequentes em WHERE/JOIN
CREATE INDEX idx_avatares_raridade ON avatares(raridade);
CREATE INDEX idx_pvp_rankings_fama ON pvp_rankings(fama DESC);

-- Índice parcial (apenas em_venda = true)
CREATE INDEX idx_avatares_mercado ON avatares(preco_venda)
WHERE em_venda = true;
```

---

## Deploy e Produção

### Variáveis de Ambiente

```bash
# .env.local (desenvolvimento)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Produção (Vercel)
# Configurar em: Vercel Dashboard → Settings → Environment Variables
```

### Build e Deploy

#### Build Local

```bash
npm run build
npm start
```

#### Deploy Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Deploy Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build e run
docker build -t portal-hunter .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  -e SUPABASE_SERVICE_ROLE_KEY=xxx \
  portal-hunter
```

---

## Testes

### Testes Manuais

#### Checklist de Funcionalidades

- [ ] Cadastro de novo jogador
- [ ] Login
- [ ] Primeira invocação gratuita
- [ ] Invocação paga
- [ ] Ativar avatar
- [ ] Descansar avatar
- [ ] Batalha PVP IA
- [ ] Ganhar/perder fama
- [ ] Vender avatar no mercado
- [ ] Comprar avatar do mercado
- [ ] Ressurreição (Necromante)
- [ ] Purificação
- [ ] Coletar recompensas de temporada

### Testes Automatizados (Futuro)

```javascript
// __tests__/api/invocar-avatar.test.js
import { POST } from '@/app/api/invocar-avatar/route';

describe('API: Invocar Avatar', () => {
  it('deve cobrar 250 moedas para segunda invocação', async () => {
    const request = {
      json: async () => ({ userId: 'test-user' })
    };

    const response = await POST(request);
    const data = await response.json();

    expect(data.custos.moedas).toBe(250);
  });
});
```

---

## Performance

### Otimizações de Banco

#### Use SELECT Específico

```javascript
// ❌ Ruim (traz todos os campos)
const { data } = await supabase.from('avatares').select('*');

// ✅ Bom (apenas necessários)
const { data } = await supabase
  .from('avatares')
  .select('id, nome, raridade, nivel');
```

#### Use Paginação

```javascript
// ❌ Ruim (traz todos)
const { data } = await supabase.from('pvp_rankings').select('*');

// ✅ Bom (paginado)
const { data } = await supabase
  .from('pvp_rankings')
  .select('*')
  .range(0, 99); // Top 100
```

#### Use RPC para Operações Complexas

```javascript
// ❌ Ruim (múltiplas queries)
const avatar = await supabase.from('avatares').select().eq('id', id).single();
const vendedor = await supabase.from('player_stats').select().eq('user_id', avatar.user_id).single();
const comprador = await supabase.from('player_stats').select().eq('user_id', compradorId).single();
// ... múltiplas operações

// ✅ Bom (RPC atômica)
const resultado = await supabase.rpc('executar_compra_avatar', {
  p_avatar_id: id,
  p_comprador_id: compradorId
});
```

### Otimizações de Frontend

#### Lazy Loading

```javascript
// Carregar componentes pesados sob demanda
import dynamic from 'next/dynamic';

const AvatarDetalhes = dynamic(() => import('./AvatarDetalhes'), {
  loading: () => <p>Carregando...</p>,
  ssr: false
});
```

#### Memoização

```javascript
import { useMemo } from 'react';

const avataresFiltrados = useMemo(() => {
  return avatares.filter(a => a.raridade === filtroRaridade);
}, [avatares, filtroRaridade]);
```

---

## Recursos Úteis

### Links Importantes

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev               # Rodar dev server
npm run build             # Build para produção
npm start                 # Rodar produção

# Git
git status                # Ver status
git add .                 # Adicionar mudanças
git commit -m "msg"       # Commit
git push                  # Push para remote

# Supabase (se usar CLI)
supabase start            # Iniciar local
supabase db reset         # Resetar banco local
supabase db push          # Push migrações
```

---

## Checklist para Novas Features

- [ ] Código implementado
- [ ] API documentada em [API_REFERENCE.md](./API_REFERENCE.md)
- [ ] Sistema documentado em [SISTEMAS.md](./SISTEMAS.md) (se aplicável)
- [ ] Tabelas documentadas em [DATABASE.md](./DATABASE.md) (se aplicável)
- [ ] Testes manuais realizados
- [ ] Git commit com mensagem clara
- [ ] Git push para branch correta
- [ ] Pull request criado (se aplicável)

---

**Última atualização:** Novembro 2025

**Boa sorte na manutenção do projeto! 🚀**
