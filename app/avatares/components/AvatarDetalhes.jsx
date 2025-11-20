import { useState } from 'react';
import AvatarSVG from '../../components/AvatarSVG';
import { aplicarPenalidadesExaustao, getNivelExaustao } from '../sistemas/exhaustionSystem';

const calcularXPNecessario = (nivel) => {
  const XP_BASE = 100;
  const MULTIPLICADOR = 1.15;
  return Math.floor(XP_BASE * Math.pow(MULTIPLICADOR, nivel - 1));
};

const getInfoExaustao = (exaustao) => {
  if (exaustao >= 100) {
    return { emoji: '💀💀', cor: 'text-gray-400', nome: 'COLAPSADO' };
  } else if (exaustao >= 80) {
    return { emoji: '💀', cor: 'text-red-600', nome: 'COLAPSO IMINENTE' };
  } else if (exaustao >= 60) {
    return { emoji: '🔴', cor: 'text-red-400', nome: 'EXAUSTO' };
  } else if (exaustao >= 40) {
    return { emoji: '🟠', cor: 'text-orange-400', nome: 'CANSADO' };
  } else if (exaustao >= 20) {
    return { emoji: '💛', cor: 'text-yellow-400', nome: 'ALERTA' };
  } else {
    return { emoji: '💚', cor: 'text-green-400', nome: 'DESCANSADO' };
  }
};

const BarraExaustao = ({ exaustao }) => {
  const info = getInfoExaustao(exaustao || 0);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase">Exaustão</span>
        <span className={`text-xs font-bold ${info.cor}`}>
          {info.emoji} {exaustao || 0}/100
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full ${
            exaustao >= 80 ? 'bg-red-500' :
            exaustao >= 60 ? 'bg-orange-500' :
            exaustao >= 40 ? 'bg-yellow-500' :
            exaustao >= 20 ? 'bg-green-400' :
            'bg-green-500'
          } transition-all`}
          style={{width: `${Math.min(exaustao || 0, 100)}%`}}
        ></div>
      </div>
      {exaustao >= 80 && (
        <p className="text-[10px] text-red-400 font-mono">
          ⚠️ Não pode lutar! Necessita descanso.
        </p>
      )}
      {exaustao >= 60 && exaustao < 80 && (
        <p className="text-[10px] text-orange-400 font-mono">
          ⚠️ Risco alto! Penalidades severas.
        </p>
      )}
    </div>
  );
};

export default function AvatarDetalhes({
  avatar,
  onClose,
  getCorRaridade,
  getCorBorda,
  getCorElemento,
  getEmojiElemento,
  userId,
  onRename
}) {
  const [editandoNome, setEditandoNome] = useState(false);
  const [novoNome, setNovoNome] = useState(avatar?.nome || '');
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [erroNome, setErroNome] = useState('');

  if (!avatar) return null;

  const salvarNome = async () => {
    const nomeValidado = novoNome.trim();

    // Validações locais
    if (nomeValidado.length < 3) {
      setErroNome('O nome deve ter no mínimo 3 caracteres');
      return;
    }
    if (nomeValidado.length > 30) {
      setErroNome('O nome deve ter no máximo 30 caracteres');
      return;
    }
    if (nomeValidado === avatar.nome) {
      setEditandoNome(false);
      setErroNome('');
      return;
    }

    setSalvandoNome(true);
    setErroNome('');

    try {
      const response = await fetch('/api/renomear-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          avatarId: avatar.id,
          novoNome: nomeValidado
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEditandoNome(false);
        if (onRename) {
          onRename(avatar.id, nomeValidado);
        }
      } else {
        setErroNome(data.error || 'Erro ao renomear avatar');
      }
    } catch (error) {
      console.error('Erro ao renomear:', error);
      setErroNome('Erro de conexão');
    } finally {
      setSalvandoNome(false);
    }
  };

  const cancelarEdicao = () => {
    setEditandoNome(false);
    setNovoNome(avatar.nome);
    setErroNome('');
  };

  // Calcular stats com penalidades de exaustão
  const statsBase = {
    forca: avatar.forca || 0,
    agilidade: avatar.agilidade || 0,
    resistencia: avatar.resistencia || 0,
    foco: avatar.foco || 0
  };

  const statsAtuais = aplicarPenalidadesExaustao(statsBase, avatar.exaustao || 0);
  const nivelExaustao = getNivelExaustao(avatar.exaustao || 0);
  const temPenalidade = nivelExaustao.penalidades.stats !== undefined;
  const percentualPenalidade = temPenalidade ? Math.abs(nivelExaustao.penalidades.stats * 100) : 0;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center py-8">
        <div 
          className="max-w-4xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-lg blur opacity-75"></div>
            
            <div className="relative bg-slate-950/95 backdrop-blur-xl border border-cyan-900/30 rounded-lg overflow-hidden">
              {/* Header com raridade */}
              <div className={`p-3 text-center font-bold text-lg bg-gradient-to-r ${getCorRaridade(avatar.raridade)} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                <span className="relative">{avatar.raridade.toUpperCase()}</span>
              </div>
    
              {/* Botão Fechar */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 bg-slate-900/80 hover:bg-red-900/80 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-20 border border-slate-700/50 hover:border-red-500/50"
              >
                ✕
              </button>
    
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda - Imagem + Lore */}
                  <div className="space-y-4">
                    {/* Avatar em destaque */}
                    <div className={`bg-slate-900/70 rounded-lg p-6 aspect-square border-2 ${getCorBorda(avatar.raridade)} flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5"></div>
                      <div className="relative">
                        <AvatarSVG avatar={avatar} tamanho={240} />
                      </div>
                    </div>
    
                    {/* Nome e Elemento */}
                    <div className="text-center">
                      {editandoNome ? (
                        <div className="mb-2">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="text"
                              value={novoNome}
                              onChange={(e) => setNovoNome(e.target.value)}
                              maxLength={30}
                              className="px-3 py-2 bg-slate-800 border border-cyan-500/50 rounded text-white text-center font-bold focus:border-cyan-400 focus:outline-none w-48"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') salvarNome();
                                if (e.key === 'Escape') cancelarEdicao();
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <button
                              onClick={salvarNome}
                              disabled={salvandoNome}
                              className="px-3 py-1 bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 rounded text-xs font-bold text-green-400 transition-all disabled:opacity-50"
                            >
                              {salvandoNome ? '...' : '✓ Salvar'}
                            </button>
                            <button
                              onClick={cancelarEdicao}
                              disabled={salvandoNome}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-bold text-slate-400 transition-all disabled:opacity-50"
                            >
                              ✕ Cancelar
                            </button>
                          </div>
                          {erroNome && (
                            <p className="text-xs text-red-400 mt-2">{erroNome}</p>
                          )}
                          <p className="text-[10px] text-slate-500 mt-1">{novoNome.length}/30 caracteres</p>
                        </div>
                      ) : (
                        <div className="mb-2 group/nome">
                          <h3
                            className="text-2xl font-black bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent inline-flex items-center gap-2 cursor-pointer hover:from-cyan-200 hover:to-purple-200 transition-all"
                            onClick={() => {
                              setNovoNome(avatar.nome);
                              setEditandoNome(true);
                            }}
                            title="Clique para renomear"
                          >
                            {avatar.nome}
                            <span className="text-sm opacity-0 group-hover/nome:opacity-100 transition-opacity">✏️</span>
                          </h3>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className={`inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono ${getCorElemento(avatar.elemento)}`}>
                          {getEmojiElemento(avatar.elemento)} {avatar.elemento}
                        </span>
                        
                        {avatar.marca_morte && (
                          <span className="inline-block px-2 py-1 bg-red-900/80 border border-red-500/50 rounded-full text-xs font-bold text-white">
                            💀
                          </span>
                        )}
                      </div>
                    </div>
    
                    {/* Descrição/Lore */}
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                      <div className="text-xs text-cyan-400 font-bold uppercase mb-2 tracking-wider">Lore</div>
                      <p className="text-slate-300 text-sm leading-relaxed italic">
                        "{avatar.descricao}"
                      </p>
                    </div>

                    {/* Habilidades */}
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                      <div className="text-xs text-cyan-400 font-bold uppercase mb-3 tracking-wider">Habilidades</div>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                        {avatar.habilidades.map((hab, index) => (
                          <div key={index} className="bg-slate-800/50 rounded p-2 border border-slate-700/20">
                            <div className="font-bold text-purple-400 text-xs mb-1">{hab.nome}</div>
                            <div className="text-slate-400 text-[11px] leading-relaxed">{hab.descricao}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
    
                  {/* Coluna Direita - Stats e Progresso */}
                  <div className="space-y-4">
                    {/* Stats Principais */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-cyan-400 font-bold text-xs uppercase tracking-wider">Atributos</h4>
                        {temPenalidade && (
                          <span className="text-[10px] font-bold text-red-400 bg-red-900/30 px-2 py-1 rounded border border-red-500/30">
                            -{percentualPenalidade}% Exaustão
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Força */}
                        <div className={`bg-slate-900/50 rounded-lg p-3 text-center border ${temPenalidade ? 'border-red-500/50' : 'border-red-500/20'}`}>
                          <div className="text-xs text-slate-500 uppercase mb-1">Força</div>
                          {temPenalidade ? (
                            <div className="space-y-1">
                              <div className="text-sm text-slate-500 line-through">{statsBase.forca}</div>
                              <div className="text-2xl font-bold text-red-400">{statsAtuais.forca}</div>
                              <div className="text-[9px] text-red-400">({statsAtuais.forca - statsBase.forca})</div>
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-red-400">{statsBase.forca}</div>
                          )}
                        </div>

                        {/* Agilidade */}
                        <div className={`bg-slate-900/50 rounded-lg p-3 text-center border ${temPenalidade ? 'border-green-500/50' : 'border-green-500/20'}`}>
                          <div className="text-xs text-slate-500 uppercase mb-1">Agilidade</div>
                          {temPenalidade ? (
                            <div className="space-y-1">
                              <div className="text-sm text-slate-500 line-through">{statsBase.agilidade}</div>
                              <div className="text-2xl font-bold text-green-400">{statsAtuais.agilidade}</div>
                              <div className="text-[9px] text-red-400">({statsAtuais.agilidade - statsBase.agilidade})</div>
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-green-400">{statsBase.agilidade}</div>
                          )}
                        </div>

                        {/* Resistência */}
                        <div className={`bg-slate-900/50 rounded-lg p-3 text-center border ${temPenalidade ? 'border-blue-500/50' : 'border-blue-500/20'}`}>
                          <div className="text-xs text-slate-500 uppercase mb-1">Resistência</div>
                          {temPenalidade ? (
                            <div className="space-y-1">
                              <div className="text-sm text-slate-500 line-through">{statsBase.resistencia}</div>
                              <div className="text-2xl font-bold text-blue-400">{statsAtuais.resistencia}</div>
                              <div className="text-[9px] text-red-400">({statsAtuais.resistencia - statsBase.resistencia})</div>
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-blue-400">{statsBase.resistencia}</div>
                          )}
                        </div>

                        {/* Foco */}
                        <div className={`bg-slate-900/50 rounded-lg p-3 text-center border ${temPenalidade ? 'border-purple-500/50' : 'border-purple-500/20'}`}>
                          <div className="text-xs text-slate-500 uppercase mb-1">Foco</div>
                          {temPenalidade ? (
                            <div className="space-y-1">
                              <div className="text-sm text-slate-500 line-through">{statsBase.foco}</div>
                              <div className="text-2xl font-bold text-purple-400">{statsAtuais.foco}</div>
                              <div className="text-[9px] text-red-400">({statsAtuais.foco - statsBase.foco})</div>
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-purple-400">{statsBase.foco}</div>
                          )}
                        </div>
                      </div>
                    </div>
    
                    {/* Progresso Compacto */}
                    <div>
                      <h4 className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3">Progresso</h4>
                      <div className="space-y-3">
                        {/* Nível */}
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500 uppercase">Nível</span>
                            <span className="text-lg font-bold text-cyan-400">{avatar.nivel}</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1">
                            <div 
                              className="bg-cyan-400 h-1.5 rounded-full transition-all" 
                              style={{width: `${((avatar.experiencia || 0) / calcularXPNecessario(avatar.nivel)) * 100}%`}}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500">
                            <span>{avatar.experiencia || 0} XP</span>
                            <span>{calcularXPNecessario(avatar.nivel)} XP</span>
                          </div>
                        </div>

                        {/* Vínculo */}
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500 uppercase">Vínculo</span>
                            <span className="text-lg font-bold text-purple-400">{avatar.vinculo}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-1.5">
                            <div 
                              className="bg-purple-400 h-1.5 rounded-full transition-all" 
                              style={{width: `${avatar.vinculo || 0}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Exaustão */}
                    <div>
                      <h4 className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3">Condição Física</h4>
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <BarraExaustao exaustao={avatar.exaustao} />

                        {/* Info de Recuperação Passiva */}
                        {avatar.vivo && (
                          <div className="mt-3 p-2 bg-slate-800/50 rounded border border-slate-700/50">
                            {!avatar.ativo && (avatar.exaustao || 0) > 0 ? (
                              <div className="text-xs text-cyan-300 font-mono flex items-center gap-2">
                                <span className="animate-pulse">🌙</span>
                                <span>Recuperando passivamente (8 pts/hora)</span>
                              </div>
                            ) : avatar.ativo ? (
                              <div className="text-xs text-orange-300 font-mono flex items-center gap-2">
                                <span>⚡</span>
                                <span>Avatar ativo não recupera exaustão</span>
                              </div>
                            ) : (
                              <div className="text-xs text-green-300 font-mono flex items-center gap-2">
                                <span>✨</span>
                                <span>Totalmente descansado!</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total de Poder */}
                    <div className={`bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-lg p-4 border ${temPenalidade ? 'border-red-500/50' : 'border-cyan-500/30'}`}>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 uppercase mb-1">Poder Total</div>
                        {temPenalidade ? (
                          <div className="space-y-1">
                            <div className="text-lg text-slate-500 line-through">
                              {statsBase.forca + statsBase.agilidade + statsBase.resistencia + statsBase.foco}
                            </div>
                            <div className="text-3xl font-black text-red-400">
                              {statsAtuais.forca + statsAtuais.agilidade + statsAtuais.resistencia + statsAtuais.foco}
                            </div>
                            <div className="text-xs text-red-400 font-bold">
                              {(statsAtuais.forca + statsAtuais.agilidade + statsAtuais.resistencia + statsAtuais.foco) -
                               (statsBase.forca + statsBase.agilidade + statsBase.resistencia + statsBase.foco)} pts
                            </div>
                          </div>
                        ) : (
                          <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {statsBase.forca + statsBase.agilidade + statsBase.resistencia + statsBase.foco}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1">
                          {avatar.raridade}
                        </div>
                      </div>
                    </div>                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
      
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }
      
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 3px;
        }
      
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  );
}
