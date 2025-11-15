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

    if (!poder) {
      return NextResponse.json({ error: 'Poder é obrigatório' }, { status: 400 });
    }

    // Calcular range de poder (±30%)
    const poderMin = Math.floor(poder * 0.7);
    const poderMax = Math.ceil(poder * 1.3);

    console.log(`[OPONENTES IA] Buscando avatares com poder entre ${poderMin} e ${poderMax}`);

    // Buscar avatares de outros usuários
    // Calculamos poder total = forca + agilidade + resistencia + foco
    const { data: avatares, error } = await supabase
      .from('avatares')
      .select('id, user_id, nome, nivel, elemento, raridade, forca, agilidade, resistencia, foco, habilidades, vivo, experiencia')
      .neq('user_id', userId || '00000000-0000-0000-0000-000000000000') // Excluir próprio usuário
      .eq('vivo', true) // Apenas avatares vivos
      .gte('nivel', 1) // Apenas avatares com nível
      .limit(50); // Pegar 50 para filtrar depois

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
      .filter(avatar => avatar.poderTotal >= poderMin && avatar.poderTotal <= poderMax)
      .sort(() => Math.random() - 0.5) // Randomizar ordem
      .slice(0, 12); // Pegar apenas 12

    console.log(`[OPONENTES IA] Encontrados ${avataresFiltrados.length} oponentes`);

    // Buscar nomes dos caçadores (donos dos avatares)
    const userIds = [...new Set(avataresFiltrados.map(a => a.user_id))];

    // Buscar usuários reais do banco
    const { data: usuarios } = await supabase
      .from('users')
      .select('id, nome')
      .in('id', userIds);

    // Criar mapa de userId -> nome
    const nomesMap = {};
    if (usuarios && usuarios.length > 0) {
      usuarios.forEach(user => {
        nomesMap[user.id] = user.nome || 'Caçador Misterioso';
      });
    }

    const oponentesFormatados = avataresFiltrados.map((avatar, index) => ({
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

    return NextResponse.json({
      success: true,
      oponentes: oponentesFormatados,
      filtros: {
        poderMin,
        poderMax,
        encontrados: oponentesFormatados.length
      }
    });

  } catch (error) {
    console.error('[OPONENTES IA] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
