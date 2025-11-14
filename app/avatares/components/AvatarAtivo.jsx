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

export default function AvatarAtivo({
  avatar,
  onClickDetalhes,
  getCorRaridade,
  getCorBorda,
  getCorElemento,
  getEmojiElemento
}) {
  if (!avatar) return null;

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

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-3">
        <span className="text-3xl">⚔️</span>
        <span>AVATAR ATIVO</span>
      </h2>

      <div className="relative group">
        <div className="absolute -inset-2 bg-gradient-to-r from-green-500/30 via-cyan-500/30 to-blue-500/30 rounded-lg blur-xl animate-pulse"></div>
        
        <div 
          className="relative bg-slate-950/90 backdrop-blur-xl border-2 border-green-500/50 rounded-lg overflow-hidden cursor-pointer transform transition-all hover:scale-[1.02]"
          onClick={() => onClickDetalhes(avatar)}
        >
          {/* Badge de raridade */}
          <div className={`p-3 text-center font-bold text-lg bg-gradient-to-r ${getCorRaridade(avatar.raridade)} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            <span className="relative">{avatar.raridade.toUpperCase()}</span>
          </div>

          {/* Badge ATIVO pulsante */}
          <div className="absolute top-16 right-4 z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-lg animate-pulse"></div>
              <div className="relative bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                ATIVO
              </div>
            </div>
          </div>
          
          {/* Badge Marca da Morte */}
          {avatar.marca_morte && (
            <div className="absolute top-28 right-4 z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-red-900 rounded blur-lg opacity-50"></div>
                <div className="relative bg-red-900/90 text-white text-xs font-bold px-3 py-1.5 rounded border border-red-500/50 flex items-center gap-1.5">
                  <span>💀</span>
                  <span>MARCA DA MORTE</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 p-8">
            {/* Coluna Esquerda - Visual do Avatar */}
            <div>
              <div className={`bg-slate-900/70 rounded-lg p-3 aspect-square border-2 ${getCorBorda(avatar.raridade)} flex items-center justify-center`}>
                <AvatarSVG avatar={avatar} tamanho={200} />
              </div>
            </div>

            {/* Coluna Direita - Info */}
            <div className="space-y-4">
              {/* Nome */}
              <div>
                <h3 className="text-3xl font-black text-cyan-400 mb-2">
                  {avatar.nome}
                </h3>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-mono ${getCorElemento(avatar.elemento)}`}>
                    {getEmojiElemento(avatar.elemento)} {avatar.elemento}
                  </span>
                </div>
              </div>

              {/* Descrição */}
              <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-cyan-500/50 pl-4">
                {avatar.descricao}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className={`bg-slate-900/50 rounded p-3 text-center border ${temPenalidade ? 'border-red-500/50' : 'border-red-500/20'}`}>
                  <div className="text-xs text-slate-500 uppercase mb-1">FOR</div>
                  {temPenalidade ? (
                    <div>
                      <div className="text-sm text-slate-600 line-through">{statsBase.forca}</div>
                      <div className="text-2xl font-bold text-red-400">{statsAtuais.forca}</div>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-red-400">{statsBase.forca}</div>
                  )}
                </div>
                <div className={`bg-slate-900/50 rounded p-3 text-center border ${temPenalidade ? 'border-green-500/50' : 'border-green-500/20'}`}>
                  <div className="text-xs text-slate-500 uppercase mb-1">AGI</div>
                  {temPenalidade ? (
                    <div>
                      <div className="text-sm text-slate-600 line-through">{statsBase.agilidade}</div>
                      <div className="text-2xl font-bold text-green-400">{statsAtuais.agilidade}</div>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-green-400">{statsBase.agilidade}</div>
                  )}
                </div>
                <div className={`bg-slate-900/50 rounded p-3 text-center border ${temPenalidade ? 'border-blue-500/50' : 'border-blue-500/20'}`}>
                  <div className="text-xs text-slate-500 uppercase mb-1">RES</div>
                  {temPenalidade ? (
                    <div>
                      <div className="text-sm text-slate-600 line-through">{statsBase.resistencia}</div>
                      <div className="text-2xl font-bold text-blue-400">{statsAtuais.resistencia}</div>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-blue-400">{statsBase.resistencia}</div>
                  )}
                </div>
                <div className={`bg-slate-900/50 rounded p-3 text-center border ${temPenalidade ? 'border-purple-500/50' : 'border-purple-500/20'}`}>
                  <div className="text-xs text-slate-500 uppercase mb-1">FOC</div>
                  {temPenalidade ? (
                    <div>
                      <div className="text-sm text-slate-600 line-through">{statsBase.foco}</div>
                      <div className="text-2xl font-bold text-purple-400">{statsAtuais.foco}</div>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-purple-400">{statsBase.foco}</div>
                  )}
                </div>
              </div>

              {/* Progresso e Status */}
              <div className="space-y-3">
                {/* HP */}
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 uppercase">HP</span>
                    <span className="text-xl font-bold text-green-400">
                      {(() => {
                        const hpMaximo = avatar.resistencia * 10 + avatar.nivel * 5;
                        const hpAtual = avatar.hp_atual !== null && avatar.hp_atual !== undefined
                          ? avatar.hp_atual
                          : hpMaximo;
                        return `${hpAtual} / ${hpMaximo}`;
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${(() => {
                        const hpMaximo = avatar.resistencia * 10 + avatar.nivel * 5;
                        const hpAtual = avatar.hp_atual !== null && avatar.hp_atual !== undefined
                          ? avatar.hp_atual
                          : hpMaximo;
                        const hpPercent = (hpAtual / hpMaximo) * 100;

                        if (hpPercent > 70) return 'bg-green-500';
                        if (hpPercent > 40) return 'bg-yellow-500';
                        if (hpPercent > 20) return 'bg-orange-500';
                        return 'bg-red-500';
                      })()}`}
                      style={{
                        width: `${(() => {
                          const hpMaximo = avatar.resistencia * 10 + avatar.nivel * 5;
                          const hpAtual = avatar.hp_atual !== null && avatar.hp_atual !== undefined
                            ? avatar.hp_atual
                            : hpMaximo;
                          return Math.min((hpAtual / hpMaximo) * 100, 100);
                        })()}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Nível e XP */}
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 uppercase">Nível</span>
                    <span className="text-xl font-bold text-cyan-400">{avatar.nivel}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
                    <div
                      className="bg-cyan-400 h-2 rounded-full transition-all"
                      style={{width: `${((avatar.experiencia || 0) / calcularXPNecessario(avatar.nivel)) * 100}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{avatar.experiencia || 0} XP</span>
                    <span>{calcularXPNecessario(avatar.nivel)} XP</span>
                  </div>
                </div>

                {/* Vínculo */}
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 uppercase">Vínculo</span>
                    <span className="text-xl font-bold text-purple-400">{avatar.vinculo}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-purple-400 h-2 rounded-full transition-all" 
                      style={{width: `${avatar.vinculo || 0}%`}}
                    ></div>
                  </div>
                </div>

                {/* Exaustão */}
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <BarraExaustao exaustao={avatar.exaustao} />
                </div>

                {/* Total de Stats */}
                <div className={`bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-lg p-3 border ${temPenalidade ? 'border-red-500/50' : 'border-cyan-500/20'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase">Total de Poder</span>
                    {temPenalidade ? (
                      <div className="text-right">
                        <div className="text-sm text-slate-600 line-through">
                          {statsBase.forca + statsBase.agilidade + statsBase.resistencia + statsBase.foco}
                        </div>
                        <div className="text-2xl font-bold text-red-400">
                          {statsAtuais.forca + statsAtuais.agilidade + statsAtuais.resistencia + statsAtuais.foco}
                        </div>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {statsBase.forca + statsBase.agilidade + statsBase.resistencia + statsBase.foco}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Habilidades resumidas */}
              <div className="bg-slate-900/50 rounded p-3">
                <div className="text-xs text-slate-500 mb-2 uppercase">Habilidades</div>
                <div className="flex flex-wrap gap-2">
                  {avatar.habilidades.map((hab, index) => (
                    <span key={index} className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                      {hab.nome}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
