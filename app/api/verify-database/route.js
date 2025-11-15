import { NextResponse } from 'next/server';
import { getSupabaseClientSafe } from "@/lib/supabase/serverClient";

export const dynamic = 'force-dynamic';

/**
 * GET /api/verify-database
 * Verifica estrutura do banco de dados PVP
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseClientSafe(true);
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase não configurado',
        details: 'Verifique suas variáveis de ambiente'
      }, { status: 503 });
    }

    const resultado = {
      timestamp: new Date().toISOString(),
      tabelas: {},
      funcoes: {},
      resumo: {
        tabelasOk: 0,
        tabelasFaltando: 0,
        funcoesOk: 0,
        funcoesFaltando: 0
      },
      status: 'verificando'
    };

    // Verificar tabelas
    const tabelasParaVerificar = [
      { nome: 'pvp_challenges', novo: true },
      { nome: 'pvp_available_players', novo: true },
      { nome: 'pvp_battle_rooms', novo: false },
      { nome: 'pvp_matchmaking_queue', novo: false },
      { nome: 'pvp_rankings', novo: false }
    ];

    for (const { nome, novo } of tabelasParaVerificar) {
      try {
        const { data, error, count } = await supabase
          .from(nome)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.code === '42P01') {
            resultado.tabelas[nome] = {
              existe: false,
              novo,
              mensagem: 'Tabela não existe'
            };
            if (novo) resultado.resumo.tabelasFaltando++;
          } else {
            resultado.tabelas[nome] = {
              existe: false,
              novo,
              erro: error.message
            };
          }
        } else {
          resultado.tabelas[nome] = {
            existe: true,
            novo,
            registros: count || 0
          };
          if (novo) resultado.resumo.tabelasOk++;
        }
      } catch (e) {
        resultado.tabelas[nome] = {
          existe: false,
          novo,
          erro: e.message
        };
      }
    }

    // Verificar funções RPC
    const funcoesParaVerificar = [
      { nome: 'create_pvp_challenge', novo: true },
      { nome: 'accept_pvp_challenge', novo: true },
      { nome: 'reject_pvp_challenge', novo: true },
      { nome: 'cancel_pvp_challenge', novo: true },
      { nome: 'cleanup_expired_challenges', novo: true },
      { nome: 'cleanup_inactive_players', novo: true },
      { nome: 'find_pvp_match', novo: false },
      { nome: 'cleanup_expired_queue_entries', novo: false },
      { nome: 'cleanup_expired_battle_rooms', novo: false }
    ];

    for (const { nome, novo } of funcoesParaVerificar) {
      try {
        const { error } = await supabase.rpc(nome, {});

        if (error) {
          if (error.code === '42883') {
            resultado.funcoes[nome] = {
              existe: false,
              novo,
              mensagem: 'Função não existe'
            };
            if (novo) resultado.resumo.funcoesFaltando++;
          } else if (error.message.includes('required argument') ||
                     error.message.includes('null value') ||
                     error.message.includes('violates')) {
            resultado.funcoes[nome] = {
              existe: true,
              novo,
              mensagem: 'OK (erro esperado de validação)'
            };
            if (novo) resultado.resumo.funcoesOk++;
          } else {
            resultado.funcoes[nome] = {
              existe: true,
              novo,
              mensagem: 'OK'
            };
            if (novo) resultado.resumo.funcoesOk++;
          }
        } else {
          resultado.funcoes[nome] = {
            existe: true,
            novo,
            mensagem: 'OK'
          };
          if (novo) resultado.resumo.funcoesOk++;
        }
      } catch (e) {
        resultado.funcoes[nome] = {
          existe: false,
          novo,
          erro: e.message
        };
      }
    }

    // Dados adicionais
    if (resultado.tabelas.pvp_challenges?.existe) {
      const { data: challenges } = await supabase
        .from('pvp_challenges')
        .select('*')
        .limit(5);
      resultado.dadosExemplo = {
        desafios_ativos: challenges?.length || 0,
        exemplos: challenges || []
      };
    }

    if (resultado.tabelas.pvp_available_players?.existe) {
      const { data: players } = await supabase
        .from('pvp_available_players')
        .select('*')
        .limit(10);
      resultado.dadosExemplo = {
        ...resultado.dadosExemplo,
        jogadores_online: players?.length || 0,
        jogadores: players || []
      };
    }

    // Determinar status geral
    const tabelasNovasCompletas = resultado.resumo.tabelasOk === 2 && resultado.resumo.tabelasFaltando === 0;
    const funcoesNovasCompletas = resultado.resumo.funcoesOk >= 5; // Pelo menos 5 das 6 funções

    if (tabelasNovasCompletas && funcoesNovasCompletas) {
      resultado.status = 'OK';
      resultado.mensagem = '✅ Banco de dados configurado corretamente!';
    } else if (resultado.resumo.tabelasFaltando > 0 || resultado.resumo.funcoesFaltando > 0) {
      resultado.status = 'INCOMPLETO';
      resultado.mensagem = '⚠️ Execute o arquivo database/pvp_challenges.sql no Supabase SQL Editor';
    } else {
      resultado.status = 'ERRO';
      resultado.mensagem = '❌ Erros ao verificar banco de dados';
    }

    return NextResponse.json(resultado, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error) {
    console.error('Erro ao verificar banco de dados:', error);
    return NextResponse.json({
      error: 'Erro ao verificar banco de dados',
      details: error.message
    }, { status: 500 });
  }
}
