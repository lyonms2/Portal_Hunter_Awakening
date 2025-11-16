# 💱 Sistema de Trade - Documentação Completa

## 📋 Visão Geral

O Sistema de Trade permite que jogadores negociem avatares e itens entre si, criando uma economia dinâmica no jogo. O sistema inclui marketplace, ofertas, reputação e segurança.

---

## 🗄️ Estrutura do Banco de Dados

### 1. **trade_listings** (Ofertas de Venda)

Armazena todos os avatares e itens colocados à venda pelos jogadores.

**Campos Principais:**
- `id` - UUID único
- `seller_id` - Vendedor (referência a auth.users)
- `listing_type` - Tipo: 'avatar' ou 'item'
- `avatar_id` / `item_id` - Referência ao item sendo vendido
- `price_moedas` / `price_fragmentos` - Preço
- `status` - 'active', 'sold', 'cancelled', 'expired'
- `is_featured` - Destaque premium
- `expires_at` - Expira em 30 dias (padrão)

**Regras de Negócio:**
- ✅ Avatar deve pertencer ao vendedor
- ✅ Avatar NÃO pode estar ativo
- ✅ Avatar NÃO pode estar morto com marca_morte
- ✅ Apenas 1 listing ativo por avatar/item
- ✅ Preço mínimo: 1 moeda OU 1 fragmento
- ✅ Máximo 20 listings ativos por usuário

---

### 2. **trade_transactions** (Histórico de Transações)

Registra todas as compras completadas com snapshot dos dados.

**Campos Principais:**
- `id` - UUID único
- `listing_id` - Referência ao listing vendido
- `seller_id` / `buyer_id` - Partes envolvidas
- `avatar_snapshot` / `item_snapshot` - Dados completos no momento da venda (JSONB)
- `price_moedas` / `price_fragmentos` - Valor pago
- `system_fee_moedas` / `system_fee_fragmentos` - Taxa do sistema (5%)
- `status` - 'completed', 'refunded', 'disputed'

**Fluxo de Compra:**
1. Comprador paga preço + taxa (5%)
2. Sistema deduz moedas/fragmentos do comprador
3. Vendedor recebe preço - taxa (95%)
4. Avatar/item transferido para comprador
5. Listing marcado como 'sold'
6. Transação registrada com snapshot completo

**Taxa do Sistema:**
- **5% de todas as transações**
- Previne inflação excessiva
- Moedas "queimadas" saem da economia

---

### 3. **trade_offers** (Sistema de Ofertas)

Permite negociações e contraofertas entre jogadores.

**Campos Principais:**
- `id` - UUID único
- `listing_id` - Listing alvo
- `buyer_id` - Ofertante
- `offer_moedas` / `offer_fragmentos` - Oferta em recursos
- `trade_avatar_id` / `trade_item_id` - Oferta de troca (avatar por avatar)
- `message` - Mensagem opcional
- `status` - 'pending', 'accepted', 'rejected', 'cancelled', 'expired'
- `expires_at` - Expira em 7 dias

**Tipos de Ofertas:**
1. **Oferta em Moedas/Fragmentos** - Valor diferente do listing
2. **Troca Direta** - Avatar por avatar, item por item
3. **Combinada** - Moedas + Avatar na troca

---

### 4. **trade_reputation** (Sistema de Reputação)

Avaliações de vendedores e compradores.

**Campos Principais:**
- `id` - UUID único
- `transaction_id` - Transação avaliada
- `reviewer_id` / `reviewed_id` - Avaliador e avaliado
- `rating` - 1 a 5 estrelas
- `comment` - Comentário opcional
- `review_type` - 'seller' ou 'buyer'

**Sistema de Estrelas:**
- ⭐ (1) - Péssimo
- ⭐⭐ (2) - Ruim
- ⭐⭐⭐ (3) - Regular
- ⭐⭐⭐⭐ (4) - Bom
- ⭐⭐⭐⭐⭐ (5) - Excelente

**Badges de Reputação:**
- 🌟 **Confiável** - Média ≥ 4.5 estrelas (50+ reviews)
- ⭐ **Bom Vendedor** - Média ≥ 4.0 estrelas (20+ reviews)
- 🆕 **Novo** - Menos de 5 reviews
- ⚠️ **Cuidado** - Média < 3.0 estrelas

---

### 5. **trade_favorites** (Lista de Desejos)

Jogadores podem favoritar listings e receber alertas.

**Campos Principais:**
- `id` - UUID único
- `user_id` - Jogador
- `listing_id` - Listing favorito
- `alert_price_moedas` / `alert_price_fragmentos` - Alerta de preço
- `notify_on_price_drop` - Notificar quando preço cair

**Recursos:**
- ❤️ Favoritar avatares/itens desejados
- 🔔 Alertas quando preço atingir valor desejado
- 📊 Histórico de preços do item

---

### 6. **trade_config** (Configurações)

Configurações do sistema de trade.

**Configurações Padrão:**
```json
{
  "system_fee_percentage": 0.05,          // Taxa 5%
  "listing_duration_days": 30,            // Listings expiram em 30 dias
  "offer_duration_days": 7,               // Ofertas expiram em 7 dias
  "max_active_listings_per_user": 20,    // Máximo 20 listings ativos
  "min_avatar_level_to_sell": 1,         // Nível mínimo do avatar
  "featured_listing_cost_moedas": 1000,  // Custo para destacar
  "allow_avatar_trades": true,           // Permitir troca de avatares
  "allow_item_trades": true              // Permitir troca de itens
}
```

---

## 📊 View: trade_user_stats

View agregada com estatísticas de cada usuário:

```sql
SELECT * FROM trade_user_stats WHERE user_id = 'xxx';
```

**Retorna:**
- `total_sales` - Total de vendas
- `total_moedas_earned` - Moedas ganhas
- `total_fragmentos_earned` - Fragmentos ganhos
- `total_purchases` - Total de compras
- `total_moedas_spent` - Moedas gastas
- `total_fragmentos_spent` - Fragmentos gastos
- `avg_rating` - Avaliação média
- `total_reviews` - Total de avaliações
- `active_listings` - Listings ativos

---

## 🔒 Segurança (RLS Policies)

### Políticas de Acesso:

**trade_listings:**
- ✅ Todos podem VER listings ativos
- ✅ Vendedores veem todos os seus listings (incluindo inativos)
- ✅ Apenas o dono pode CRIAR/EDITAR/DELETAR

**trade_transactions:**
- ✅ Apenas vendedor e comprador veem a transação
- ✅ Admin pode ver todas (futura implementação)

**trade_offers:**
- ✅ Vendedor e ofertante veem a oferta
- ✅ Apenas ofertante pode criar
- ✅ Apenas vendedor pode aceitar/rejeitar

**trade_reputation:**
- ✅ Todos podem VER reputações (público)
- ✅ Apenas participantes da transação podem AVALIAR
- ✅ 1 avaliação por transação

**trade_favorites:**
- ✅ Usuário vê apenas seus próprios favoritos
- ✅ Apenas dono pode adicionar/remover

---

## 🛠️ Funções Auxiliares

### 1. `can_sell_avatar(avatar_id, user_id)`

Verifica se um avatar pode ser vendido.

**Retorna:** `true` ou `false`

**Validações:**
- Avatar existe e pertence ao usuário
- Avatar NÃO está ativo
- Avatar NÃO está morto com marca_morte
- Não existe listing ativo para este avatar

**Exemplo:**
```sql
SELECT can_sell_avatar('avatar-uuid', 'user-uuid');
-- Retorna: true ou false
```

---

### 2. `calculate_system_fee(amount)`

Calcula taxa do sistema (5%).

**Exemplo:**
```sql
SELECT calculate_system_fee(1000);
-- Retorna: 50 (5% de 1000)
```

---

### 3. `expire_old_listings()`

Expira listings antigos automaticamente (cron job).

**Executar diariamente:**
```sql
SELECT expire_old_listings();
```

---

## 🎯 Casos de Uso

### 1. Criar Listing (Vender Avatar)

```sql
-- Verificar se pode vender
SELECT can_sell_avatar('avatar-uuid', 'user-uuid');

-- Se true, criar listing
INSERT INTO trade_listings (
  seller_id,
  listing_type,
  avatar_id,
  price_moedas,
  price_fragmentos
) VALUES (
  'user-uuid',
  'avatar',
  'avatar-uuid',
  5000,  -- 5000 moedas
  0      -- 0 fragmentos
);
```

---

### 2. Comprar Avatar

```sql
BEGIN;

-- 1. Buscar listing
SELECT * FROM trade_listings WHERE id = 'listing-uuid' AND status = 'active';

-- 2. Verificar saldo do comprador
SELECT moedas, fragmentos FROM player_stats WHERE user_id = 'buyer-uuid';

-- 3. Calcular taxa
SELECT
  price_moedas,
  price_fragmentos,
  calculate_system_fee(price_moedas) as fee_moedas,
  calculate_system_fee(price_fragmentos) as fee_fragmentos
FROM trade_listings WHERE id = 'listing-uuid';

-- 4. Deduzir do comprador (preço + taxa)
UPDATE player_stats
SET
  moedas = moedas - (price + fee_moedas),
  fragmentos = fragmentos - (price_frag + fee_frag)
WHERE user_id = 'buyer-uuid';

-- 5. Adicionar ao vendedor (preço - taxa)
UPDATE player_stats
SET
  moedas = moedas + (price - fee_moedas),
  fragmentos = fragmentos + (price_frag - fee_frag)
WHERE user_id = 'seller-uuid';

-- 6. Transferir avatar
UPDATE avatares
SET user_id = 'buyer-uuid'
WHERE id = 'avatar-uuid';

-- 7. Marcar listing como vendido
UPDATE trade_listings
SET status = 'sold', sold_at = NOW()
WHERE id = 'listing-uuid';

-- 8. Registrar transação
INSERT INTO trade_transactions (
  listing_id,
  seller_id,
  buyer_id,
  listing_type,
  avatar_id,
  avatar_snapshot,
  price_moedas,
  price_fragmentos,
  system_fee_moedas,
  system_fee_fragmentos
) VALUES (...);

COMMIT;
```

---

### 3. Fazer Oferta

```sql
INSERT INTO trade_offers (
  listing_id,
  buyer_id,
  offer_moedas,
  offer_fragmentos,
  message
) VALUES (
  'listing-uuid',
  'buyer-uuid',
  4000,  -- Oferta de 4000 moedas (listing pede 5000)
  0,
  'Posso pagar 4000 moedas, é o que tenho!'
);
```

---

### 4. Aceitar Oferta

```sql
-- Vendedor aceita a oferta
UPDATE trade_offers
SET status = 'accepted', responded_at = NOW()
WHERE id = 'offer-uuid';

-- Processar venda com preço da oferta (mesmo fluxo de compra)
```

---

### 5. Avaliar Transação

```sql
-- Comprador avalia vendedor
INSERT INTO trade_reputation (
  transaction_id,
  reviewer_id,
  reviewed_id,
  rating,
  comment,
  review_type
) VALUES (
  'transaction-uuid',
  'buyer-uuid',
  'seller-uuid',
  5,  -- 5 estrelas
  'Avatar exatamente como descrito, vendedor confiável!',
  'seller'
);

-- Vendedor avalia comprador
INSERT INTO trade_reputation (
  transaction_id,
  reviewer_id,
  reviewed_id,
  rating,
  review_type
) VALUES (
  'transaction-uuid',
  'seller-uuid',
  'buyer-uuid',
  5,
  'buyer'
);
```

---

## 📈 Queries Úteis

### Buscar Avatares à Venda (com filtros)

```sql
SELECT
  tl.*,
  a.nome,
  a.raridade,
  a.elemento,
  a.nivel,
  u.nome_operacao as seller_name,
  tus.avg_rating as seller_rating,
  tus.total_sales as seller_total_sales
FROM trade_listings tl
JOIN avatares a ON a.id = tl.avatar_id
JOIN auth.users u ON u.id = tl.seller_id
LEFT JOIN trade_user_stats tus ON tus.user_id = tl.seller_id
WHERE tl.status = 'active'
  AND tl.listing_type = 'avatar'
  AND a.raridade = 'Lendário'  -- Filtro: apenas lendários
  AND a.elemento = 'Fogo'       -- Filtro: apenas fogo
  AND tl.price_moedas <= 10000  -- Filtro: preço máximo
ORDER BY tl.created_at DESC
LIMIT 20;
```

---

### Top Vendedores

```sql
SELECT
  u.id,
  ps.nome_operacao,
  tus.total_sales,
  tus.total_moedas_earned,
  tus.avg_rating,
  tus.total_reviews
FROM trade_user_stats tus
JOIN auth.users u ON u.id = tus.user_id
JOIN player_stats ps ON ps.user_id = u.id
WHERE tus.total_sales > 0
ORDER BY tus.total_sales DESC
LIMIT 10;
```

---

### Histórico de Preços (Avatar Específico)

```sql
SELECT
  tt.created_at,
  tt.price_moedas,
  tt.price_fragmentos,
  a.nome,
  a.nivel,
  a.raridade
FROM trade_transactions tt
JOIN avatares a ON a.id = tt.avatar_id
WHERE tt.avatar_snapshot->>'nome' = 'Nome do Avatar'
  AND tt.status = 'completed'
ORDER BY tt.created_at DESC;
```

---

## 🚀 Features Futuras

### Fase 1 (MVP)
- ✅ Criar listing de avatares
- ✅ Comprar avatares
- ✅ Sistema de transações
- ✅ Reputação básica

### Fase 2
- 🔨 Sistema de ofertas/contraofertas
- 🔨 Mercado de itens (poções, equipamentos)
- 🔨 Chat direto entre comprador e vendedor
- 🔨 Histórico de preços e gráficos

### Fase 3
- 📅 Leilões de avatares lendários
- 📅 Sistema de escrow (garantia)
- 📅 API pública de preços
- 📅 Badges e conquistas de trading

### Fase 4
- 📅 Trade em massa (pacotes)
- 📅 Sistema de afiliados
- 📅 Marketplace mobile
- 📅 Integração com Discord

---

## ⚠️ Considerações Importantes

### Economia do Jogo
- Taxa de 5% **remove moedas da economia** (deflationary)
- Previne inflação descontrolada
- Incentiva vendas diretas vs. revendas múltiplas

### Anti-Fraude
- Snapshots JSONB garantem rastreabilidade
- Impossível vender avatar que não possui
- Transações são atômicas (tudo ou nada)
- RLS garante que apenas dono pode vender

### Performance
- Índices otimizados para queries de busca
- Views materializadas para estatísticas (futura otimização)
- Paginação obrigatória em listings

---

## 📝 Notas de Implementação

1. **Executar SQL:** `TRADE_SYSTEM_SCHEMA.sql`
2. **Criar API Routes:** `/api/trade/*`
3. **Criar UI:** Páginas de marketplace, perfil de vendedor, histórico
4. **Testes:** Testar todos os casos de uso
5. **Cron Jobs:** Expirar listings antigos diariamente

---

**Status:** 🔨 Em Desenvolvimento (25%)
**Última atualização:** 2025-11-16
