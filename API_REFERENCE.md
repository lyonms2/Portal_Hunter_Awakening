# 🔌 API Reference - Portal Hunter Awakening

Documentação completa de todas as APIs do projeto.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação e Jogador](#autenticação-e-jogador)
3. [Avatares](#avatares)
4. [Mercado](#mercado)
5. [Inventário](#inventário)
6. [PVP e Ranking](#pvp-e-ranking)
7. [Arena](#arena)
8. [Códigos de Status](#códigos-de-status)
9. [Exemplos de Uso](#exemplos-de-uso)

---

## Visão Geral

### Base URL
```
http://localhost:3000/api
```

### Formato de Resposta
Todas as APIs retornam JSON no formato:

**Sucesso:**
```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": { /* dados */ }
}
```

**Erro:**
```json
{
  "error": "Descrição do erro",
  "message": "Mensagem amigável",
  "details": "Detalhes técnicos (opcional)"
}
```

### Autenticação
O projeto atualmente usa **localStorage** para armazenar `userId`. Todas as requisições devem incluir `userId` no body ou query params.

> **Nota:** Não há sistema de tokens/JWT. Considere implementar para produção.

---

## Autenticação e Jogador

### POST /api/cadastro

Cria uma nova conta de jogador.

#### Request
```json
{
  "email": "jogador@email.com",
  "senha": "senha123",
  "nomeOperacao": "Invocador Prime"
}
```

#### Response (201 Created)
```json
{
  "message": "Cadastro realizado com sucesso",
  "userId": "uuid-do-usuario",
  "nomeOperacao": "Invocador Prime"
}
```

#### Erros
- **400**: Email já cadastrado
- **400**: Dados incompletos

---

### POST /api/login

Realiza login de um jogador existente.

#### Request
```json
{
  "email": "jogador@email.com",
  "senha": "senha123"
}
```

#### Response (200 OK)
```json
{
  "message": "Login realizado com sucesso",
  "userId": "uuid-do-usuario",
  "nomeOperacao": "Invocador Prime",
  "stats": {
    "moedas": 1000,
    "fragmentos": 50,
    "ranking": 1000
  }
}
```

#### Erros
- **401**: Email ou senha incorretos
- **404**: Usuário não encontrado

---

### POST /api/inicializar-jogador

Inicializa os stats de um jogador recém-cadastrado.

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "nomeOperacao": "Invocador Prime"
}
```

#### Response (200 OK)
```json
{
  "message": "Jogador inicializado com sucesso",
  "stats": {
    "user_id": "uuid",
    "moedas": 1000,
    "fragmentos": 50,
    "divida": 0,
    "ranking": 1000,
    "primeira_invocacao": true,
    "nome_operacao": "Invocador Prime"
  }
}
```

#### Valores Iniciais
- **Moedas:** 1.000
- **Fragmentos:** 50
- **Ranking:** 1.000
- **Primeira Invocação:** true (gratuita)

---

### PUT /api/atualizar-nome

Atualiza o nome de operação do jogador.

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "novoNome": "Mestre Invocador"
}
```

#### Response (200 OK)
```json
{
  "message": "Nome atualizado com sucesso",
  "nome_operacao": "Mestre Invocador"
}
```

#### Regras
- Mínimo 3 caracteres
- Máximo 30 caracteres
- Pode conter espaços e caracteres especiais

---

### PUT /api/atualizar-stats

Atualiza stats gerais do jogador (moedas, fragmentos, etc).

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "moedas": 1500,
  "fragmentos": 75
}
```

#### Response (200 OK)
```json
{
  "message": "Stats atualizados com sucesso",
  "stats": {
    "moedas": 1500,
    "fragmentos": 75,
    "divida": 0
  }
}
```

---

## Avatares

### POST /api/invocar-avatar

Invoca um novo avatar.

#### Request
```json
{
  "userId": "uuid-do-usuario"
}
```

#### Response (200 OK)
```json
{
  "message": "🌟 INVOCAÇÃO LENDÁRIA! Uma entidade primordial atendeu ao seu chamado!",
  "avatar": {
    "id": "uuid-do-avatar",
    "nome": "Ignis, o Arauto das Chamas Eternas",
    "descricao": "Nascido das profundezas de um vulcão ancestral...",
    "elemento": "Fogo",
    "raridade": "Lendário",
    "nivel": 1,
    "experiencia": 0,
    "vinculo": 0,
    "exaustao": 0,
    "forca": 22,
    "agilidade": 18,
    "resistencia": 20,
    "foco": 24,
    "habilidades": [
      {
        "nome": "Explosão Solar",
        "tipo": "ofensiva",
        "custo_energia": 40,
        "dano_base": 80,
        "efeitos_status": ["queimadura"]
      }
    ],
    "vivo": true,
    "ativo": false,
    "total_stats": 84,
    "primeira_invocacao": true
  },
  "custos": {
    "moedas": 0,
    "fragmentos": 0,
    "gratuita": true
  },
  "recursos_restantes": {
    "moedas": 1000,
    "fragmentos": 50
  },
  "sistemas_aplicados": {
    "elemental": true,
    "stats": true,
    "abilities": true,
    "lore": true,
    "progression": true,
    "bond": true,
    "exhaustion": true
  }
}
```

#### Custos
- **Primeira invocação:** GRÁTIS
- **Invocações seguintes:** 250 moedas + 5 fragmentos

#### Probabilidades de Raridade
- **Comum:** 70%
- **Raro:** 28%
- **Lendário:** 2%

#### Primeira Invocação
- Sempre resulta em **Comum**
- Sempre é **gratuita**
- Flag `primeira_invocacao` no `player_stats` muda para `false`

#### Limite de Avatares
- **Máximo:** 15 avatares por jogador
- **Contagem:** Exclui avatares no memorial (marca_morte=true E vivo=false)

#### Erros
- **400**: Moedas ou fragmentos insuficientes
- **400**: Limite de 15 avatares atingido
- **404**: Jogador não encontrado

---

### GET /api/meus-avatares

Lista todos os avatares do jogador.

#### Request (Query Params)
```
GET /api/meus-avatares?userId=uuid-do-usuario
```

#### Response (200 OK)
```json
{
  "avatares": [
    {
      "id": "uuid",
      "nome": "Avatar do Fogo",
      "elemento": "Fogo",
      "raridade": "Lendário",
      "nivel": 25,
      "vivo": true,
      "ativo": true,
      "vinculo": 75,
      "exaustao": 20,
      "forca": 45,
      "agilidade": 38,
      "resistencia": 42,
      "foco": 50
    }
  ]
}
```

#### Filtros Opcionais
- `vivo=true` - Apenas avatares vivos
- `ativo=true` - Apenas avatar ativo
- `raridade=Lendário` - Por raridade

---

### PUT /api/meus-avatares

Ativa um avatar (troca o avatar ativo).

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "avatarId": "uuid-do-avatar"
}
```

#### Response (200 OK)
```json
{
  "message": "Avatar ativado com sucesso",
  "avatar": {
    "id": "uuid",
    "nome": "Avatar do Fogo",
    "ativo": true
  }
}
```

#### Regras
- Apenas **1 avatar ativo** por jogador
- Ao ativar um, o anterior é desativado automaticamente
- Avatar deve estar **vivo** para ser ativado

---

### GET /api/buscar-avatar

Busca um avatar específico por ID.

#### Request (Query Params)
```
GET /api/buscar-avatar?avatarId=uuid-do-avatar
```

#### Response (200 OK)
```json
{
  "avatar": {
    "id": "uuid",
    "nome": "Avatar do Fogo",
    "descricao": "Descrição completa...",
    "elemento": "Fogo",
    "raridade": "Lendário",
    "nivel": 25,
    "experiencia": 15000,
    "vinculo": 75,
    "exaustao": 20,
    "forca": 45,
    "agilidade": 38,
    "resistencia": 42,
    "foco": 50,
    "habilidades": [...],
    "vivo": true,
    "ativo": true,
    "marca_morte": false,
    "hp_atual": 450
  }
}
```

---

### POST /api/descansar-avatar

Reduz a exaustão de um avatar.

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "avatarId": "uuid-do-avatar"
}
```

#### Response (200 OK)
```json
{
  "message": "Avatar descansou e recuperou energia",
  "exaustao_antes": 45,
  "exaustao_depois": 25,
  "reducao": 20
}
```

#### Efeitos
- **Redução:** -20 de exaustão
- **Mínimo:** 0 (não fica negativo)

#### Regras
- Avatar deve estar **vivo**
- Sem custo

---

### POST /api/merge-avatares

Fusiona dois avatares em um único avatar mais poderoso.

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "avatarPrincipalId": "uuid-avatar-1",
  "avatarSacrificeId": "uuid-avatar-2"
}
```

#### Response (200 OK)
```json
{
  "message": "Avatares fundidos com sucesso",
  "avatar_resultado": {
    "id": "uuid-avatar-1",
    "nome": "Avatar Fundido",
    "forca": 35,
    "agilidade": 30,
    "resistencia": 32,
    "foco": 38,
    "merge_count": 1
  }
}
```

#### Efeitos
- **Stats:** Média dos dois avatares + bônus de 5%
- **Avatar sacrifício:** Deletado permanentemente
- **Contador:** `merge_count` incrementado
- **Nível:** Mantém o do avatar principal
- **XP:** Soma as XPs

#### Regras
- Ambos devem estar **vivos**
- Nenhum pode estar **ativo**
- Avatar sacrifício é **perdido permanentemente**

---

### POST /api/sacrificar-avatar

Sacrifica um avatar, enviando-o ao memorial.

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "avatarId": "uuid-do-avatar"
}
```

#### Response (200 OK)
```json
{
  "message": "Avatar sacrificado e enviado ao memorial",
  "avatar": {
    "nome": "Avatar do Fogo",
    "marca_morte": true,
    "vivo": false
  }
}
```

#### Efeitos
- `marca_morte = true`
- `vivo = false`
- Avatar vai para o memorial (não conta no limite de 15)
- **Irreversível** (avatar perdido para sempre)

#### Regras
- Avatar não pode estar **ativo**
- Libera slot para novas invocações

---

### POST /api/ressuscitar-avatar

Ressuscita um avatar morto (Necromante).

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "avatarId": "uuid-do-avatar"
}
```

#### Response (200 OK)
```json
{
  "message": "Avatar ressuscitado com sucesso",
  "avatar": {
    "id": "uuid",
    "nome": "Avatar do Fogo",
    "vivo": true,
    "marca_morte": true,
    "hp_atual": 1
  },
  "penalidades": {
    "stats": "-30%",
    "vinculo": "-50",
    "xp": "-30%",
    "exaustao": "+60"
  },
  "custos": {
    "moedas": 1500,
    "fragmentos": 150
  }
}
```

#### Custos por Raridade
| Raridade | Moedas | Fragmentos |
|----------|--------|------------|
| Comum | 500 | 50 |
| Raro | 1.000 | 100 |
| Lendário | 1.500 | 150 |

#### Penalidades Aplicadas
- **Stats:** -30% (forca, agilidade, resistencia, foco)
- **Vínculo:** -50 pontos
- **XP:** -30% da experiência total
- **Exaustão:** +60 (Exausto)
- **HP Atual:** 1 (incapacitado)
- **Marca da Morte:** true (só pode ressuscitar 1x)

#### Regras
- Avatar deve estar **morto** (`vivo = false`)
- Avatar **NÃO** pode ter `marca_morte = true` (já foi ressuscitado)
- Se morrer novamente com marca da morte → **Memorial permanente**

---

### POST /api/purificar-avatar

Remove a Marca da Morte e restaura parcialmente stats (Purificador).

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "avatarId": "uuid-do-avatar"
}
```

#### Response (200 OK)
```json
{
  "message": "Avatar purificado com sucesso",
  "avatar": {
    "id": "uuid",
    "nome": "Avatar do Fogo",
    "marca_morte": false
  },
  "beneficios": {
    "marca_morte": "Removida",
    "stats": "+15% (50% do perdido restaurado)",
    "vinculo": "+25",
    "exaustao": "Definida para 30"
  },
  "custos": {
    "moedas": 2000,
    "fragmentos": 200
  }
}
```

#### Custos por Raridade
| Raridade | Moedas | Fragmentos |
|----------|--------|------------|
| Comum | 1.000 | 100 |
| Raro | 2.000 | 200 |
| Lendário | 3.000 | 300 |

#### Benefícios Aplicados
- **Marca da Morte:** Removida (pode ressuscitar novamente)
- **Stats:** +15% (restaura 50% do que foi perdido na ressurreição)
- **Vínculo:** +25 pontos
- **Exaustão:** = 30 (Cansado)

#### Regras
- Avatar deve estar **vivo**
- Avatar **DEVE** ter `marca_morte = true`
- Mais caro que ressurreição (investimento para salvar avatar valioso)

---

## Mercado

### GET /api/mercado/listar

Lista todos os avatares à venda no mercado.

#### Request (Query Params)
```
GET /api/mercado/listar?raridade=Lendário&elemento=Fogo&nivel_min=20&nivel_max=50&preco_max_moedas=5000
```

#### Parâmetros de Filtro (Opcionais)
- `raridade` - Comum | Raro | Lendário
- `elemento` - Fogo | Água | Terra | Vento | Eletricidade | Sombra | Luz
- `nivel_min` - Nível mínimo
- `nivel_max` - Nível máximo
- `preco_max_moedas` - Preço máximo em moedas
- `preco_max_fragmentos` - Preço máximo em fragmentos

#### Response (200 OK)
```json
{
  "avatares": [
    {
      "id": "uuid",
      "nome": "Avatar do Fogo",
      "descricao": "Descrição...",
      "elemento": "Fogo",
      "raridade": "Lendário",
      "nivel": 25,
      "forca": 45,
      "agilidade": 38,
      "resistencia": 42,
      "foco": 50,
      "em_venda": true,
      "preco_venda": 5000,
      "preco_fragmentos": 50,
      "vendedor": {
        "nome_operacao": "Invocador Mestre"
      }
    }
  ],
  "total": 15
}
```

#### Notas
- Filtragem é feita em **JavaScript** (não no SQL)
- Apenas avatares com `em_venda = true` são exibidos
- Avatares mortos ou com marca da morte **não** aparecem

---

### POST /api/mercado/vender

Coloca um avatar à venda.

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "avatarId": "uuid-do-avatar",
  "precoMoedas": 5000,
  "precoFragmentos": 50
}
```

#### Response (200 OK)
```json
{
  "message": "Avatar colocado à venda com sucesso",
  "avatar": {
    "id": "uuid",
    "nome": "Avatar do Fogo",
    "em_venda": true,
    "preco_venda": 5000,
    "preco_fragmentos": 50
  }
}
```

#### Regras de Preço
- **Mínimo:** 100 moedas OU 1 fragmento
- **Máximo:** 10.000 moedas OU 500 fragmentos
- Pode definir **apenas moedas**, **apenas fragmentos** ou **ambos**
- Se definir ambos, comprador precisa ter **os dois**

#### Restrições
- Avatar **NÃO** pode estar ativo
- Avatar **DEVE** estar vivo
- Avatar **NÃO** pode ter marca da morte
- Limite de 15 avatares à venda por jogador (não implementado)

---

### DELETE /api/mercado/vender

Cancela a venda de um avatar.

#### Request (Query Params)
```
DELETE /api/mercado/vender?userId=uuid-do-usuario&avatarId=uuid-do-avatar
```

#### Response (200 OK)
```json
{
  "message": "Venda cancelada com sucesso",
  "avatar": {
    "id": "uuid",
    "nome": "Avatar do Fogo",
    "em_venda": false,
    "preco_venda": null,
    "preco_fragmentos": null
  }
}
```

#### Efeitos
- `em_venda = false`
- `preco_venda = null`
- `preco_fragmentos = null`
- Avatar volta para a coleção do jogador

---

### POST /api/mercado/comprar

Compra um avatar do mercado.

#### Request
```json
{
  "compradorId": "uuid-do-comprador",
  "avatarId": "uuid-do-avatar"
}
```

#### Response (200 OK)
```json
{
  "message": "Avatar comprado com sucesso!",
  "avatar": {
    "id": "uuid",
    "nome": "Avatar do Fogo",
    "user_id": "uuid-do-comprador"
  },
  "preco_moedas": 5000,
  "preco_fragmentos": 50,
  "taxa_moedas": 250,
  "saldo_moedas_restante": 4750,
  "saldo_fragmentos_restante": 100
}
```

#### Fluxo da Compra (RPC Atômica)
1. **Lock pessimista** no avatar (`FOR UPDATE`)
2. Valida se avatar está à venda
3. Valida se comprador tem moedas/fragmentos suficientes
4. **Deduz moedas/fragmentos do comprador**
5. **Calcula taxa de 5%** sobre moedas (não sobre fragmentos)
6. **Adiciona ao vendedor** (moedas - 5%)
7. **Transfere avatar** (muda `user_id`)
8. **Reseta:** `em_venda=false`, `vinculo=0`, `exaustao=0`
9. **Registra** em `mercado_transacoes`
10. **COMMIT** (tudo ou nada)

#### Taxa de Mercado
- **Moedas:** 5% de taxa (vendedor recebe 95%)
- **Fragmentos:** 0% de taxa (vendedor recebe 100%)

#### Exemplo de Cálculo
```
Preço: 5000 moedas + 50 fragmentos

Comprador paga: 5000💰 + 50💎
Vendedor recebe: 4750💰 + 50💎 (taxa de 250💰)
Taxa do sistema: 250💰
```

#### Restrições
- Comprador **NÃO** pode comprar próprio avatar
- Comprador **DEVE** ter moedas E fragmentos suficientes
- Comprador **NÃO** pode ter 15 avatares (limite)
- Avatar **DEVE** estar `em_venda = true`

#### Erros
- **400**: Avatar não está mais à venda
- **400**: Você não pode comprar seu próprio avatar
- **400**: Moedas insuficientes
- **400**: Fragmentos insuficientes
- **400**: Limite de 15 avatares atingido

---

## Inventário

### GET /api/inventario

Lista o inventário do jogador.

#### Request (Query Params)
```
GET /api/inventario?userId=uuid-do-usuario
```

#### Response (200 OK)
```json
{
  "inventario": [
    {
      "item_id": "uuid-do-item",
      "quantidade": 5,
      "item": {
        "nome": "Poção de Cura Menor",
        "descricao": "Restaura 50 HP",
        "tipo": "consumivel",
        "efeito": "cura",
        "valor_efeito": 50,
        "icone": "🧪",
        "raridade": "Comum"
      }
    }
  ]
}
```

---

### GET /api/inventario/loja

Lista os itens disponíveis na loja.

#### Request
```
GET /api/inventario/loja
```

#### Response (200 OK)
```json
{
  "itens": [
    {
      "id": "uuid",
      "nome": "Poção de Cura Menor",
      "descricao": "Restaura 50 HP",
      "tipo": "consumivel",
      "efeito": "cura",
      "valor_efeito": 50,
      "preco_compra": 100,
      "preco_venda": 50,
      "raridade": "Comum",
      "icone": "🧪",
      "empilhavel": true,
      "max_pilha": 99
    }
  ]
}
```

---

### POST /api/inventario/comprar

Compra um item da loja.

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "itemId": "uuid-do-item",
  "quantidade": 5
}
```

#### Response (200 OK)
```json
{
  "message": "Item comprado com sucesso",
  "item": {
    "nome": "Poção de Cura Menor",
    "quantidade": 5
  },
  "custo_total": 500,
  "moedas_restantes": 4500
}
```

#### Erros
- **400**: Moedas insuficientes

---

## PVP e Ranking

### GET /api/pvp/temporada

Retorna informações da temporada atual.

#### Request
```
GET /api/pvp/temporada
```

#### Response (200 OK)
```json
{
  "temporada": {
    "temporada_id": "2025-11",
    "nome": "Temporada de Novembro 2025",
    "data_inicio": "2025-11-01T00:00:00Z",
    "data_fim": "2025-11-30T23:59:59Z",
    "ativa": true,
    "dias_restantes": 12
  }
}
```

---

### POST /api/pvp/temporada/encerrar

Encerra a temporada atual e distribui recompensas (ADMIN).

#### Request
```json
{
  "temporadaId": "2025-11",
  "adminKey": "chave-admin-secreta"
}
```

#### Response (200 OK)
```json
{
  "message": "Temporada encerrada e recompensas distribuídas",
  "recompensas_distribuidas": 100,
  "nova_temporada": {
    "temporada_id": "2025-12",
    "ativa": true
  }
}
```

#### Fluxo
1. Marca temporada atual como `ativa = false`
2. Copia rankings para `pvp_historico_temporadas`
3. Calcula recompensas do Top 100
4. Insere em `pvp_recompensas_pendentes`
5. Cria títulos para Top 10
6. Cria nova temporada (mês seguinte)
7. Zera `pvp_rankings` para nova temporada

#### Distribuição de Recompensas

| Posição | Moedas | Fragmentos | Avatar | Título |
|---------|--------|------------|--------|--------|
| 1º | 5.000 | 50 | Lendário | 👑 Campeão da Temporada |
| 2º | 3.000 | 30 | Raro | 🥈 Vice-Campeão |
| 3º | 3.000 | 30 | Raro | 🥉 3º Lugar |
| 4º-10º | 1.500 | 20 | - | ⭐ Elite Top 10 |
| 11º-50º | 800 | 10 | - | - |
| 51º-100º | 400 | 5 | - | - |

---

### GET /api/pvp/ranking

Retorna o ranking do jogador na temporada atual.

#### Request (Query Params)
```
GET /api/pvp/ranking?userId=uuid-do-usuario
```

#### Response (200 OK)
```json
{
  "ranking": {
    "user_id": "uuid",
    "temporada_id": "2025-11",
    "fama": 2500,
    "vitorias": 45,
    "derrotas": 20,
    "streak": 5,
    "streak_maximo": 12,
    "posicao": 15,
    "tier": "Ouro",
    "ultima_batalha": "2025-11-18T15:30:00Z"
  }
}
```

#### Tiers por Fama
- **Bronze:** 0-999
- **Prata:** 1000-1999
- **Ouro:** 2000-2999
- **Platina:** 3000-3999
- **Diamante:** 4000-4999
- **Lendário:** 5000+

---

### GET /api/pvp/leaderboard

Retorna o leaderboard completo da temporada.

#### Request (Query Params)
```
GET /api/pvp/leaderboard?limit=100&offset=0
```

#### Response (200 OK)
```json
{
  "leaderboard": [
    {
      "posicao": 1,
      "user_id": "uuid",
      "nome_operacao": "Invocador Supremo",
      "fama": 5500,
      "vitorias": 120,
      "derrotas": 15,
      "winrate": 88.9,
      "streak": 10,
      "tier": "Lendário",
      "titulo_ativo": "👑 Campeão da Temporada Outubro"
    }
  ],
  "total": 1000
}
```

---

### GET /api/pvp/historico

Retorna o histórico de temporadas passadas do jogador.

#### Request (Query Params)
```
GET /api/pvp/historico?userId=uuid-do-usuario
```

#### Response (200 OK)
```json
{
  "historico": [
    {
      "temporada_id": "2025-10",
      "nome": "Temporada de Outubro 2025",
      "fama_final": 3200,
      "vitorias": 65,
      "derrotas": 28,
      "posicao_final": 8,
      "tier_final": "Platina",
      "data_encerramento": "2025-10-31T23:59:59Z",
      "recompensas_json": {
        "moedas": 1500,
        "fragmentos": 20,
        "titulo": "⭐ Elite Top 10"
      }
    }
  ]
}
```

---

### POST /api/pvp/batalha

Registra uma batalha PVP (real-time entre jogadores).

> **Nota:** Esta API está preparada mas o PVP real-time não está implementado. Use `/api/pvp/ia/finalizar` para PVP contra IA.

---

### GET /api/pvp/ia/oponentes

Busca oponentes IA para batalhar.

#### Request (Query Params)
```
GET /api/pvp/ia/oponentes?userId=uuid-do-usuario&quantidade=5
```

#### Response (200 OK)
```json
{
  "oponentes": [
    {
      "id": "uuid-oponente",
      "nome": "Avatar Guerreiro",
      "elemento": "Terra",
      "raridade": "Raro",
      "nivel": 22,
      "forca": 35,
      "agilidade": 28,
      "resistencia": 38,
      "foco": 30,
      "fama": 1200,
      "diferenca_fama": -300,
      "chance_vitoria": "Alta"
    }
  ]
}
```

#### Algoritmo de Matchmaking
- Busca avatares de **outros jogadores**
- Faixa de fama: **±500** da fama do jogador
- Ordenação aleatória
- Limite configurável (padrão: 5)

---

### POST /api/pvp/ia/finalizar

Finaliza uma batalha PVP contra IA e atualiza stats.

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "avatarId": "uuid-do-avatar",
  "vitoria": true,
  "famaGanha": 22,
  "vinculoGanho": 5,
  "exaustaoGanha": 15,
  "avatarMorreu": false,
  "hpFinal": 120
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Resultado da batalha salvo com sucesso",
  "ranking": {
    "fama": 2522,
    "vitorias": 46,
    "derrotas": 20,
    "streak": 6,
    "tier": "Ouro"
  }
}
```

#### Cálculo de Fama

**Base:**
- Vitória: +20
- Derrota: -15

**Bônus Upset (underdog vence):**
- Diferença > 200: +5
- Diferença > 500: +10
- Diferença > 1000: +20

**Bônus Streak:**
- A cada 3 vitórias consecutivas: +2 (máximo +10)

**Exemplo:**
```
Jogador: 1500 fama
Oponente: 2000 fama
Resultado: VITÓRIA

Cálculo:
  Base: +20
  Upset (diff=500): +10
  Streak (3 vitórias): +2
  Total: +32 fama
```

#### Morte e Incapacitação
- **30% chance:** MORTE REAL (`vivo = false`, `hp_atual = 0`)
- **70% chance:** INCAPACITADO (`vivo = true`, `hp_atual = 1`)

Se `avatarMorreu = true`:
- Avatar pode ser ressuscitado pelo Necromante
- Primeira morte: sem marca da morte
- Segunda morte: marca da morte ativa

---

### GET /api/pvp/ia/leaderboard

Retorna o leaderboard específico do PVP IA.

#### Request
```
GET /api/pvp/ia/leaderboard?limit=100
```

#### Response (200 OK)
```json
{
  "leaderboard": [
    {
      "posicao": 1,
      "nome_operacao": "Mestre IA",
      "fama": 3500,
      "vitorias": 85,
      "derrotas": 12,
      "winrate": 87.6,
      "tier": "Platina"
    }
  ]
}
```

---

### GET /api/pvp/recompensas

Lista recompensas pendentes do jogador.

#### Request (Query Params)
```
GET /api/pvp/recompensas?userId=uuid-do-usuario
```

#### Response (200 OK)
```json
{
  "recompensas": [
    {
      "id": "uuid",
      "temporada_id": "2025-10",
      "moedas": 1500,
      "fragmentos": 20,
      "avatar_lendario": false,
      "avatar_raro": false,
      "titulo_id": "uuid-titulo",
      "coletada": false,
      "created_at": "2025-11-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/pvp/recompensas/coletar

Coleta uma recompensa de fim de temporada.

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "recompensaId": "uuid-da-recompensa"
}
```

#### Response (200 OK)
```json
{
  "message": "Recompensas coletadas com sucesso!",
  "recompensa": {
    "moedas": 1500,
    "fragmentos": 20,
    "avatar_lendario": false,
    "avatar_raro": false,
    "titulo": {
      "nome": "⭐ Elite Top 10",
      "icone": "⭐"
    }
  },
  "avatar_invocado": null,
  "novo_saldo": {
    "moedas": 6500,
    "fragmentos": 170
  }
}
```

#### Fluxo
1. Valida se recompensa existe e não foi coletada
2. **Adiciona moedas e fragmentos** ao `player_stats`
3. **Invoca avatar** (se `avatar_lendario` ou `avatar_raro` = true)
4. **Ativa título** (se `titulo_id` presente)
5. Marca recompensa como `coletada = true`
6. Retorna detalhes completos

#### Regras
- Recompensa só pode ser coletada **uma vez**
- Avatar invocado vai direto para o inventário
- Título é ativado automaticamente

---

### GET /api/pvp/titulos

Lista todos os títulos do jogador.

#### Request (Query Params)
```
GET /api/pvp/titulos?userId=uuid-do-usuario
```

#### Response (200 OK)
```json
{
  "titulos": [
    {
      "id": "uuid",
      "titulo_nome": "👑 Campeão da Temporada Outubro",
      "titulo_icone": "👑",
      "temporada_id": "2025-10",
      "posicao_conquistada": 1,
      "ativo": true,
      "created_at": "2025-11-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/pvp/titulos

Ativa ou desativa um título.

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "tituloId": "uuid-do-titulo",
  "ativar": true
}
```

#### Response (200 OK)
```json
{
  "message": "Título ativado com sucesso",
  "titulo": {
    "titulo_nome": "👑 Campeão da Temporada Outubro",
    "ativo": true
  }
}
```

#### Regras
- Apenas **1 título ativo** por vez
- Ao ativar um, os outros são desativados automaticamente
- Títulos são **permanentes** (não expiram)

---

## Arena

### POST /api/arena/treino/iniciar

Inicia um treino na arena (PVE contra IA).

#### Request
```json
{
  "userId": "uuid-do-usuario",
  "avatarId": "uuid-do-avatar",
  "dificuldade": "medio"
}
```

#### Response (200 OK)
```json
{
  "message": "Treino iniciado",
  "oponente": {
    "id": "uuid-gerado",
    "nome": "Guardião de Treino",
    "elemento": "Terra",
    "raridade": "Comum",
    "nivel": 15,
    "forca": 20,
    "agilidade": 18,
    "resistencia": 22,
    "foco": 16
  }
}
```

#### Dificuldades
- **facil** - Oponente nível -5 do jogador
- **medio** - Oponente nível = jogador
- **dificil** - Oponente nível +5 do jogador

---

## Códigos de Status

### Sucesso
- **200 OK** - Requisição bem-sucedida
- **201 Created** - Recurso criado com sucesso

### Erros do Cliente
- **400 Bad Request** - Dados inválidos ou incompletos
- **401 Unauthorized** - Não autenticado
- **403 Forbidden** - Sem permissão
- **404 Not Found** - Recurso não encontrado

### Erros do Servidor
- **500 Internal Server Error** - Erro interno
- **503 Service Unavailable** - Serviço temporariamente indisponível

---

## Exemplos de Uso

### Exemplo 1: Fluxo Completo de Novo Jogador

```javascript
// 1. Cadastro
const cadastroRes = await fetch('/api/cadastro', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'jogador@email.com',
    senha: 'senha123',
    nomeOperacao: 'Invocador Prime'
  })
});
const { userId } = await cadastroRes.json();

// 2. Inicializar jogador
await fetch('/api/inicializar-jogador', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, nomeOperacao: 'Invocador Prime' })
});

// 3. Primeira invocação GRÁTIS
const invocacaoRes = await fetch('/api/invocar-avatar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId })
});
const { avatar } = await invocacaoRes.json();

// 4. Ativar avatar
await fetch('/api/meus-avatares', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, avatarId: avatar.id })
});

// 5. Buscar oponentes PVP IA
const oponentesRes = await fetch(`/api/pvp/ia/oponentes?userId=${userId}&quantidade=5`);
const { oponentes } = await oponentesRes.json();

// 6. Batalhar (lógica de batalha no frontend)
// ... batalha acontece ...

// 7. Finalizar batalha
await fetch('/api/pvp/ia/finalizar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    avatarId: avatar.id,
    vitoria: true,
    famaGanha: 20,
    vinculoGanho: 5,
    exaustaoGanha: 10,
    avatarMorreu: false,
    hpFinal: 150
  })
});
```

### Exemplo 2: Comprar Avatar do Mercado

```javascript
// 1. Listar avatares à venda
const mercadoRes = await fetch('/api/mercado/listar?raridade=Lendário&preco_max_moedas=10000');
const { avatares } = await mercadoRes.json();

const avatarEscolhido = avatares[0];

// 2. Verificar se tem moedas suficientes
const statsRes = await fetch(`/api/meus-avatares?userId=${userId}`);
const { stats } = await statsRes.json();

if (stats.moedas >= avatarEscolhido.preco_venda) {
  // 3. Comprar
  const compraRes = await fetch('/api/mercado/comprar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compradorId: userId,
      avatarId: avatarEscolhido.id
    })
  });

  const resultado = await compraRes.json();
  console.log('Avatar comprado!', resultado.message);
}
```

### Exemplo 3: Coletar Recompensas de Temporada

```javascript
// 1. Listar recompensas pendentes
const recompensasRes = await fetch(`/api/pvp/recompensas?userId=${userId}`);
const { recompensas } = await recompensasRes.json();

// 2. Coletar cada recompensa
for (const recompensa of recompensas) {
  if (!recompensa.coletada) {
    const coletarRes = await fetch('/api/pvp/recompensas/coletar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        recompensaId: recompensa.id
      })
    });

    const resultado = await coletarRes.json();
    console.log('Recompensa coletada:', resultado.recompensa);
  }
}
```

---

## Notas de Segurança

### ⚠️ Problemas Atuais

1. **Sem autenticação robusta**
   - Usa apenas `userId` no localStorage
   - Sem tokens JWT ou sessões
   - Qualquer um pode enviar requisições com `userId` de outro jogador

2. **Sem Rate Limiting**
   - APIs podem ser spammadas

3. **Sem Row Level Security (RLS)**
   - Service Role Key bypassa todas as políticas do Supabase

### ✅ Recomendações para Produção

1. Implementar **JWT tokens** ou **Supabase Auth Sessions**
2. Adicionar **middleware de autenticação** em todas as APIs
3. Implementar **RLS no Supabase** e usar Anon Key no frontend
4. Adicionar **rate limiting** (ex: 100 req/min por IP)
5. Validar **todos os inputs** no backend
6. Implementar **CORS** adequado
7. Adicionar **logs de auditoria**

---

**Última atualização:** Novembro 2025

**Total de APIs documentadas:** 33 endpoints

**Para mais detalhes sobre o banco de dados, veja:** [DATABASE.md](./DATABASE.md)
