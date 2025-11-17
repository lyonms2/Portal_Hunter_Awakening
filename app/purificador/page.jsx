"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';

export default function PurificadorPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [avataresMarcados, setAvataresMarcados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [etapa, setEtapa] = useState('introducao');
  const [avatarSelecionado, setAvatarSelecionado] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [resultadoRitual, setResultadoRitual] = useState(null);

  // Custo da purificação (mais caro que ressurreição)
  const custos = {
    'Comum': { moedas: 1000, fragmentos: 100 },
    'Raro': { moedas: 2000, fragmentos: 200 },
    'Lendário': { moedas: 3000, fragmentos: 300 }
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
          // Filtrar apenas avatares VIVOS COM marca da morte
          const marcados = (avatarData.avatares || []).filter(av => av.vivo && av.marca_morte);
          setAvataresMarcados(marcados);
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
      realizarPurificacao();
    }, 3000);
  };

  const realizarPurificacao = async () => {
    try {
      const response = await fetch("/api/purificar-avatar", {
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
        setResultadoRitual(data);
        setEtapa('revelacao');
      } else {
        setMensagem({
          tipo: 'erro',
          texto: data.message || 'Erro ao purificar avatar'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Adentrando o santuário...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 text-gray-100 relative overflow-hidden">
      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-blue-900/10 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute w-64 h-64 bg-cyan-900/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Grid hexagonal */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY3lhbiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.95)] pointer-events-none"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        {/* Botão Voltar */}
        {etapa === 'introducao' && (
          <button
            onClick={voltarAoDashboard}
            className="absolute top-8 left-8 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 font-mono text-sm group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>RETORNAR</span>
          </button>
        )}

        <div className="max-w-5xl w-full">
          {/* ETAPA 1: INTRODUÇÃO */}
          {etapa === 'introducao' && (
            <div className="space-y-8 animate-fade-in">
              {/* Título */}
              <div className="text-center mb-12">
                <div className="text-7xl mb-4 animate-pulse-slow">✨</div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-4">
                  O PURIFICADOR
                </h1>
                <div className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-4"></div>
                <p className="text-slate-400 font-mono text-sm">Mestre dos Rituais de Purificação</p>
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

              {/* Diálogo do Purificador */}
              <div className="relative group mb-12">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-lg blur opacity-50"></div>

                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-cyan-900/30 rounded-lg p-8">
                  <div className="flex gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center text-3xl flex-shrink-0 border-2 border-cyan-500/50">
                      ✨
                    </div>
                    <div className="flex-1">
                      <h3 className="text-cyan-400 font-bold mb-2">O Purificador</h3>
                      <div className="space-y-3 text-slate-300 leading-relaxed">
                        <p className="font-mono text-sm">
                          "Vejo que você carrega almas marcadas pela morte... Cicatrizes profundas que o Necromante deixou."
                        </p>
                        <p className="font-mono text-sm">
                          "Posso purificar a Marca da Morte e <span className="text-cyan-400">restaurar 50% dos stats perdidos</span>.
                          Minha magia é de luz e renovação, o oposto das sombras necromânticas."
                        </p>
                        <p className="font-mono text-sm">
                          "O ritual é caro, mas seus avatares voltarão <span className="text-green-400">mais fortes</span> e sem a maldição."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-6"></div>

                  {/* Benefícios */}
                  <div className="bg-cyan-950/30 rounded-lg p-4 mb-4 border border-cyan-500/20">
                    <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-wider mb-3 text-center">
                      ✨ Benefícios da Purificação
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Remove a <span className="text-red-400">Marca da Morte</span></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Restaura <span className="text-cyan-400 font-bold">50%</span> dos stats perdidos na ressurreição</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Restaura <span className="text-cyan-400 font-bold">50%</span> do vínculo perdido</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Reduz exaustão para <span className="text-green-400">30</span> (Cansado)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">⚡</span>
                        <span className="text-cyan-400 font-bold">Avatar pode morrer e ser ressuscitado novamente!</span>
                      </li>
                    </ul>
                  </div>

                  {/* Tabela de Custos */}
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-wider mb-3 text-center">
                      Custos do Ritual
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-slate-800/50 rounded border border-slate-700/50">
                        <div className="text-slate-400 text-xs mb-2">COMUM</div>
                        <div className="text-amber-400 font-bold text-sm">1000 💰</div>
                        <div className="text-purple-400 font-bold text-sm">100 💎</div>
                      </div>
                      <div className="text-center p-3 bg-slate-800/50 rounded border border-cyan-700/50">
                        <div className="text-cyan-400 text-xs mb-2">RARO</div>
                        <div className="text-amber-400 font-bold text-sm">2000 💰</div>
                        <div className="text-purple-400 font-bold text-sm">200 💎</div>
                      </div>
                      <div className="text-center p-3 bg-slate-800/50 rounded border border-amber-700/50">
                        <div className="text-amber-400 text-xs mb-2">LENDÁRIO</div>
                        <div className="text-amber-400 font-bold text-sm">3000 💰</div>
                        <div className="text-purple-400 font-bold text-sm">300 💎</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Almas Marcadas */}
              {avataresMarcados.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4 opacity-30">✨</div>
                  <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhuma Alma Marcada</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Você não possui avatares vivos com a Marca da Morte...
                  </p>
                  <button
                    onClick={voltarAoDashboard}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm"
                  >
                    Retornar ao Dashboard
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-center text-cyan-400 font-bold text-xl mb-6 uppercase tracking-wider">
                    ✨ Almas Aguardando Purificação ✨
                  </h3>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {avataresMarcados.map((avatar) => {
                      const custo = custos[avatar.raridade];
                      const podePurificar = stats?.moedas >= custo.moedas && stats?.fragmentos >= custo.fragmentos;

                      return (
                        <div key={avatar.id} className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-all"></div>

                          <div className="relative bg-slate-950/90 backdrop-blur-xl border border-cyan-900/50 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-all">
                            {/* Badge */}
                            <div className={`px-4 py-2 text-center font-bold text-sm ${
                              avatar.raridade === 'Lendário' ? 'bg-gradient-to-r from-amber-600 to-yellow-500' :
                              avatar.raridade === 'Raro' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                              'bg-gradient-to-r from-slate-700 to-slate-600'
                            }`}>
                              {avatar.raridade.toUpperCase()} 💀
                            </div>

                            <div className="p-4">
                              {/* Avatar */}
                              <div className="mb-4 flex justify-center">
                                <AvatarSVG avatar={avatar} tamanho={150} />
                              </div>

                              {/* Info */}
                              <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-slate-300 mb-1">{avatar.nome}</h3>
                                <p className="text-xs text-slate-500">{avatar.elemento} • Nível {avatar.nivel}</p>
                                <div className="text-xs text-red-400 mt-2">💀 Marca da Morte</div>
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
                                disabled={!podePurificar}
                                className={`w-full group/btn relative ${!podePurificar ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                                <div className="relative px-4 py-3 bg-slate-950 rounded border border-cyan-500/50 transition-all">
                                  <span className="font-bold text-sm text-cyan-300">
                                    {podePurificar ? '✨ PURIFICAR' : '❌ SEM RECURSOS'}
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
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-2">
                  CONFIRMAR RITUAL
                </h2>
                <p className="text-slate-400 font-mono text-sm">A luz da purificação irá renovar sua alma</p>
              </div>

              <div className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg blur opacity-75"></div>

                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-cyan-900/30 rounded-lg overflow-hidden">
                  {/* Avatar Preview */}
                  <div className="flex justify-center py-6 bg-slate-900/30">
                    <AvatarSVG avatar={avatarSelecionado} tamanho={200} />
                  </div>

                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-center mb-4 text-cyan-300">
                      {avatarSelecionado.nome}
                    </h3>

                    {/* Benefícios */}
                    <div className="bg-cyan-950/30 border border-cyan-500/30 rounded p-4 mb-6">
                      <h4 className="text-cyan-400 font-bold mb-3 text-sm text-center">✨ O QUE SERÁ RESTAURADO:</h4>
                      <ul className="text-xs text-slate-300 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span><span className="text-cyan-400 font-bold">Marca da Morte removida</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Stats aumentados em <span className="text-green-400 font-bold">~15%</span> (50% do perdido)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Vínculo aumentado em <span className="text-green-400 font-bold">~25%</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Exaustão reduzida para <span className="text-green-400 font-bold">30</span></span>
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
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                        <div className="relative px-6 py-4 bg-slate-950 rounded border border-cyan-500/50 transition-all">
                          <span className="font-bold text-cyan-300">
                            ✨ PURIFICAR
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
              <div className="text-8xl animate-pulse-ritual mb-8">✨</div>

              <div className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-cyan-500/50 rounded-lg blur animate-pulse"></div>

                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-cyan-900/30 rounded-lg p-8">
                  <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-6">
                    RITUAL EM ANDAMENTO
                  </h2>

                  <div className="space-y-4 text-slate-300 font-mono text-sm mb-8">
                    <p className="animate-pulse">Canalizando luz sagrada...</p>
                    <p className="animate-pulse" style={{animationDelay: '0.5s'}}>Purificando a Marca da Morte...</p>
                    <p className="animate-pulse" style={{animationDelay: '1s'}}>Restaurando a essência perdida...</p>
                    <p className="animate-pulse text-cyan-400" style={{animationDelay: '1.5s'}}>A renovação está acontecendo...</p>
                  </div>

                  {/* Círculo de purificação */}
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-2 border-4 border-blue-500/30 rounded-full animate-spin-reverse"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">
                      ✨
                    </div>
                  </div>

                  {/* Barra de loading */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-loading-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 4: REVELAÇÃO */}
          {etapa === 'revelacao' && avatarSelecionado && resultadoRitual && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4 animate-bounce-slow">🌟</div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                  RITUAL COMPLETO
                </h2>
                <p className="text-slate-400 font-mono text-sm">A Marca da Morte foi purificada!</p>
              </div>

              <div className="relative group max-w-2xl mx-auto">
                <div className="flex justify-center py-8 bg-slate-900/30 rounded-t-lg">
                  <AvatarSVG avatar={avatarSelecionado} tamanho={250} />
                </div>

                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-cyan-500/30 rounded-lg blur opacity-75"></div>

                <div className="relative bg-slate-950/90 backdrop-blur-xl border border-cyan-900/30 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 text-center">
                    <span className="font-bold text-lg">✨ PURIFICADO ✨</span>
                  </div>

                  <div className="p-8">
                    <h3 className="text-3xl font-black text-center mb-4 text-cyan-300">
                      {avatarSelecionado.nome}
                    </h3>

                    {/* Benefícios aplicados */}
                    <div className="bg-cyan-950/30 border border-cyan-500/30 rounded p-4 mb-6">
                      <div className="flex items-center gap-3 justify-center mb-3">
                        <span className="text-2xl">✨</span>
                        <div className="text-center">
                          <div className="text-cyan-400 font-bold text-sm">MARCA DA MORTE REMOVIDA</div>
                          <div className="text-xs text-slate-400">Pode ser ressuscitado novamente se morrer</div>
                        </div>
                      </div>

                      {/* Melhorias aplicadas */}
                      {resultadoRitual.melhorias && (
                        <div className="space-y-1 text-xs text-slate-300">
                          {resultadoRitual.melhorias.avisos.map((aviso, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-green-400 flex-shrink-0">✓</span>
                              <span>{aviso}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-6"></div>

                    {/* Stats atualizados */}
                    <div className="grid grid-cols-4 gap-3 mb-6 text-center text-sm">
                      <div className="bg-slate-900/50 rounded p-3">
                        <div className="text-slate-500 text-xs mb-1">Força</div>
                        <div className="text-green-400 font-bold">{avatarSelecionado.forca}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3">
                        <div className="text-slate-500 text-xs mb-1">Agilidade</div>
                        <div className="text-green-400 font-bold">{avatarSelecionado.agilidade}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3">
                        <div className="text-slate-500 text-xs mb-1">Resistência</div>
                        <div className="text-green-400 font-bold">{avatarSelecionado.resistencia}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3">
                        <div className="text-slate-500 text-xs mb-1">Foco</div>
                        <div className="text-green-400 font-bold">{avatarSelecionado.foco}</div>
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
                        <div className="text-green-400 font-bold">{avatarSelecionado.vinculo}%</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs mb-1">Exaustão</div>
                        <div className="text-green-400 font-bold">{avatarSelecionado.exaustao}/100</div>
                      </div>
                    </div>

                    {/* Mensagem do Purificador */}
                    <div className="bg-slate-900/50 rounded p-4 mb-6 border border-cyan-500/20">
                      <p className="text-slate-300 text-sm font-mono italic text-center">
                        {resultadoRitual.lore?.depois ||
                         "Está feito. A luz da purificação restaurou sua essência. Seu avatar está renovado e livre da maldição."}
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent animate-scan-slow"></div>
      </div>

      {/* Luz flutuante */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-cyan-900/30 to-transparent animate-pulse-slow"></div>
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
