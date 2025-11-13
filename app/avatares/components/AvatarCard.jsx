import AvatarSVG from '../../components/AvatarSVG';
import { aplicarPenalidadesExaustao, getNivelExaustao } from '../sistemas/exhaustionSystem';

const getInfoExaustao = (exaustao) => {
  if (exaustao >= 100) {
    return { emoji: '💀💀', cor: 'text-gray-400', nome: 'COLAPSADO', corBg: 'bg-gray-900', corBorda: 'border-gray-700' };
  } else if (exaustao >= 80) {
    return { emoji: '💀', cor: 'text-red-600', nome: 'COLAPSO IMINENTE', corBg: 'bg-red-900/30', corBorda: 'border-red-700' };
  } else if (exaustao >= 60) {
    return { emoji: '🔴', cor: 'text-red-400', nome: 'EXAUSTO', corBg: 'bg-red-900/20', corBorda: 'border-red-600' };
  } else if (exaustao >= 40) {
    return { emoji: '🟠', cor: 'text-orange-400', nome: 'CANSADO', corBg: 'bg-orange-900/20', corBorda: 'border-orange-600' };
  } else if (exaustao >= 20) {
    return { emoji: '💛', cor: 'text-yellow-400', nome: 'ALERTA', corBg: 'bg-yellow-900/20', corBorda: 'border-yellow-600' };
  } else {
    return { emoji: '💚', cor: 'text-green-400', nome: 'DESCANSADO', corBg: 'bg-green-900/20', corBorda: 'border-green-600' };
  }
};

const BadgeExaustao = ({ exaustao }) => {
  const info = getInfoExaustao(exaustao || 0);
  
  return (
    <div className={`${info.corBg} px-2 py-1 rounded-lg border ${info.corBorda} flex items-center gap-2`}>
      <span className="text-xs">{info.emoji}</span>
      <div className="flex flex-col">
        <span className={`${info.cor} font-bold text-[10px]`}>
          {info.nome}
        </span>
      </div>
    </div>
  );
};

export default function AvatarCard({
  avatar,
  onClickDetalhes,
  onClickAtivar,
  ativando,
  getCorRaridade,
  getCorBorda,
  getCorElemento,
  getEmojiElemento
}) {
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
    <div
      className="relative group cursor-pointer"
      onClick={() => onClickDetalhes(avatar)}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
      
      <div className={`relative bg-slate-950/80 backdrop-blur-xl border ${getCorBorda(avatar.raridade)} rounded-lg overflow-hidden group-hover:border-cyan-500/50 transition-all ${!avatar.vivo ? 'opacity-50' : ''}`}>
        {/* Badge de raridade */}
        <div className={`p-2 text-center font-bold text-xs bg-gradient-to-r ${getCorRaridade(avatar.raridade)}`}>
          {avatar.raridade.toUpperCase()}
        </div>

        {/* Badge de morto */}
        {!avatar.vivo && (
          <div className="absolute top-12 right-2 bg-red-900 text-white text-xs font-bold px-2 py-1 rounded z-10">
            ☠️ MORTO
          </div>
        )}
        
        {/* Badge Marca da Morte */}
        {avatar.vivo && avatar.marca_morte && (
          <div className="absolute top-12 left-2 bg-red-900/90 text-white text-xs font-bold px-2 py-1 rounded z-10 border border-red-500/50 flex items-center gap-1">
            <span>💀</span>
          </div>
        )}

        <div className="p-4">
          {/* Visual do avatar */}
          <div className={`bg-slate-900/50 rounded p-1 aspect-square border ${getCorBorda(avatar.raridade)} flex items-center justify-center mb-3`}>
            <AvatarSVG avatar={avatar} tamanho={160} />
          </div>

          {/* Nome */}
          <h3 className="text-base font-bold text-cyan-400 mb-1 truncate">
            {avatar.nome}
          </h3>

          {/* Elemento */}
          <div className="mb-3">
            <span className={`text-xs font-mono ${getCorElemento(avatar.elemento)}`}>
              {getEmojiElemento(avatar.elemento)} {avatar.elemento}
            </span>
          </div>

          {/* Stats resumidos */}
          <div className="grid grid-cols-4 gap-1 mb-3">
            <div className="text-center">
              {temPenalidade ? (
                <div className="font-bold text-sm text-red-400">
                  <div className="text-[10px] text-slate-600 line-through">{statsBase.forca}</div>
                  <div>{statsAtuais.forca}</div>
                </div>
              ) : (
                <div className="font-bold text-sm text-red-400">{statsBase.forca}</div>
              )}
              <div className="text-[10px] text-slate-500">FOR</div>
            </div>
            <div className="text-center">
              {temPenalidade ? (
                <div className="font-bold text-sm text-green-400">
                  <div className="text-[10px] text-slate-600 line-through">{statsBase.agilidade}</div>
                  <div>{statsAtuais.agilidade}</div>
                </div>
              ) : (
                <div className="font-bold text-sm text-green-400">{statsBase.agilidade}</div>
              )}
              <div className="text-[10px] text-slate-500">AGI</div>
            </div>
            <div className="text-center">
              {temPenalidade ? (
                <div className="font-bold text-sm text-blue-400">
                  <div className="text-[10px] text-slate-600 line-through">{statsBase.resistencia}</div>
                  <div>{statsAtuais.resistencia}</div>
                </div>
              ) : (
                <div className="font-bold text-sm text-blue-400">{statsBase.resistencia}</div>
              )}
              <div className="text-[10px] text-slate-500">RES</div>
            </div>
            <div className="text-center">
              {temPenalidade ? (
                <div className="font-bold text-sm text-purple-400">
                  <div className="text-[10px] text-slate-600 line-through">{statsBase.foco}</div>
                  <div>{statsAtuais.foco}</div>
                </div>
              ) : (
                <div className="font-bold text-sm text-purple-400">{statsBase.foco}</div>
              )}
              <div className="text-[10px] text-slate-500">FOC</div>
            </div>
          </div>

          {/* Info adicional */}
          <div className="flex justify-between text-[10px] text-slate-500 mb-3">
            <span>Nv. {avatar.nivel}</span>
            <span>Vínculo: {avatar.vinculo}%</span>
          </div>

          {/* Badge de Exaustão */}
          <div className="mb-3 flex justify-center">
            <BadgeExaustao exaustao={avatar.exaustao} />
          </div>

          {/* Total de Stats */}
          <div className={`bg-slate-900/30 rounded p-2 mb-3 border ${temPenalidade ? 'border-red-500/30' : 'border-cyan-500/10'}`}>
            <div className="text-center">
              <div className="text-[9px] text-slate-500 uppercase">Poder Total</div>
              {temPenalidade ? (
                <div>
                  <div className="text-xs text-slate-600 line-through">
                    {statsBase.forca + statsBase.agilidade + statsBase.resistencia + statsBase.foco}
                  </div>
                  <div className="text-lg font-bold text-red-400">
                    {statsAtuais.forca + statsAtuais.agilidade + statsAtuais.resistencia + statsAtuais.foco}
                  </div>
                </div>
              ) : (
                <div className="text-lg font-bold text-cyan-400">
                  {statsBase.forca + statsBase.agilidade + statsBase.resistencia + statsBase.foco}
                </div>
              )}
            </div>
          </div>

          {/* Botão ativar */}
          {!avatar.ativo && avatar.vivo && (
            <>
              {/* Aviso se exausto */}
              {(avatar.exaustao || 0) >= 60 && (
                <div className="mb-2 bg-red-900/30 border border-red-500/50 rounded p-2">
                  <p className="text-[10px] text-red-400 text-center font-mono">
                    ⚠️ Avatar exausto! Considere descansar.
                  </p>
                </div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if ((avatar.exaustao || 0) >= 80) {
                    alert('Avatar está colapsado e não pode lutar! Deixe-o descansar.');
                    return;
                  }
                  onClickAtivar(avatar.id, avatar.nome);
                }}
                disabled={ativando || (avatar.exaustao || 0) >= 100}
                className={`w-full py-2 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  (avatar.exaustao || 0) >= 60 
                    ? 'bg-orange-600 hover:bg-orange-500' 
                    : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
              >
                {(avatar.exaustao || 0) >= 100 
                  ? '💀 Colapsado' 
                  : ativando 
                    ? 'Ativando...' 
                    : (avatar.exaustao || 0) >= 60
                      ? '⚠️ Ativar (Exausto)'
                      : 'Ativar'
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
