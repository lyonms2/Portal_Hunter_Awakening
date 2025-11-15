"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calcularPoderTotal,
  calcularHPMaximoCompleto,
  aplicarPenalidadesExaustao,
  getNivelExaustao,
  getNivelVinculo
} from "@/lib/gameLogic";
import AvatarSVG from "../../components/AvatarSVG";

export default function PvPIAPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [oponentesDisponiveis, setOponentesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOponentes, setLoadingOponentes] = useState(false);
  const [modalAlerta, setModalAlerta] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    carregarAvatarAtivo(parsedUser.id);
  }, [router]);

  const carregarAvatarAtivo = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        const ativo = data.avatares.find(av => av.ativo && av.vivo);
        if (ativo) {
          setAvatarAtivo(ativo);
          // Buscar oponentes com poder similar, passando userId
          buscarOponentes(ativo, userId);
        } else {
          setAvatarAtivo(null);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar avatar ativo:", error);
    } finally {
      setLoading(false);
    }
  };

  const buscarOponentes = async (avatar, userId = null) => {
    setLoadingOponentes(true);
    try {
      const poderAtual = calcularPoderTotal(avatar);
      const userIdFinal = userId || user?.id;

      console.log('[FRONTEND] Buscando oponentes com userId:', userIdFinal);

      if (!userIdFinal) {
        console.error('[FRONTEND] userId não disponível!');
        return;
      }

      const response = await fetch(`/api/pvp/ia/oponentes?poder=${poderAtual}&userId=${userIdFinal}`);
      const data = await response.json();

      if (response.ok) {
        console.log('[FRONTEND] Oponentes recebidos:', data.oponentes?.length || 0);
        setOponentesDisponiveis(data.oponentes || []);
      } else {
        console.error('[FRONTEND] Erro ao buscar oponentes:', data);
      }
    } catch (error) {
      console.error("Erro ao buscar oponentes:", error);
    } finally {
      setLoadingOponentes(false);
    }
  };

  const iniciarBatalhaContraIA = (oponente) => {
    if (!avatarAtivo.vivo) {
      setModalAlerta({
        titulo: '💀 Avatar Morto',
        mensagem: 'Seu avatar está morto! Visite o Necromante para ressuscitá-lo.'
      });
      return;
    }

    if (avatarAtivo.exaustao >= 60) {
      setModalAlerta({
        titulo: '😰 Avatar Muito Exausto',
        mensagem: 'Seu avatar está muito exausto! Deixe-o descansar antes de batalhar.'
      });
      return;
    }

    confirmarBatalha(oponente);
  };

  const confirmarBatalha = (oponente) => {
    // Aplicar penalidades de exaustão
    const statsBase = {
      forca: avatarAtivo.forca,
      agilidade: avatarAtivo.agilidade,
      resistencia: avatarAtivo.resistencia,
      foco: avatarAtivo.foco
    };
    const statsComPenalidades = aplicarPenalidadesExaustao(statsBase, avatarAtivo.exaustao || 0);

    const avatarComPenalidades = {
      ...avatarAtivo,
      forca: statsComPenalidades.forca,
      agilidade: statsComPenalidades.agilidade,
      resistencia: statsComPenalidades.resistencia,
      foco: statsComPenalidades.foco,
      habilidades: Array.isArray(avatarAtivo.habilidades) ? avatarAtivo.habilidades : []
    };

    const avatarOponenteSeguro = {
      ...oponente.avatar,
      habilidades: Array.isArray(oponente.avatar.habilidades) ? oponente.avatar.habilidades : []
    };

    // Armazenar dados da partida
    const dadosPartida = {
      tipo: 'pvp-ia',
      modoIA: true,
      avatarJogador: avatarComPenalidades,
      avatarOponente: avatarOponenteSeguro,
      nomeOponente: oponente.avatar.nome,
      caçadorOponente: oponente.cacadorNome,
      famaApostada: 50, // TODO: Permitir escolher
      morteReal: true
    };

    sessionStorage.setItem('batalha_pvp_ia_dados', JSON.stringify(dadosPartida));

    // Redirecionar para tela de batalha PVP IA
    router.push('/arena/pvp-ia/batalha');
  };

  const getElementoColor = (elemento) => {
    const cores = {
      'Fogo': 'text-red-400',
      'Água': 'text-blue-400',
      'Terra': 'text-amber-600',
      'Vento': 'text-cyan-300',
      'Luz': 'text-yellow-300',
      'Trevas': 'text-purple-400'
    };
    return cores[elemento] || 'text-gray-400';
  };

  const getRaridadeColor = (raridade) => {
    const cores = {
      'Comum': 'text-gray-400',
      'Incomum': 'text-green-400',
      'Raro': 'text-blue-400',
      'Épico': 'text-purple-400',
      'Lendário': 'text-orange-400',
      'Mítico': 'text-red-400'
    };
    return cores[raridade] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse text-xl">
          Carregando Arena PvP...
        </div>
      </div>
    );
  }

  if (!avatarAtivo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500 rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-black text-red-400 mb-4">⚠️ Sem Avatar Ativo</h2>
          <p className="text-gray-300 mb-6">
            Você precisa ter um avatar ativo para entrar na Arena PvP.
          </p>
          <button
            onClick={() => router.push('/painel')}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  const poderTotal = calcularPoderTotal(avatarAtivo);
  const nivelExaustao = getNivelExaustao(avatarAtivo.exaustao || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/arena')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
            >
              ← Voltar para Arena
            </button>

            <button
              onClick={() => router.push('/arena/pvp-ia/leaderboard')}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              🏆 Leaderboard
            </button>
          </div>

          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-2">
            ⚔️ ARENA PVP
          </h1>
          <p className="text-gray-400 text-lg">
            Batalhe contra outros caçadores e prove seu valor
          </p>
        </div>

        {/* Seu Avatar */}
        <div className="bg-slate-900 border border-cyan-500 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-cyan-400">Seu Avatar Ativo</h2>
            <button
              onClick={() => router.push('/painel/avatares')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold text-sm"
            >
              🔄 Trocar Avatar
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Lado Esquerdo - Avatar e Info */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="p-4 bg-gradient-to-b from-cyan-900/20 to-transparent rounded-lg">
                  <AvatarSVG avatar={avatarAtivo} tamanho={140} />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{avatarAtivo.nome}</h3>
                <div className="flex gap-3 text-sm mb-2 flex-wrap">
                  <span className={`font-semibold ${getElementoColor(avatarAtivo.elemento)}`}>
                    {avatarAtivo.elemento}
                  </span>
                  <span className={getRaridadeColor(avatarAtivo.raridade)}>
                    {avatarAtivo.raridade}
                  </span>
                  <span className="text-yellow-400">Nv. {avatarAtivo.nivel}</span>
                </div>
                <div className="text-sm">
                  <div>⚔️ Poder: <span className="text-cyan-400 font-bold">{poderTotal}</span></div>
                </div>
              </div>
            </div>

            {/* Lado Direito - Barras de Progresso */}
            <div className="space-y-3">
              {/* HP Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">HP</span>
                  <span className="text-white font-bold">
                    {avatarAtivo.hp_atual || calcularHPMaximoCompleto(avatarAtivo)} / {calcularHPMaximoCompleto(avatarAtivo)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      ((avatarAtivo.hp_atual || calcularHPMaximoCompleto(avatarAtivo)) / calcularHPMaximoCompleto(avatarAtivo) * 100) > 50 ? 'bg-green-500' :
                      ((avatarAtivo.hp_atual || calcularHPMaximoCompleto(avatarAtivo)) / calcularHPMaximoCompleto(avatarAtivo) * 100) > 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${((avatarAtivo.hp_atual || calcularHPMaximoCompleto(avatarAtivo)) / calcularHPMaximoCompleto(avatarAtivo)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Exaustão Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Exaustão</span>
                  <span className={`font-bold ${
                    (avatarAtivo.exaustao || 0) >= 80 ? 'text-red-500' :
                    (avatarAtivo.exaustao || 0) >= 60 ? 'text-orange-500' :
                    (avatarAtivo.exaustao || 0) >= 40 ? 'text-yellow-500' : 'text-gray-400'
                  }`}>{avatarAtivo.exaustao || 0}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      (avatarAtivo.exaustao || 0) >= 80 ? 'bg-red-500' :
                      (avatarAtivo.exaustao || 0) >= 60 ? 'bg-orange-500' :
                      (avatarAtivo.exaustao || 0) >= 40 ? 'bg-yellow-500' : 'bg-gray-600'
                    }`}
                    style={{ width: `${avatarAtivo.exaustao || 0}%` }}
                  />
                </div>
              </div>

              {/* Vínculo Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Vínculo</span>
                  <span className="text-pink-400 font-bold">{avatarAtivo.vinculo || 0}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-pink-500 h-full transition-all"
                    style={{ width: `${avatarAtivo.vinculo || 0}%` }}
                  />
                </div>
              </div>

              {/* Alertas */}
              {(avatarAtivo.exaustao || 0) >= 60 && (
                <div className="bg-orange-950 border border-orange-500 rounded p-2 text-xs">
                  <span className="text-orange-400">⚠️ Avatar muito exausto! Não pode batalhar.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Oponentes */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-white">Oponentes Disponíveis</h2>
            <button
              onClick={() => buscarOponentes(avatarAtivo, user?.id)}
              disabled={loadingOponentes}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white px-6 py-2 rounded font-bold"
            >
              {loadingOponentes ? '🔄 Buscando...' : '🔄 Atualizar'}
            </button>
          </div>

          {loadingOponentes ? (
            <div className="text-center py-12">
              <div className="text-cyan-400 animate-pulse text-lg">Buscando oponentes...</div>
            </div>
          ) : oponentesDisponiveis.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-12 text-center">
              <div className="text-gray-400 text-lg mb-4">Nenhum oponente encontrado com poder similar</div>
              <p className="text-gray-500 text-sm">Tente novamente mais tarde</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oponentesDisponiveis.map((oponente, index) => (
                <div
                  key={index}
                  className="bg-slate-900 border border-slate-700 hover:border-orange-500 rounded-lg p-5 transition-all hover:scale-105 cursor-pointer"
                  onClick={() => iniciarBatalhaContraIA(oponente)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">{oponente.avatar.nome}</h3>
                      <p className="text-sm text-gray-400">Caçador: {oponente.cacadorNome}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 text-sm">Nv. {oponente.avatar.nivel}</div>
                      <div className={`text-xs ${getRaridadeColor(oponente.avatar.raridade)}`}>
                        {oponente.avatar.raridade}
                      </div>
                    </div>
                  </div>

                  {/* Avatar Image */}
                  <div className="flex justify-center mb-4 p-3 bg-gradient-to-b from-slate-950/50 to-transparent rounded-lg">
                    <AvatarSVG avatar={oponente.avatar} tamanho={140} />
                  </div>

                  {/* HP Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">HP</span>
                      <span className="text-white font-bold">{calcularHPMaximoCompleto(oponente.avatar)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-green-500 h-full w-full" />
                    </div>
                  </div>

                  {/* Poder Total e Elemento */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Poder Total</div>
                      <div className="text-cyan-400 font-bold text-lg">{oponente.poderTotal}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Elemento</div>
                      <div className="text-purple-400 font-bold text-lg">{oponente.avatar.elemento}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs text-center mb-4">
                    <div>
                      <div className="text-gray-400">FOR</div>
                      <div className="text-red-400 font-bold">{oponente.avatar.forca}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">AGI</div>
                      <div className="text-green-400 font-bold">{oponente.avatar.agilidade}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">RES</div>
                      <div className="text-blue-400 font-bold">{oponente.avatar.resistencia}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">FOC</div>
                      <div className="text-purple-400 font-bold">{oponente.avatar.foco}</div>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-2 rounded transition-all">
                    ⚔️ DESAFIAR
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Alerta */}
      {modalAlerta && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-500 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-3">{modalAlerta.titulo}</h3>
            <p className="text-gray-300 mb-6">{modalAlerta.mensagem}</p>
            <button
              onClick={() => setModalAlerta(null)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {modalConfirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-yellow-500 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">{modalConfirmacao.titulo}</h3>
            <p className="text-gray-300 mb-6">{modalConfirmacao.mensagem}</p>
            <div className="flex gap-3">
              <button
                onClick={modalConfirmacao.onCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={modalConfirmacao.onConfirm}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
