// ==================== SISTEMA DE LORE ====================
// Arquivo: /app/avatares/sistemas/loreSystem.js

import { ELEMENTOS } from './elementalSystem';

/**
 * Contexto do universo
 */
export const CONTEXTO_UNIVERSO = {
  nome: 'Fractured Veil',
  descricao: `Há mil anos, a Grande Ruptura estilhaçou a barreira entre dimensões. 
  Portais instáveis começaram a surgir por todo o mundo, despejando criaturas 
  aterradoras de realidades além da compreensão humana. A humanidade estava 
  à beira da extinção até que surgiu o Primeiro Caçador - um humano que 
  descobriu como vincular sua alma a uma entidade dimensional, criando o 
  primeiro Avatar. Desde então, a Organização de Caçadores Dimensionais 
  protege a humanidade, selando portais e combatendo as invasões.`,
  
  eventos_importantes: [
    {
      ano: -1000,
      nome: 'A Grande Ruptura',
      descricao: 'Experimento dimensional falha, rasgando a realidade'
    },
    {
      ano: -997,
      nome: 'O Primeiro Vínculo',
      descricao: 'Primeiro humano vincula-se a uma entidade dimensional'
    },
    {
      ano: -950,
      nome: 'Fundação da OCD',
      descricao: 'Organização de Caçadores Dimensionais é estabelecida'
    },
    {
      ano: -500,
      nome: 'Guerra dos Sete Portais',
      descricao: 'Sete portais gigantes abrem simultaneamente, quase destruindo o mundo'
    },
    {
      ano: 0,
      nome: 'Era Atual',
      descricao: 'Portais continuam surgindo, caçadores lutam diariamente'
    }
  ]
};

/**
 * Origens dos elementos - De onde vêm os Avatares
 */
export const ORIGENS_ELEMENTAIS = {
  [ELEMENTOS.FOGO]: {
    nome: 'Plano Ígneo',
    descricao: `Dimensão de chamas eternas e magma líquido. Um reino onde estrelas 
    nasceram e morreram milhões de vezes, deixando apenas calor primordial. 
    Avatares de Fogo vêm deste plano caótico, trazendo a destruição criativa 
    das chamas. São guerreiros natos, moldados pela violência constante de seu 
    mundo natal.`,
    caracteristicas: [
      'Temperamento explosivo e impulsivo',
      'Lealdade feroz quando conquistada',
      'Desprezo por fraqueza',
      'Respeito pela força bruta'
    ],
    aparencia_comum: 'Tons de vermelho, laranja e amarelo. Fumaça e brasas emanam do corpo.',
    citacao: '"Nascidos das cinzas de estrelas mortas, somos a chama que nunca se apaga."'
  },

  [ELEMENTOS.AGUA]: {
    nome: 'Abismo Oceânico',
    descricao: `Dimensão de águas infinitas e profundezas insondáveis. Um oceano 
    que existe desde antes do tempo, onde pressão e escuridão moldam seres de 
    paciência infinita. Avatares de Água trazem a sabedoria das profundezas e 
    a adaptabilidade das correntes. Podem ser calmos como lago ou ferozes como tsunami.`,
    caracteristicas: [
      'Pacientes e observadores',
      'Adaptam-se facilmente',
      'Emocionalmente profundos',
      'Guardam rancor por muito tempo'
    ],
    aparencia_comum: 'Azul, turquesa e branco. Corpo parece fluido, às vezes translúcido.',
    citacao: '"A água molda a pedra não pela força, mas pela persistência eterna."'
  },

  [ELEMENTOS.TERRA]: {
    nome: 'Núcleo Primordial',
    descricao: `Dimensão de rocha sólida e metal fundido. O coração de um planeta 
    morto há bilhões de anos, onde a gravidade e pressão criam formas impossíveis. 
    Avatares de Terra são inabaláveis, representando a estabilidade e a resistência 
    absolutas. Lentos para agir, impossíveis de mover uma vez decididos.`,
    caracteristicas: [
      'Extremamente leais e confiáveis',
      'Teimosos até o fim',
      'Protetores naturais',
      'Lentos para confiar'
    ],
    aparencia_comum: 'Marrom, cinza e verde musgo. Corpo rochoso, às vezes com cristais.',
    citacao: '"Montanhas caem, oceanos secam, mas a terra permanece."'
  },

  [ELEMENTOS.VENTO]: {
    nome: 'Éter Tempestuoso',
    descricao: `Dimensão de ventos eternos e tempestades sem fim. Um céu infinito 
    onde nada é sólido e tudo está em movimento constante. Avatares de Vento são 
    espíritos livres, impossíveis de prender ou prever. Valorizam liberdade acima 
    de tudo e desprezam correntes de qualquer tipo.`,
    caracteristicas: [
      'Voláteis e imprevisíveis',
      'Valorizam liberdade acima de tudo',
      'Curiosos e inquietos',
      'Leais enquanto não se sentem presos'
    ],
    aparencia_comum: 'Branco, cinza claro e azul céu. Corpo semi-etéreo, sempre em movimento.',
    citacao: '"Tente aprisionar o vento e ele escapará por entre seus dedos."'
  },

  [ELEMENTOS.ELETRICIDADE]: {
    nome: 'Nexo Voltaico',
    descricao: `Dimensão de energia pura e relâmpagos perpétuos. Onde pensamento 
    e eletricidade são a mesma coisa, onde consciências existem como arcos voltaicos. 
    Avatares de Eletricidade são mentes rápidas em corpos energéticos, capazes de 
    processar informações em velocidades sobre-humanas.`,
    caracteristicas: [
      'Pensamento extremamente rápido',
      'Impacientes com processos lentos',
      'Intensos em emoções e ações',
      'Fascinados por conhecimento'
    ],
    aparencia_comum: 'Amarelo, dourado e branco-azulado. Arcos elétricos percorrem o corpo.',
    citacao: '"Somos pensamento manifestado, consciência em sua forma mais pura."'
  },

  [ELEMENTOS.SOMBRA]: {
    nome: 'Vazio Entre Mundos',
    descricao: `Dimensão das trevas primordiais que existiam antes da luz. O espaço 
    vazio entre realidades, onde a ausência é presença. Avatares de Sombra vêm de 
    um lugar onde luz nunca existiu e nunca existirá. Não são malignos, mas são 
    fundamentalmente alienígenas à existência iluminada.`,
    caracteristicas: [
      'Enigmáticos e difíceis de entender',
      'Não compreendem conceitos de "luz" e "escuridão"',
      'Extremamente pragmáticos',
      'Temidos mas não necessariamente maus'
    ],
    aparencia_comum: 'Negro profundo, roxo escuro, violeta sombrio. Absorve luz ao redor.',
    citacao: '"Não somos a ausência de luz. Somos o que estava antes dela existir."'
  },

  [ELEMENTOS.LUZ]: {
    nome: 'Plano Radiante',
    descricao: `Dimensão de luz eterna e energia celestial. Onde a primeira luz do 
    universo ainda brilha, onde conceitos de esperança e ordem são forças físicas. 
    Avatares de Luz carregam a essência da criação, mas também sua arrogância - 
    acreditam que luz é superior a trevas por definição.`,
    caracteristicas: [
      'Idealistas e esperançosos',
      'Tendem a ver o mundo em preto e branco',
      'Arrogantes em relação a outros elementos',
      'Protetores compulsivos'
    ],
    aparencia_comum: 'Branco puro, dourado e prateado. Emite luz própria constantemente.',
    citacao: '"Onde há luz, há ordem. Onde há escuridão, trazemos a aurora."'
  }
};

/**
 * Nomes compostos por elemento e raridade
 */
export const PREFIXOS_NOME_DETALHADOS = {
  [ELEMENTOS.FOGO]: {
    Comum: ['Ember', 'Spark', 'Cinder', 'Ash', 'Scorch', 'Char'],
    Raro: ['Ignis', 'Pyro', 'Vulcan', 'Blaze', 'Inferno', 'Magma'],
    Lendário: ['Prometheus', 'Surtr', 'Hephaestus', 'Helios', 'Agni', 'Kagutsuchi']
  },
  [ELEMENTOS.AGUA]: {
    Comum: ['Drip', 'Mist', 'Tide', 'Brook', 'Rain', 'Dew'],
    Raro: ['Aqua', 'Hydro', 'Oceanus', 'Torrent', 'Cascade', 'Glacier'],
    Lendário: ['Poseidon', 'Leviathan', 'Tiamat', 'Ægir', 'Ryūjin', 'Sedna']
  },
  [ELEMENTOS.TERRA]: {
    Comum: ['Pebble', 'Clay', 'Dust', 'Sand', 'Mud', 'Stone'],
    Raro: ['Terra', 'Geo', 'Boulder', 'Titan', 'Granite', 'Bedrock'],
    Lendário: ['Atlas', 'Gaia', 'Cronus', 'Ymir', 'Nidhogg', 'Kū']
  },
  [ELEMENTOS.VENTO]: {
    Comum: ['Breeze', 'Gust', 'Wisp', 'Draft', 'Waft', 'Puff'],
    Raro: ['Aero', 'Zephyr', 'Gale', 'Storm', 'Tempest', 'Cyclone'],
    Lendário: ['Fujin', 'Boreas', 'Aeolus', 'Enlil', 'Stribog', 'Vayu']
  },
  [ELEMENTOS.ELETRICIDADE]: {
    Comum: ['Static', 'Pulse', 'Current', 'Charge', 'Jolt', 'Buzz'],
    Raro: ['Volt', 'Thunder', 'Spark', 'Bolt', 'Tesla', 'Ion'],
    Lendário: ['Zeus', 'Thor', 'Raijin', 'Indra', 'Perun', 'Ukko']
  },
  [ELEMENTOS.SOMBRA]: {
    Comum: ['Shade', 'Dusk', 'Murk', 'Gloom', 'Haze', 'Dim'],
    Raro: ['Umbra', 'Nox', 'Eclipse', 'Void', 'Phantom', 'Abyss'],
    Lendário: ['Erebus', 'Nyx', 'Tenebris', 'Moros', 'Kali', 'Apophis']
  },
  [ELEMENTOS.LUZ]: {
    Comum: ['Gleam', 'Shimmer', 'Glow', 'Ray', 'Beam', 'Flash'],
    Raro: ['Lux', 'Sol', 'Aurora', 'Radiant', 'Dawn', 'Celestial'],
    Lendário: ['Ra', 'Apollo', 'Amaterasu', 'Lucifer', 'Baldur', 'Inti']
  }
};

/**
 * Sufixos que dão personalidade ao nome
 */
export const SUFIXOS_NARRATIVOS = {
  guerreiro: [
    'o Inabalável', 'o Feroz', 'o Implacável', 'o Selvagem', 'o Couraçado',
    'o Vingador', 'o Sanguinário', 'o Brutal', 'o Invencível', 'o Conquistador',
    'o Gladiador', 'o Campeão', 'o Matador', 'o Veterano', 'o Lanceiro',
    'o Espadachim', 'o Berserker', 'o Domador', 'o Caçador', 'o Executor'
  ],
  sabio: [
    'o Ancião', 'o Sábio', 'o Vidente', 'o Profeta', 'o Iluminado',
    'o Oráculo', 'o Místico', 'o Erudito', 'o Letrado', 'o Conselheiro',
    'o Mestre', 'o Estudioso', 'o Conhecedor', 'o Observador', 'o Contemplativo',
    'o Filósofo', 'o Arcano', 'o Mago', 'o Mentor', 'o Sábio das Eras'
  ],
  protetor: [
    'o Guardião', 'o Sentinela', 'o Defensor', 'o Escudo', 'o Bastião',
    'o Vigilante', 'o Protetor', 'o Salvador', 'o Paladino', 'o Guarda',
    'o Muralha', 'o Custódio', 'o Vigia', 'o Zelador', 'o Campeão dos Fracos',
    'o Abençoado', 'o Mártir', 'o Inquebrantável', 'o Justo', 'o Honrado'
  ],
  destruidor: [
    'o Aniquilador', 'o Destruidor', 'o Devastador', 'o Calamidade', 'a Ruína',
    'o Apocalipse', 'o Carrasco', 'o Ceifador', 'o Flagelo', 'a Praga',
    'o Tirano', 'o Opressor', 'o Dizimador', 'o Exterminador', 'a Perdição',
    'o Desastre', 'o Cataclismo', 'a Catástrofe', 'o Algoz', 'o Verdugo'
  ],
  misterioso: [
    'o Enigma', 'o Desconhecido', 'o Velado', 'o Envolto', 'o Oculto',
    'o Sombrio', 'o Secreto', 'o Sussurro', 'o Silencioso', 'o Fantasma',
    'o Espectro', 'a Sombra', 'o Nebuloso', 'o Mascarado', 'o Cifrado',
    'o Indefinido', 'o Indecifrável', 'o Hermético', 'o Reclusivo', 'o Arcano'
  ],
  nobre: [
    'o Majestoso', 'o Real', 'o Nobre', 'o Soberano', 'o Exaltado',
    'o Augusto', 'o Venerável', 'o Ilustre', 'o Magnânimo', 'o Glorioso',
    'o Radiante', 'o Sublime', 'o Imperial', 'o Monarca', 'o Senhor',
    'o Dignitário', 'o Eminente', 'o Admirável', 'o Reverenciado', 'o Príncipe'
  ],
  caido: [
    'o Caído', 'o Quebrado', 'o Despedaçado', 'o Abandonado', 'o Exilado',
    'o Banido', 'o Rejeitado', 'o Amaldiçoado', 'o Perdido', 'o Esquecido',
    'o Condenado', 'o Proscrito', 'o Renegado', 'o Marginalizado', 'o Decaído',
    'o Arruinado', 'o Desgraçado', 'o Derrotado', 'o Desonrado', 'o Traído'
  ],
  ascendente: [
    'o Ascendente', 'o Emergente', 'o Desperto', 'o Renascido', 'o Ressurgido',
    'o Transcendente', 'o Elevado', 'o Evoluído', 'o Transformado', 'o Metamórfico',
    'o Iluminado', 'o Libertado', 'o Renovado', 'o Revivido', 'o Redimido',
    'o Ressuscitado', 'o Revitalizado', 'o Imortal', 'o Eterno', 'o Infinito'
  ],
  lendario: [
    'o Lendário', 'o Mítico', 'o Primordial', 'o Ancestral', 'o Primevo',
    'o Atemporal', 'o Sempiterno', 'o Imorredouro', 'o Inalterável', 'o Perene',
    'o Imemorial', 'o Secular', 'o Milenar', 'o Antediluviano', 'o Arcaico'
  ],
  temivel: [
    'o Temível', 'o Terrível', 'o Aterrorizante', 'o Horrendo', 'o Pavoroso',
    'o Medonho', 'o Sinistro', 'o Macabro', 'o Sombrio', 'o Lúgubre',
    'o Tenebroso', 'o Funesto', 'o Nefasto', 'o Cruel', 'o Impiedoso'
  ],
  veloz: [
    'o Veloz', 'o Rápido', 'o Ágil', 'o Fugaz', 'o Célere',
    'o Súbito', 'o Raio', 'o Relâmpago', 'o Vento', 'a Tempestade',
    'o Meteoro', 'o Cometa', 'o Instantâneo', 'o Frenético', 'o Vertiginoso'
  ],
  pacifico: [
    'o Pacífico', 'o Sereno', 'o Tranquilo', 'o Calmo', 'o Plácido',
    'o Contemplativo', 'o Meditativo', 'o Equilibrado', 'o Harmonioso', 'o Zen',
    'o Apaziguador', 'o Pacificador', 'o Diplomata', 'o Mediador', 'o Conciliador'
  ],
  caotic: [
    'o Caótico', 'o Imprevisível', 'o Volátil', 'o Instável', 'o Errático',
    'o Demente', 'o Insano', 'o Desvairado', 'o Frenético', 'o Delirante',
    'o Turbulento', 'o Tumultuoso', 'o Tempestuoso', 'o Frenético', 'o Agitado'
  ]
};

/**
 * Templates de descrição por raridade e elemento
 */
export const TEMPLATES_DESCRICAO = {
  Comum: {
    [ELEMENTOS.FOGO]: [
      'Uma centelha que escapou de um incêndio dimensional. Jovem, impulsivo, mas com potencial ardente.',
      'Nascido das brasas de uma batalha esquecida. Ainda não conhece a extensão de suas chamas.',
      'Um fragmento de calor primordial. Sua fúria ainda não foi totalmente despertada.'
    ],
    [ELEMENTOS.AGUA]: [
      'Uma gota que se desprendeu do oceano infinito. Pequena, mas parte de algo maior.',
      'Um espírito aquático jovem, ainda aprendendo a controlar as marés dentro de si.',
      'Nascido de uma fonte dimensional. Suas águas ainda não conheceram tempestade.'
    ],
    [ELEMENTOS.TERRA]: [
      'Um pedaço de rocha que ganhou consciência. Resistente, mas ainda não inabalável.',
      'Formado de argila primordial. Cada batalha o solidifica mais.',
      'Um pequeno titã de pedra. Um dia pode se tornar uma montanha.'
    ],
    [ELEMENTOS.VENTO]: [
      'Uma brisa que ganhou forma. Rápida e livre, mas ainda não uma tempestade.',
      'Nascido de correntes de ar dimensionais. Sua velocidade ainda está crescendo.',
      'Um suspiro do éter tornando-se real. Ainda não aprendeu a rugir.'
    ],
    [ELEMENTOS.ELETRICIDADE]: [
      'Uma faísca de consciência elétrica. Rápido de pensar, mas ainda inexperiente.',
      'Nascido de um relâmpago perdido. Sua voltagem ainda está aumentando.',
      'Uma corrente de energia em desenvolvimento. Um dia pode se tornar um trovão.'
    ],
    [ELEMENTOS.SOMBRA]: [
      'Uma sombra que se separou de seu dono. Fraca ainda, mas crescendo em escuridão.',
      'Nascido da penumbra entre mundos. Ainda não mergulhou completamente no vazio.',
      'Um fragmento de escuridão primordial. Sua ausência de luz ainda é tímida.'
    ],
    [ELEMENTOS.LUZ]: [
      'Um raio de luz que atravessou dimensões. Brilhante, mas ainda não ofuscante.',
      'Nascido do amanhecer de outro mundo. Sua luminosidade ainda está crescendo.',
      'Uma centelha de esperança dimensional. Um dia pode iluminar o mundo.'
    ]
  },

  Raro: {
    [ELEMENTOS.FOGO]: [
      'Forjado no coração de um vulcão dimensional. Suas chamas já consumiram mundos menores.',
      'Um veterano das guerras ígneas. Cada cicatriz é uma história de destruição.',
      'Nasceu da colisão de duas estrelas. Sua temperatura derrete a realidade ao redor.'
    ],
    [ELEMENTOS.AGUA]: [
      'Surgiu das profundezas do Abismo Oceânico. Testemunhou éons sob pressão impossível.',
      'Um tsunami personificado. Sua fúria pode afogar continentes.',
      'Condensado de mil tempestades. Calmo na superfície, caótico nas profundezas.'
    ],
    [ELEMENTOS.TERRA]: [
      'Talhado das montanhas mais antigas da existência. Cada camada conta bilhões de anos.',
      'Um titã que viu planetas nascerem e morrerem. Sua resistência é lendária.',
      'Feito do núcleo de um mundo morto. Inabalável e eterno.'
    ],
    [ELEMENTOS.VENTO]: [
      'Nascido do olho de um furacão dimensional. Seu sussurro é um vendaval.',
      'Uma tempestade que ganhou consciência própria. Impossível de prever ou conter.',
      'Forjado pelos ventos que sopram entre dimensões. Mais rápido que o pensamento.'
    ],
    [ELEMENTOS.ELETRICIDADE]: [
      'Materializado de uma tempestade elétrica perpétua. Seus pensamentos são relâmpagos.',
      'Um trovão que aprendeu a pensar. Sua voltagem pode desintegrar matéria.',
      'Nascido quando mil raios colidiram em um único ponto. Energia pura consciente.'
    ],
    [ELEMENTOS.SOMBRA]: [
      'Emergiu do vazio entre estrelas. Sua escuridão é mais antiga que a luz.',
      'Um pedaço do nada que ganhou forma. Sua presença drena vida.',
      'Condensado das sombras de um mundo extinto. Silencioso e letal.'
    ],
    [ELEMENTOS.LUZ]: [
      'Fragmento da primeira luz do universo. Sua radiância purifica e destrói.',
      'Nascido da explosão de uma supernova. Luz tão intensa que cega a própria escuridão.',
      'Um farol dimensional. Onde vai, a esperança segue - ou a cegueira total.'
    ]
  },

  Lendário: {
    [ELEMENTOS.FOGO]: [
      'Dizem que este ser existia antes do próprio fogo. Ele não controla as chamas - ele É a chama primordial. Mundos arderam em seu despertar.',
      'O último sobrevivente do Plano Ígneo original, antes de sua destruição. Carrega o calor da morte de um bilhão de sóis em seu âmago.',
      'Entidade que testemunhou o nascimento do primeiro fogo no universo. Seu mero olhar pode incinerar almas.'
    ],
    [ELEMENTOS.AGUA]: [
      'O oceano personificado. Não é apenas feito de água - é a própria essência da água através de todas as dimensões.',
      'Antiga divindade das profundezas que dormiu por éons. Seu despertar trouxe marés que afogaram reinos inteiros.',
      'Nascido da primeira chuva que caiu em mil dimensões simultaneamente. Sua pressão pode esmagar diamantes.'
    ],
    [ELEMENTOS.TERRA]: [
      'Este titã carregou mundos em seus ombros. Quando se move, planetas tremem em dimensões distantes.',
      'A primeira montanha que ganhou consciência. Inabalável não é força suficiente para descrevê-lo - é inevitabilidade.',
      'Forjado do núcleo de dez mundos mortos fundidos. Sua existência define o que é solidez absoluta.'
    ],
    [ELEMENTOS.VENTO]: [
      'O primeiro sopro de vida do universo, antes de planetas ou estrelas. Deu movimento ao cosmos estático.',
      'Tempestade primordial que nunca parou de soprar. Atravessou mil dimensões e nunca encontrou obstáculo.',
      'Senhor dos ventos cósmicos. Um suspiro seu pode criar furacões, um grito pode rasgar realidades.'
    ],
    [ELEMENTOS.ELETRICIDADE]: [
      'O pensamento puro do primeiro ser consciente, cristalizado em eletricidade. Pensar perto dele é perigoso.',
      'Nascido quando todas as cargas do universo se equilibraram por um nanosegundo. Energia infinita em forma finita.',
      'O trovão que anunciou a criação. Sua voz ainda ecoa através de dimensões, destruindo o que encontra.'
    ],
    [ELEMENTOS.SOMBRA]: [
      'Não é a sombra de algo - é a Sombra primordial, anterior à existência de luz. Onde passa, conceitos morrem.',
      'O vazio que existia antes da criação, e que existirá depois do fim. Olhar para ele é esquecer cor.',
      'Dizem que este ser foi banido pelos próprios deuses por ser conceitualment impossível de existir. Ele existe mesmo assim.'
    ],
    [ELEMENTOS.LUZ]: [
      'O primeiro raio de luz na escuridão primordial. Sua luminosidade definiu o que é "visão" no universo.',
      'Anjo caído que manteve sua luz - ou demônio ascendente que roubou o fogo celestial. Ninguém sabe ao certo.',
      'Fragmento vivo de uma estrela divina. Sua presença é salvação para alguns, aniquilação para outros.'
    ]
  }
};

/**
 * Gera nome completo com título baseado em raridade
 * @param {string} elemento - Elemento do avatar
 * @param {string} raridade - Raridade do avatar
 * @returns {string} Nome completo
 */
export function gerarNomeCompleto(elemento, raridade) {
  const prefixos = PREFIXOS_NOME_DETALHADOS[elemento][raridade];
  const prefixo = prefixos[Math.floor(Math.random() * prefixos.length)];
  
  // Sufixos variam por raridade
  let sufixoPool;
  if (raridade === 'Comum') {
    sufixoPool = [...SUFIXOS_NARRATIVOS.guerreiro, ...SUFIXOS_NARRATIVOS.protetor];
  } else if (raridade === 'Raro') {
    sufixoPool = [...SUFIXOS_NARRATIVOS.sabio, ...SUFIXOS_NARRATIVOS.destruidor, ...SUFIXOS_NARRATIVOS.misterioso];
  } else {
    sufixoPool = [...SUFIXOS_NARRATIVOS.nobre, ...SUFIXOS_NARRATIVOS.ascendente, ...SUFIXOS_NARRATIVOS.caido];
  }
  
  const sufixo = sufixoPool[Math.floor(Math.random() * sufixoPool.length)];
  
  return `${prefixo}, ${sufixo}`;
}

/**
 * Gera descrição narrativa do avatar
 * @param {string} elemento - Elemento do avatar
 * @param {string} raridade - Raridade do avatar
 * @returns {string} Descrição
 */
export function gerarDescricaoNarrativa(elemento, raridade) {
  const templates = TEMPLATES_DESCRICAO[raridade][elemento];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Gera história de background do avatar
 * @param {Object} avatar - Avatar completo
 * @returns {string} História detalhada
 */
export function gerarHistoriaBackground(avatar) {
  const origem = ORIGENS_ELEMENTAIS[avatar.elemento];
  
  let historia = `=== ARQUIVO CONFIDENCIAL - OCD ===\n\n`;
  historia += `ENTIDADE: ${avatar.nome}\n`;
  historia += `ELEMENTO: ${avatar.elemento}\n`;
  historia += `CLASSIFICAÇÃO: ${avatar.raridade}\n\n`;
  historia += `ORIGEM DIMENSIONAL:\n${origem.descricao}\n\n`;
  historia += `DESCRIÇÃO:\n${avatar.descricao}\n\n`;
  historia += `PERFIL PSICOLÓGICO:\n`;
  origem.caracteristicas.forEach(car => {
    historia += `- ${car}\n`;
  });
  historia += `\nAPARÊNCIA:\n${origem.aparencia_comum}\n\n`;
  historia += `CITAÇÃO REGISTRADA:\n${origem.citacao}\n\n`;
  
  if (avatar.raridade === 'Lendário') {
    historia += `⚠️ AVISO CRÍTICO: Entidade de classe Lendária. Nível de ameaça máximo se vínculo for rompido.\n`;
  }
  
  historia += `\n=== FIM DO ARQUIVO ===`;
  
  return historia;
}

/**
 * Gera evento aleatório baseado no vínculo
 * @param {number} vinculo - Nível de vínculo atual
 * @param {string} elemento - Elemento do avatar
 * @returns {Object} Evento narrativo
 */
export function gerarEventoNarrativo(vinculo, elemento) {
  const eventos = {
    baixo: [ // 0-39
      {
        texto: `Seu avatar te observa com desconfiança. Vocês ainda são estranhos.`,
        tipo: 'neutro'
      },
      {
        texto: `Durante o treino, seu avatar parece relutante em obedecer seus comandos.`,
        tipo: 'negativo'
      }
    ],
    medio: [ // 40-79
      {
        texto: `Seu avatar começa a entender seus comandos sem que você precise falar.`,
        tipo: 'positivo'
      },
      {
        texto: `Pela primeira vez, vocês executam uma combinação de ataque perfeitamente sincronizada.`,
        tipo: 'positivo'
      }
    ],
    alto: [ // 80-100
      {
        texto: `Seu avatar arriscou a própria existência para te proteger. O vínculo entre vocês transcende palavras.`,
        tipo: 'positivo'
      },
      {
        texto: `Vocês lutam como se fossem um único ser. Observadores não conseguem dizer onde você termina e seu avatar começa.`,
        tipo: 'positivo'
      }
    ]
  };
  
  let pool;
  if (vinculo < 40) pool = eventos.baixo;
  else if (vinculo < 80) pool = eventos.medio;
  else pool = eventos.alto;
  
  return pool[Math.floor(Math.random() * pool.length)];
}

// Exportação default
export default {
  CONTEXTO_UNIVERSO,
  ORIGENS_ELEMENTAIS,
  PREFIXOS_NOME_DETALHADOS,
  SUFIXOS_NARRATIVOS,
  TEMPLATES_DESCRICAO,
  gerarNomeCompleto,
  gerarDescricaoNarrativa,
  gerarHistoriaBackground,
  gerarEventoNarrativo
};
