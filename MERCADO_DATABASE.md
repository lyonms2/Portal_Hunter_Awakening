# 🏪 Sistema de Mercado de Avatares - Alterações no Banco de Dados

## Tabela: `avatares`

### Nova Coluna Necessária:

```sql
-- Adicionar coluna para preço de venda
ALTER TABLE avatares
ADD COLUMN IF NOT EXISTS preco_venda INTEGER DEFAULT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN avatares.preco_venda IS 'Preço pelo qual o avatar está sendo vendido no mercado (NULL se não está à venda)';
```

### Validações Automáticas:

As seguintes regras são aplicadas automaticamente no backend:

1. **Quando avatar é ativado:**
   - `em_venda` → `false`
   - `preco_venda` → `null`

2. **Quando avatar morre:**
   - `em_venda` → `false`
   - `preco_venda` → `null`
   - `vivo` → `false`

3. **Quando avatar recebe marca_morte:**
   - `em_venda` → `false`
   - `preco_venda` → `null`
   - `marca_morte` → `true`

### Constraints Recomendados:

```sql
-- Garantir que preco_venda está entre 100 e 10000
ALTER TABLE avatares
ADD CONSTRAINT check_preco_venda
CHECK (preco_venda IS NULL OR (preco_venda >= 100 AND preco_venda <= 10000));

-- Garantir que se em_venda=true, preco_venda não pode ser NULL
ALTER TABLE avatares
ADD CONSTRAINT check_em_venda_preco
CHECK (
  (em_venda = false AND preco_venda IS NULL) OR
  (em_venda = true AND preco_venda IS NOT NULL)
);

-- Garantir que avatares mortos não estão à venda
ALTER TABLE avatares
ADD CONSTRAINT check_venda_vivo
CHECK (
  (vivo = false AND em_venda = false) OR
  vivo = true
);

-- Garantir que avatares com marca da morte não estão à venda
ALTER TABLE avatares
ADD CONSTRAINT check_venda_marca_morte
CHECK (
  (marca_morte = true AND em_venda = false) OR
  marca_morte = false OR marca_morte IS NULL
);

-- Garantir que avatar ativo não está à venda
ALTER TABLE avatares
ADD CONSTRAINT check_venda_ativo
CHECK (
  (ativo = true AND em_venda = false) OR
  ativo = false OR ativo IS NULL
);
```

## Tabela: `mercado_transacoes` (Opcional - Para Histórico)

```sql
CREATE TABLE IF NOT EXISTS mercado_transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES avatares(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comprador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preco INTEGER NOT NULL,
  taxa_mercado INTEGER NOT NULL DEFAULT 0,
  valor_vendedor INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_mercado_transacoes_vendedor ON mercado_transacoes(vendedor_id);
CREATE INDEX idx_mercado_transacoes_comprador ON mercado_transacoes(comprador_id);
CREATE INDEX idx_mercado_transacoes_created_at ON mercado_transacoes(created_at DESC);

-- Comentários
COMMENT ON TABLE mercado_transacoes IS 'Histórico de todas as transações do mercado de avatares';
COMMENT ON COLUMN mercado_transacoes.taxa_mercado IS 'Taxa cobrada pelo mercado (geralmente 5%)';
COMMENT ON COLUMN mercado_transacoes.valor_vendedor IS 'Valor líquido recebido pelo vendedor (preco - taxa_mercado)';
```

## Funcionalidades Implementadas:

### APIs Criadas:

1. **POST /api/mercado/vender** - Colocar avatar à venda
2. **DELETE /api/mercado/vender** - Cancelar venda
3. **GET /api/mercado/listar** - Listar avatares à venda (com filtros)
4. **POST /api/mercado/comprar** - Comprar avatar

### Frontend:

1. **Página /avatares** - Botão "Vender" nos cards
2. **Página /mercado** - Marketplace completo com filtros
3. **Modal de venda** - Input de preço
4. **Modal de compra** - Confirmação de compra

### Regras de Negócio:

- **Preço mínimo:** 100 moedas
- **Preço máximo:** 10.000 moedas
- **Taxa do mercado:** 5%
- **Limite de avatares:** 15 (avatares no memorial não contam)
- **Vínculo resetado:** Quando avatar é comprado, vínculo volta a 0
- **Exaustão resetada:** Quando avatar é comprado, exaustão volta a 0

### Validações:

- ✅ Não pode vender avatar ativo
- ✅ Não pode vender avatar morto
- ✅ Não pode vender avatar com marca da morte
- ✅ Não pode comprar próprio avatar
- ✅ Verifica limite de 15 avatares do comprador
- ✅ Verifica moedas suficientes
- ✅ Remove automaticamente da venda quando:
  - Avatar é ativado
  - Avatar morre
  - Avatar recebe marca da morte

## Execução das Migrations:

Execute os comandos SQL acima no Supabase SQL Editor ou use seu client PostgreSQL preferido.

```bash
# Exemplo usando psql
psql -h your-supabase-host -U postgres -d postgres -f migrations/mercado.sql
```

## Testes Recomendados:

1. ✅ Colocar avatar à venda
2. ✅ Cancelar venda
3. ✅ Comprar avatar
4. ✅ Tentar vender avatar ativo (deve falhar)
5. ✅ Tentar vender avatar morto (deve falhar)
6. ✅ Ativar avatar que está à venda (deve remover da venda)
7. ✅ Verificar que vínculo e exaustão resetam na compra
8. ✅ Verificar limite de 15 avatares ao comprar
9. ✅ Verificar taxa de 5% do mercado
