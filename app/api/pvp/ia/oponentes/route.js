import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/ia/oponentes?poder=X&userId=Y
 * Busca avatares de outros players com poder similar para batalhas IA
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const poder = parseInt(searchParams.get('poder'));
    const userId = searchParams.get('userId');

    console.log('[OPONENTES IA] Parâmetros recebidos:', { poder, userId });

    if (!poder) {
      return NextResponse.json({ error: 'Poder é obrigatório' }, { status: 400 });
    }

    if (!userId) {
      console.error('[OPONENTES IA] userId não fornecido!');
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Calcular range de poder (±30%)
    const poderMin = Math.floor(poder * 0.7);
    const poderMax = Math.ceil(poder * 1.3);

    console.log(`[OPONENTES IA] Buscando avatares com poder entre ${poderMin} e ${poderMax}`);
    console.log(`[OPONENTES IA] EXCLUINDO avatares do userId: ${userId}`);

    // Buscar avatares de outros usuários
    // Calculamos poder total = forca + agilidade + resistencia + foco
    const { data: avatares, error } = await supabase
      .from('avatares')
      .select('id, user_id, nome, nivel, elemento, raridade, forca, agilidade, resistencia, foco, habilidades, vivo, experiencia')
      .neq('user_id', userId) // EXCLUIR PRÓPRIO USUÁRIO
      .eq('vivo', true) // Apenas avatares vivos
      .gte('nivel', 1) // Apenas avatares com nível
      .limit(50); // Pegar 50 para filtrar depois

    console.log(`[OPONENTES IA] Avatares encontrados no banco: ${avatares?.length || 0}`);

    if (avatares && avatares.length > 0) {
      console.log('[OPONENTES IA] Primeiros 3 avatares:', avatares.slice(0, 3).map(a => ({
        nome: a.nome,
        user_id: a.user_id,
        userId_eh_igual: a.user_id === userId
      })));
    }

    if (error) {
      console.error('[OPONENTES IA] Erro ao buscar avatares:', error);
      return NextResponse.json({ error: 'Erro ao buscar oponentes' }, { status: 500 });
    }

    // Calcular poder total e filtrar
    const avataresFiltrados = avatares
      .map(avatar => {
        const poderTotal = avatar.forca + avatar.agilidade + avatar.resistencia + avatar.foco;
        return { ...avatar, poderTotal };
      })
      .filter(avatar => {
        // DUPLA VERIFICAÇÃO: Garantir que não é do próprio usuário
        if (avatar.user_id === userId) {
          console.warn('[OPONENTES IA] AVISO: Avatar do próprio usuário quase passou!', avatar.nome);
          return false;
        }
        return avatar.poderTotal >= poderMin && avatar.poderTotal <= poderMax;
      })
      .sort(() => Math.random() - 0.5) // Randomizar ordem
      .slice(0, 12); // Pegar apenas 12

    console.log(`[OPONENTES IA] Encontrados ${avataresFiltrados.length} oponentes após filtro`);

    // Buscar nomes dos caçadores (donos dos avatares) da coluna nome_operacao
    const userIds = [...new Set(avataresFiltrados.map(a => a.user_id))];

    // Buscar usuários do Supabase Auth para pegar nome_operacao
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    console.log('[OPONENTES IA] Usuários auth encontrados:', authUsers?.users?.length || 0);

    // Criar mapa de userId -> nome (da coluna nome_operacao)
    const nomesMap = {};
    if (authUsers && authUsers.users && authUsers.users.length > 0) {
      authUsers.users.forEach(authUser => {
        if (userIds.includes(authUser.id)) {
          // Tentar pegar nome_operacao dos metadados ou usar email
          const nomeOperacao = authUser.user_metadata?.nome_operacao;
          if (nomeOperacao) {
            nomesMap[authUser.id] = nomeOperacao;
          } else {
            // Fallback: extrair do email
            const email = authUser.email;
            const username = email ? email.split('@')[0] : 'Misterioso';
            nomesMap[authUser.id] = username.charAt(0).toUpperCase() + username.slice(1);
          }
        }
      });
    }

    console.log('[OPONENTES IA] Nomes mapeados:', Object.keys(nomesMap).length);

    const oponentesFormatados = avataresFiltrados
      .filter(avatar => avatar.user_id !== userId) // VERIFICAÇÃO TRIPLA
      .map((avatar, index) => ({
        avatar: {
          id: avatar.id,
          nome: avatar.nome,
          nivel: avatar.nivel,
          elemento: avatar.elemento,
          raridade: avatar.raridade,
          forca: avatar.forca,
          agilidade: avatar.agilidade,
          resistencia: avatar.resistencia,
          foco: avatar.foco,
          habilidades: avatar.habilidades || [],
          experiencia: avatar.experiencia || 0
        },
        poderTotal: avatar.poderTotal,
        cacadorNome: nomesMap[avatar.user_id] || 'Caçador Misterioso',
        userId: avatar.user_id
      }));

    console.log(`[OPONENTES IA] Retornando ${oponentesFormatados.length} oponentes finais`);

    return NextResponse.json({
      success: true,
      oponentes: oponentesFormatados,
      filtros: {
        poderMin,
        poderMax,
        encontrados: oponentesFormatados.length,
        seuUserId: userId // Para debug
      }
    });

  } catch (error) {
    console.error('[OPONENTES IA] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
