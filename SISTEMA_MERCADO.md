# 🏪 Sistema de Mercado de Avatares

## 📋 Visão Geral

Sistema simples e robusto para compra e venda de avatares entre jogadores.

## 🗄️ Estrutura de Dados

### Tabela: `avatares`

Colunas relacionadas ao mercado:
- `em_venda` (boolean) - Se o avatar está disponível no mercado
- `preco_venda` (integer) - Preço em moedas (0-10000)
- `preco_fragmentos` (integer) - Preço em fragmentos (0-500)

### Tabela: `mercado_transacoes`

Registro de todas as transações:
- `avatar_id` - Avatar vendido
- `vendedor_id` - Quem vendeu
- `comprador_id` - Quem comprou
- `preco_moedas` - Preço pago em moedas
- `preco_fragmentos` - Preço pago em fragmentos
- `taxa_moedas` - Taxa cobrada (5%)
- `valor_vendedor_moedas` - Valor líquido recebido pelo vendedor
- `valor_vendedor_fragmentos` - Fragmentos recebidos (sem taxa)

## 🔐 Regras de Negócio

### Venda
- ✅ Preço mínimo: 1 moeda OU 1 fragmento
- ✅ Preço máximo: 10.000 moedas OU 500 fragmentos
- ✅ Pode definir ambos os preços (moedas E fragmentos)
- ❌ Não pode vender avatar ativo
- ❌ Não pode vender avatar morto
- ❌ Não pode vender avatar com marca da morte

### Compra
- ✅ Taxa de mercado: 5% em moedas, 0% em fragmentos
- ✅ Limite de 15 avatares por jogador
- ✅ Compra é atômica (tudo ou nada)
- ✅ Vínculo e exaustão são resetados
- ❌ Não pode comprar próprio avatar

## 🔧 APIs

### GET `/api/mercado/listar`

Lista avatares à venda com filtros.

**Query Params:**
- `userId` - Exclui avatares do próprio usuário
- `raridade` - Filtra por raridade
- `elemento` - Filtra por elemento
- `precoMin` - Preço mínimo (considera moedas OU fragmentos)
- `precoMax` - Preço máximo (considera moedas OU fragmentos)

### POST `/api/mercado/vender`

Coloca avatar à venda.

**Body:**
```json
{
  "userId": "uuid",
  "avatarId": "uuid",
  "precoMoedas": 1000,
  "precoFragmentos": 0
}
```

### DELETE `/api/mercado/vender`

Cancela venda de avatar.

**Body:**
```json
{
  "userId": "uuid",
  "avatarId": "uuid"
}
```

### POST `/api/mercado/comprar`

Compra avatar do mercado.

**Body:**
```json
{
  "compradorId": "uuid",
  "avatarId": "uuid"
}
```

**Nota:** Usa RPC function `executar_compra_avatar` para garantir atomicidade.

## 🛡️ Segurança

### Constraints de Banco de Dados

1. **check_em_venda_preco** - Avatar à venda deve ter pelo menos um preço
2. **check_venda_vivo** - Avatares mortos não podem estar à venda
3. **check_venda_marca_morte** - Avatares com marca da morte não podem estar à venda
4. **check_venda_ativo** - Avatar ativo não pode estar à venda
5. **check_precos_null_quando_nao_venda** - Preços devem ser NULL quando não está à venda

### Triggers

**trigger_limpar_precos** - Automaticamente:
- Remove da venda quando avatar morre
- Remove da venda quando avatar é ativado
- Remove da venda quando avatar recebe marca da morte
- Limpa preços quando avatar sai de venda

### RPC Function

**executar_compra_avatar** - Transação atômica que:
1. Valida avatar e comprador
2. Verifica limite de avatares
3. Verifica saldo
4. Transfere avatar
5. Deduz recursos do comprador
6. Adiciona recursos ao vendedor
7. Registra transação

**Benefício:** Se qualquer etapa falhar, TODA a operação é revertida automaticamente.

## 📦 Setup do Banco de Dados

Execute na ordem:

```bash
# 1. Adicionar constraints e triggers
psql -f database/ADD_MERCADO_CONSTRAINTS.sql

# 2. Criar RPC function para compra atômica
psql -f database/RPC_COMPRA_ATOMICA.sql
```

Ou execute diretamente no Supabase SQL Editor.

## ✅ Checklist de Implementação

- [x] Tabela `mercado_transacoes` criada
- [x] Colunas de mercado na tabela `avatares`
- [x] Constraints de integridade
- [x] Triggers de limpeza automática
- [x] RPC function atômica
- [x] API de listagem
- [x] API de venda
- [x] API de compra
- [x] API de cancelamento
- [x] Frontend de mercado
- [x] Filtros de preço
- [x] Modal de confirmação

## 🐛 Problemas Resolvidos

### ❌ Antes
- Race condition em compras simultâneas
- Dados inconsistentes (em_venda desincronizado)
- Filtros de preço incorretos
- Sem histórico de transações confiável
- Validações apenas no backend

### ✅ Depois
- Compra 100% atômica (ACID)
- Triggers garantem consistência
- Filtros consideram ambos os preços
- Histórico obrigatório em todas as transações
- Validações no banco de dados (constraints)

## 📊 Monitoramento

### Query: Verificar avatares em estado inválido

```sql
SELECT id, nome, em_venda, preco_venda, preco_fragmentos, vivo, ativo, marca_morte
FROM avatares
WHERE
  (em_venda = true AND preco_venda IS NULL AND preco_fragmentos IS NULL) OR
  (em_venda = false AND (preco_venda IS NOT NULL OR preco_fragmentos IS NOT NULL)) OR
  (vivo = false AND em_venda = true) OR
  (marca_morte = true AND em_venda = true) OR
  (ativo = true AND em_venda = true);
```

Resultado esperado: **0 linhas** (constraints impedem estados inválidos)

### Query: Estatísticas do mercado

```sql
SELECT
  COUNT(*) as total_vendas,
  SUM(preco_moedas) as total_moedas_transacionadas,
  SUM(preco_fragmentos) as total_fragmentos_transacionados,
  SUM(taxa_moedas) as total_taxas_cobradas,
  DATE_TRUNC('day', created_at) as dia
FROM mercado_transacoes
GROUP BY dia
ORDER BY dia DESC
LIMIT 30;
```

## 🎯 Melhorias Futuras

- [ ] Sistema de leilões
- [ ] Histórico de preços (tendências)
- [ ] Avatares em destaque
- [ ] Sistema de ofertas (negociação)
- [ ] Marketplace premium (sem taxa)
- [ ] Notificações de venda
- [ ] Wishlist de avatares
