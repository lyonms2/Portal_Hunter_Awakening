"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';
import GameNav, { COMMON_ACTIONS } from '../components/GameNav';

export default function NecromantePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [avataresMortos, setAvataresMortos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [etapa, setEtapa] = useState('introducao');
  const [avatarSelecionado, setAvatarSelecionado] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [resultadoRitual, setResultadoRitual] = useState(null);

  const custos = {
    'Comum': { moedas: 500, fragmentos: 50 },
    'Raro': { moedas: 1000, fragmentos: 100 },
    'Lendário': { moedas: 1500, fragmentos: 150 }
  };

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      try {
        const statsResponse = await fetch("/api/inicializar-jogador", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parsedUser.id }),
        });
        const statsData = await statsResponse.json();
        setStats(statsData.stats);

        const avatarResponse = await fetch(`/api/meus-avatares?userId=${parsedUser.id}`);
        const avatarData = await avatarResponse.json();
        
        if (avatarResponse.ok) {
          // Filtrar apenas avatares mortos SEM marca da morte
          const mortos = (avatarData.avatares || []).filter(av => !av.vivo && !av.marca_morte);
          setAvataresMortos(mortos);
        }
      } catch (error) {
        console.error("Erro ao carregar:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const selecionarAvatar = (avatar) => {
    setAvatarSelecionado(avatar);
    setEtapa('selecionando');
  };

  const iniciarRitual = () => {
    setEtapa('ritual');
    setProcessando(true);
    setMensagem(null);

    setTimeout(() => {
      realizarRessurreicao();
    }, 3000);
  };

  const realizarRessurreicao = async () => {
    try {
      const response = await fetch("/api/ressuscitar-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatarSelecionado.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
        setAvatarSelecionado(data.avatar);
        setResultadoRitual(data); // Guardar resultado completo
        setEtapa('revelacao');
      } else {
        setMensagem({
          tipo: 'erro',
          texto: data.message || 'Erro ao ressuscitar avatar'
        });
        setEtapa('introducao');
      }
    } catch (error) {
      console.error("Erro:", error);
      setMensagem({
        tipo: 'erro',
        texto: 'Erro ao realizar ritual'
      });
      setEtapa('introducao');
    } finally {
      setProcessando(false);
    }
  };

  const voltarAoDashboard = () => {
    router.push("/dashboard");
  };

  const verAvatares = () => {
    router.push("/avatares");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-purple-400 font-mono animate-pulse">Adentrando as sombras...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-gray-100 relative overflow-hidden">
      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-900/10 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-red-900/10 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute w-64 h-64 bg-purple-900/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Grid hexagonal */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjcHVycGxlIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.95)] pointer-events-none"></div>

      {/* Navegação padronizada - apenas na introdução */}
      {etapa === 'introducao' && (
        <GameNav
          backTo="/avatares"
          backLabel="AVATARES"
          title="O NECROMANTE"
          subtitle="Senhor da Ressurreição"
        />
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">

        <div className="max-w-5xl w-full">
          {/* ETAPA 1: INTRODUÇÃO */}
          {etapa === 'introducao' && (
            <div className="space-y-8 animate-fade-in">
              {/* Título */}
              <div className="text-center mb-12">
                <div className="text-7xl mb-4 animate-pulse-slow">⚰️</div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-purple-300 via-red-300 to-purple-300 bg-clip-text text-transparent mb-4">
                  O NECROMANTE
                </h1>
                <div className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-4"></div>
                <p className="text-slate-400 font-mono text-sm">Mestre dos Rituais de Ressurreição</p>
              </div>

              {/* Recursos */}
              <div className="flex justify-center gap-4 mb-8">
                <div className="bg-slate-950/80 backdrop-blur border border-amber-500/30 rounded px-6 py-3">
                  <span className="text-amber-400 font-bold text-lg">💰 {stats?.moedas || 0}</span>
                </div>
                <div className="bg-slate-950/80 backdrop-blur border border-purple-500/30 rounded px-6 py-3">
                  <span className="text-purple-400 font-bold text-lg">💎 {stats?.fragmentos || 0}</span>
                </div>
              </div>

              {/* Diálogo do Necromante */}
              <div className="relative group mb-12">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-red-500/20 to-purple-500/20 rounded-lg blur opacity-50"></div>
                
                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-purple-900/30 rounded-lg p-8">
                  <div className="flex gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-red-600 rounded-full flex items-center justify-center text-3xl flex-shrink-0 border-2 border-purple-500/50">
                      💀
                    </div>
                    <div className="flex-1">
                      <h3 className="text-purple-400 font-bold mb-2">O Necromante</h3>
                      <div className="space-y-3 text-slate-300 leading-relaxed">
                        <p className="font-mono text-sm">
                          "Ah... sinto o peso da perda em sua alma. Você vem buscar aqueles que cruzaram o véu..."
                        </p>
                        <p className="font-mono text-sm">
                          "A morte não é o fim, caçador. Com os rituais corretos, posso trazer seus avatares de volta. 
                          Mas saiba: eles retornarão... <span className="text-red-400">diferentes</span>. Mais fracos. Marcados pela morte."
                        </p>
                        <p className="font-mono text-sm">
                          "O preço é alto, e as cicatrizes são eternas. <span className="text-purple-400">Cada avatar só pode ser ressuscitado uma vez.</span>"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-6"></div>

                  {/* Tabela de Custos */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="text-purple-400 font-bold text-sm uppercase tracking-wider mb-3 text-center">
                      Custos do Ritual
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-slate-800/50 rounded border border-slate-700/50">
                        <div className="text-slate-400 text-xs mb-2">COMUM</div>
                        <div className="text-amber-400 font-bold text-sm">500 💰</div>
                        <div className="text-purple-400 font-bold text-sm">50 💎</div>
                      </div>
                      <div className="text-center p-3 bg-slate-800/50 rounded border border-purple-700/50">
                        <div className="text-purple-400 text-xs mb-2">RARO</div>
                        <div className="text-amber-400 font-bold text-sm">1000 💰</div>
                        <div className="text-purple-400 font-bold text-sm">100 💎</div>
                      </div>
                      <div className="text-center p-3 bg-slate-800/50 rounded border border-amber-700/50">
                        <div className="text-amber-400 text-xs mb-2">LENDÁRIO</div>
                        <div className="text-amber-400 font-bold text-sm">1500 💰</div>
                        <div className="text-purple-400 font-bold text-sm">150 💎</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Almas Perdidas */}
              {avataresMortos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4 opacity-30">☠️</div>
                  <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhuma Alma Disponível</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Todos os seus avatares estão vivos ou já carregam a Marca da Morte...
                  </p>
                  <button
                    onClick={voltarAoDashboard}
                    className="text-purple-400 hover:text-purple-300 transition-colors font-mono text-sm"
                  >
                    Retornar ao Dashboard
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-center text-purple-400 font-bold text-xl mb-6 uppercase tracking-wider">
                    ☠️ Almas Aguardando o Ritual ☠️
                  </h3>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {avataresMortos.map((avatar) => {
                      const custo = custos[avatar.raridade];
                      const podeRessuscitar = stats?.moedas >= custo.moedas && stats?.fragmentos >= custo.fragmentos;

                      return (
                        <div key={avatar.id} className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-red-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all"></div>
                          
                          <div className="relative bg-slate-950/90 backdrop-blur-xl border border-purple-900/50 rounded-lg overflow-hidden hover:border-purple-500/50 transition-all">
                            {/* Badge */}
                            <div className={`px-4 py-2 text-center font-bold text-sm ${
                              avatar.raridade === 'Lendário' ? 'bg-gradient-to-r from-amber-600 to-yellow-500' :
                              avatar.raridade === 'Raro' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                              'bg-gradient-to-r from-slate-700 to-slate-600'
                            }`}>
                              {avatar.raridade.toUpperCase()} ☠️
                            </div>

                            <div className="p-4">
                              {/* Avatar */}
                              <div className="mb-4 opacity-40 grayscale-[80%] hover:grayscale-[50%] transition-all">
                                <AvatarSVG avatar={avatar} tamanho={150} />
                              </div>

                              {/* Info */}
                              <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-slate-300 mb-1">{avatar.nome}</h3>
                                <p className="text-xs text-slate-500">{avatar.elemento} • Nível {avatar.nivel}</p>
                              </div>

                              {/* Custo */}
                              <div className="bg-slate-900/50 rounded p-3 mb-3 border border-slate-800/50">
                                <div className="text-xs text-slate-500 mb-2 text-center">Custo:</div>
                                <div className="flex justify-center gap-4">
                                  <span className={`text-sm font-bold ${stats?.moedas >= custo.moedas ? 'text-amber-400' : 'text-red-400'}`}>
                                    💰 {custo.moedas}
                                  </span>
                                  <span className={`text-sm font-bold ${stats?.fragmentos >= custo.fragmentos ? 'text-purple-400' : 'text-red-400'}`}>
                                    💎 {custo.fragmentos}
                                  </span>
                                </div>
                              </div>

                              {/* Botão */}
                              <button
                                onClick={() => selecionarAvatar(avatar)}
                                disabled={!podeRessuscitar}
                                className={`w-full group/btn relative ${!podeRessuscitar ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-red-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                                <div className="relative px-4 py-3 bg-slate-950 rounded border border-purple-500/50 transition-all">
                                  <span className="font-bold text-sm text-purple-300">
                                    {podeRessuscitar ? '⚰️ INICIAR RITUAL' : '❌ SEM RECURSOS'}
                                  </span>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mensagem de erro */}
              {mensagem && mensagem.tipo === 'erro' && (
                <div className="relative group max-w-2xl mx-auto">
                  <div className="absolute -inset-1 bg-red-500/30 rounded-lg blur"></div>
                  <div className="relative bg-red-950/50 border border-red-500/30 rounded p-4">
                    <p className="text-red-400 text-center font-mono text-sm">{mensagem.texto}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 2: CONFIRMAÇÃO */}
          {etapa === 'selecionando' && avatarSelecionado && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">⚰️</div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-purple-300 to-red-300 bg-clip-text text-transparent mb-2">
                  CONFIRMAR RITUAL
                </h2>
                <p className="text-slate-400 font-mono text-sm">O ritual de necromancia é irreversível</p>
              </div>

              <div className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-red-500/30 rounded-lg blur opacity-75"></div>
                
                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-purple-900/30 rounded-lg overflow-hidden">
                  {/* Avatar Preview */}
                  <div className="flex justify-center py-6 bg-slate-900/30">
                    <div className="opacity-50 grayscale-[70%]">
                      <AvatarSVG avatar={avatarSelecionado} tamanho={200} />
                    </div>
                  </div>

                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-center mb-4 text-purple-300">
                      {avatarSelecionado.nome}
                    </h3>

                    {/* Avisos CORRIGIDOS */}
                    <div className="bg-red-950/30 border border-red-500/30 rounded p-4 mb-6">
                      <h4 className="text-red-400 font-bold mb-3 text-sm text-center">⚠️ CONSEQUÊNCIAS DO RITUAL:</h4>
                      <ul className="text-xs text-slate-300 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span>Stats reduzidos em <span className="text-red-400 font-bold">30%</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span>Vínculo reduzido em <span className="text-red-400 font-bold">50%</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span>XP reduzida em <span className="text-red-400 font-bold">30%</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span>Exaustão elevada para <span className="text-red-400 font-bold">60</span> (EXAUSTO)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          <span><span className="text-purple-400 font-bold">💀 Marca da Morte</span> (não pode ser ressuscitado novamente)</span>
                        </li>
                      </ul>
                    </div>

                    {/* Custo */}
                    <div className="bg-slate-900/50 rounded p-4 mb-6">
                      <div className="text-center mb-2">
                        <span className="text-slate-400 text-sm font-mono">Custo Total do Ritual:</span>
                      </div>
                      <div className="flex justify-center gap-6">
                        <span className="text-2xl font-bold text-amber-400">
                          💰 {custos[avatarSelecionado.raridade].moedas}
                        </span>
                        <span className="text-2xl font-bold text-purple-400">
                          💎 {custos[avatarSelecionado.raridade].fragmentos}
                        </span>
                      </div>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => setEtapa('introducao')}
                        className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={iniciarRitual}
                        className="flex-1 group/btn relative"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-red-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                        <div className="relative px-6 py-4 bg-slate-950 rounded border border-purple-500/50 transition-all">
                          <span className="font-bold text-purple-300">
                            ⚰️ REALIZAR RITUAL
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: RITUAL */}
          {etapa === 'ritual' && (
            <div className="text-center space-y-8 animate-fade-in">
              <div className="text-8xl animate-pulse-ritual mb-8">⚰️</div>
              
              <div className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/50 via-red-500/50 to-purple-500/50 rounded-lg blur animate-pulse"></div>
                
                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-purple-900/30 rounded-lg p-8">
                  <h2 className="text-3xl font-black bg-gradient-to-r from-purple-300 via-red-300 to-purple-300 bg-clip-text text-transparent mb-6">
                    RITUAL EM ANDAMENTO
                  </h2>
                  
                  <div className="space-y-4 text-slate-300 font-mono text-sm mb-8">
                    <p className="animate-pulse">Invocando energias ancestrais...</p>
                    <p className="animate-pulse" style={{animationDelay: '0.5s'}}>Atravessando o véu entre mundos...</p>
                    <p className="animate-pulse" style={{animationDelay: '1s'}}>Reanimando a essência perdida...</p>
                    <p className="animate-pulse text-red-400" style={{animationDelay: '1.5s'}}>A morte está sendo desafiada...</p>
                  </div>

                  {/* Círculo de necromancia */}
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-2 border-4 border-red-500/30 rounded-full animate-spin-reverse"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">
                      💀
                    </div>
                  </div>

                  {/* Barra de loading */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 via-red-500 to-purple-500 animate-loading-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 4: REVELAÇÃO CORRIGIDA */}
          {etapa === 'revelacao' && avatarSelecionado && resultadoRitual && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4 animate-bounce-slow">✨</div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-purple-300 via-red-300 to-purple-300 bg-clip-text text-transparent mb-2">
                  RITUAL COMPLETO
                </h2>
                <p className="text-slate-400 font-mono text-sm">O avatar retornou do além...</p>
              </div>

              <div className="relative group max-w-2xl mx-auto">
                <div className="flex justify-center py-8 bg-slate-900/30 rounded-t-lg">
                  <AvatarSVG avatar={avatarSelecionado} tamanho={250} />
                </div>

                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-red-500/30 to-purple-500/30 rounded-lg blur opacity-75"></div>
                
                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-purple-900/30 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-red-600 p-4 text-center">
                    <span className="font-bold text-lg">☠️ RESSUSCITADO ☠️</span>
                  </div>

                  <div className="p-8">
                    <h3 className="text-3xl font-black text-center mb-4 text-purple-300">
                      {avatarSelecionado.nome}
                    </h3>

                    {/* Marca da Morte */}
                    <div className="bg-red-950/30 border border-red-500/30 rounded p-4 mb-6">
                      <div className="flex items-center gap-3 justify-center mb-3">
                        <span className="text-2xl">💀</span>
                        <div className="text-center">
                          <div className="text-red-400 font-bold text-sm">MARCA DA MORTE</div>
                          <div className="text-xs text-slate-400">Não pode ser ressuscitado novamente</div>
                        </div>
                      </div>
                      
                      {/* Penalidades aplicadas */}
                      {resultadoRitual.penalidades && (
                        <div className="space-y-1 text-xs text-slate-300">
                          {resultadoRitual.penalidades.avisos.map((aviso, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-red-400 flex-shrink-0">•</span>
                              <span>{aviso}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-6"></div>

                    {/* Stats atualizados */}
                    <div className="grid grid-cols-4 gap-3 mb-6 text-center text-sm">
                      <div className="bg-slate-900/50 rounded p-3">
                        <div className="text-slate-500 text-xs mb-1">Força</div>
                        <div className="text-red-400 font-bold">{avatarSelecionado.forca}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3">
                        <div className="text-slate-500 text-xs mb-1">Agilidade</div>
                        <div className="text-cyan-400 font-bold">{avatarSelecionado.agilidade}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3">
                        <div className="text-slate-500 text-xs mb-1">Resistência</div>
                        <div className="text-green-400 font-bold">{avatarSelecionado.resistencia}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3">
                        <div className="text-slate-500 text-xs mb-1">Foco</div>
                        <div className="text-purple-400 font-bold">{avatarSelecionado.foco}</div>
                      </div>
                    </div>

                    {/* Status geral */}
                    <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Nível</div>
                        <div className="text-cyan-400 font-bold">{avatarSelecionado.nivel}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Vínculo</div>
                        <div className="text-red-400 font-bold">{avatarSelecionado.vinculo}%</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Exaustão</div>
                        <div className="text-orange-400 font-bold">{avatarSelecionado.exaustao}/100</div>
                      </div>
                    </div>

                    {/* Mensagem do Necromante */}
                    <div className="bg-slate-900/50 rounded p-4 mb-6 border border-purple-500/20">
                      <p className="text-slate-300 text-sm font-mono italic text-center">
                        {resultadoRitual.lore?.depois || 
                         "Está feito. Seu avatar retornou, mas carrega as cicatrizes da morte. Cuide bem dele desta vez, caçador..."}
                      </p>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-4">
                      <button
                        onClick={voltarAoDashboard}
                        className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors font-bold"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={verAvatares}
                        className="flex-1 group/btn relative"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                        <div className="relative px-6 py-4 bg-slate-950 rounded border border-cyan-500/50 transition-all">
                          <span className="font-bold text-cyan-300">
                            Ver Avatares
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Efeito de scan */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.01]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent animate-scan-slow"></div>
      </div>

      {/* Névoa flutuante */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-purple-900/30 to-transparent animate-pulse-slow"></div>
      </div>

      <style jsx>{`
        @keyframes scan-slow {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes pulse-ritual {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes loading-bar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-ritual {
          animation: pulse-ritual 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 3s linear infinite;
        }

        .animate-loading-bar {
          animation: loading-bar 3s ease-out;
        }

        .animate-scan-slow {
          animation: scan-slow 8s linear infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
