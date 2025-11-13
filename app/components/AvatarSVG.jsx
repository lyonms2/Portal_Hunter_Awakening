"use client";

import { useEffect, useState, useMemo } from 'react';

export default function AvatarSVG({ avatar, tamanho = 200, className = "", isEnemy = false }) {
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(true);

  // Configurações completas por elemento
  const elementosConfig = {
    'Fogo': {
      cores: ['#dc2626', '#ef4444', '#f97316', '#fb923c'],
      coresSecundarias: ['#7c2d12', '#991b1b', '#9a3412'],
      corBrilho: '#fbbf24',
      corOlho: '#ff6b00',
      particulas: 'chamas'
    },
    'Água': {
      cores: ['#0891b2', '#06b6d4', '#3b82f6', '#0284c7'],
      coresSecundarias: ['#075985', '#0c4a6e', '#1e40af'],
      corBrilho: '#67e8f9',
      corOlho: '#0ea5e9',
      particulas: 'gotas'
    },
    'Terra': {
      cores: ['#78350f', '#92400e', '#a16207', '#854d0e'],
      coresSecundarias: ['#451a03', '#57534e', '#78716c'],
      corBrilho: '#d97706',
      corOlho: '#fbbf24',
      particulas: 'pedras'
    },
    'Vento': {
      cores: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8'],
      coresSecundarias: ['#0c4a6e', '#075985', '#0369a1'],
      corBrilho: '#f0fdfa',
      corOlho: '#22d3ee',
      particulas: 'espirais'
    },
    'Eletricidade': {
      cores: ['#eab308', '#facc15', '#fde047', '#fef08a'],
      coresSecundarias: ['#713f12', '#854d0e', '#a16207'],
      corBrilho: '#fef9c3',
      corOlho: '#fde047',
      particulas: 'raios'
    },
    'Sombra': {
      cores: ['#581c87', '#6b21a8', '#7c3aed', '#8b5cf6'],
      coresSecundarias: ['#1e1b4b', '#312e81', '#3730a3'],
      corBrilho: '#c4b5fd',
      corOlho: '#a78bfa',
      particulas: 'sombras'
    },
    'Luz': {
      cores: ['#fbbf24', '#fde047', '#fef08a', '#fefce8'],
      coresSecundarias: ['#f59e0b', '#d97706', '#b45309'],
      corBrilho: '#ffffff',
      corOlho: '#fef3c7',
      particulas: 'estrelas'
    }
  };

  // Gerar seed único e consistente baseado no avatar
  // A imagem só muda quando o avatar é ressuscitado (marca_morte muda de false para true)
  const seed = useMemo(() => {
    if (!avatar) return 0;
    const marcaMorte = avatar.marca_morte ? '1' : '0';
    const str = avatar.id + avatar.elemento + avatar.raridade + marcaMorte;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }, [avatar]);

  // Random determinístico com seed
  const createSeededRandom = (initialSeed) => {
    let currentSeed = initialSeed;
    return (min, max) => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const rnd = currentSeed / 233280;
      return Math.floor(rnd * (max - min + 1)) + min;
    };
  };

  useEffect(() => {
    if (!avatar) return;

    const gerarSVG = () => {
      const random = createSeededRandom(seed);
      const escolher = (array) => array[random(0, array.length - 1)];

      const config = elementosConfig[avatar.elemento];

      // Aplicar cores mais escuras para inimigos
      const ajustarCorParaInimigo = (cor) => {
        if (!isEnemy) return cor;
        // Escurecer a cor (reduzir brilho em ~50%)
        const hex = cor.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * 0.5);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * 0.5);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * 0.5);
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
      };

      const cor1 = ajustarCorParaInimigo(escolher(config.cores));
      const cor2 = ajustarCorParaInimigo(escolher(config.cores));
      const corSec = ajustarCorParaInimigo(escolher(config.coresSecundarias));
      const corBrilho = isEnemy ? '#8b0000' : config.corBrilho; // Vermelho escuro para inimigos
      const corOlho = isEnemy ? '#ff0000' : config.corOlho; // Olhos vermelhos para inimigos
      
      // Características baseadas em raridade
      const mult = avatar.raridade === 'Lendário' ? 2 : avatar.raridade === 'Raro' ? 1.5 : 1;
      
      const tipoCorpo = random(1, avatar.raridade === 'Lendário' ? 8 : avatar.raridade === 'Raro' ? 6 : 5);
      const numOlhos = random(avatar.raridade === 'Comum' ? 1 : 2, 3);
      const tipoOlho = random(1, 8);
      const numBracos = random(2, Math.floor(4 * mult));
      const numChifres = random(0, 4);
      const temCauda = avatar.raridade === 'Comum' ? random(0, 1) > 0 : random(0, 2) > 0;
      const tipoCauda = random(1, avatar.raridade === 'Lendário' ? 4 : 3);
      const temAsas = avatar.raridade === 'Lendário' ? random(0, 2) > 0 : avatar.raridade === 'Raro' ? random(0, 4) > 2 : false;
      const tipoAsas = random(1, 3);
      const temTentaculos = avatar.raridade !== 'Comum' && random(0, 9) > 6;
      const numEspinhos = avatar.raridade === 'Lendário' ? random(0, 4) : avatar.raridade === 'Raro' ? random(0, 2) : 0;
      const bocaTipo = random(1, 8);
      
      let svgContent = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow${seed}">
            <feGaussianBlur stdDeviation="${avatar.raridade === 'Lendário' ? '6' : '4'}" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="innerGlow${seed}">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          ${isEnemy ? `
          <filter id="enemy${seed}">
            <feColorMatrix type="matrix" values="
              0.7 0 0 0 0.1
              0 0.3 0 0 0
              0 0 0.3 0 0
              0 0 0 1 0" />
            <feGaussianBlur stdDeviation="1" />
          </filter>` : ''}
          <radialGradient id="grad${seed}">
            <stop offset="0%" style="stop-color:${cor1};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${cor2};stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:${corSec};stop-opacity:0.8" />
          </radialGradient>
          <linearGradient id="linearGrad${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${cor1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${cor2};stop-opacity:1" />
          </linearGradient>
          ${isEnemy ? `
          <filter id="enemy${seed}">
            <feColorMatrix type="matrix" values="
              0.7 0 0 0 0.1
              0 0.3 0 0 0
              0 0 0.3 0 0
              0 0 0 1 0" />
          </filter>` : ''}
        </defs>
        ${isEnemy ? `<rect width="200" height="200" fill="none" stroke="#8b0000" stroke-width="4" opacity="0.5"/>` : ''}
        <g${isEnemy ? ` filter="url(#enemy${seed})"` : ''}>`;

      // Aura para lendários
      if (avatar.raridade === 'Lendário') {
        svgContent += `<circle cx="100" cy="100" r="95" fill="none" stroke="${corBrilho}" stroke-width="4" opacity="0.6" filter="url(#glow${seed})">
          <animate attributeName="r" values="90;100;90" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="100" cy="100" r="85" fill="none" stroke="${cor1}" stroke-width="3" opacity="0.5" filter="url(#glow${seed})">
          <animate attributeName="r" values="80;90;80" dur="3s" repeatCount="indefinite"/>
        </circle>`;
      } else if (avatar.raridade === 'Raro') {
        svgContent += `<circle cx="100" cy="100" r="88" fill="none" stroke="${corBrilho}" stroke-width="2" opacity="0.2" filter="url(#glow${seed})">
          <animate attributeName="r" values="85;90;85" dur="2.5s" repeatCount="indefinite"/>
        </circle>`;
      }

      // Cauda (4 tipos)
      if (temCauda) {
        const caudaY = 140;
        switch(tipoCauda) {
          case 1: // Ondulada
            svgContent += `<path d="M 100 ${caudaY} Q 80 ${caudaY + 20} 70 ${caudaY + 40} Q 65 ${caudaY + 50} 75 ${caudaY + 55}" 
                    stroke="${cor2}" stroke-width="10" fill="none" opacity="0.8" stroke-linecap="round">
                    <animate attributeName="d" 
                             values="M 100 ${caudaY} Q 80 ${caudaY + 20} 70 ${caudaY + 40} Q 65 ${caudaY + 50} 75 ${caudaY + 55};
                                     M 100 ${caudaY} Q 85 ${caudaY + 20} 72 ${caudaY + 40} Q 68 ${caudaY + 50} 78 ${caudaY + 55};
                                     M 100 ${caudaY} Q 80 ${caudaY + 20} 70 ${caudaY + 40} Q 65 ${caudaY + 50} 75 ${caudaY + 55}" 
                             dur="2s" repeatCount="indefinite"/>
                    </path>`;
            break;
          case 2: // Com espinho
            svgContent += `<path d="M 100 ${caudaY} L 85 ${caudaY + 30} L 95 ${caudaY + 35} L 80 ${caudaY + 60}" 
                    stroke="${cor2}" stroke-width="8" fill="none" opacity="0.8" stroke-linecap="round"/>
                    <polygon points="75,${caudaY + 60} 80,${caudaY + 70} 85,${caudaY + 60}" fill="${corBrilho}" filter="url(#glow${seed})">
                    <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite"/>
                    </polygon>`;
            break;
          case 3: // Grossa
            svgContent += `<path d="M 100 ${caudaY} Q 90 ${caudaY + 15} 85 ${caudaY + 30} Q 82 ${caudaY + 40} 88 ${caudaY + 48}" 
                    stroke="${cor1}" stroke-width="14" fill="none" opacity="0.9" stroke-linecap="round"/>
                    <path d="M 100 ${caudaY} Q 90 ${caudaY + 15} 85 ${caudaY + 30} Q 82 ${caudaY + 40} 88 ${caudaY + 48}" 
                    stroke="${cor2}" stroke-width="8" fill="none" opacity="0.7" stroke-linecap="round">
                    <animate attributeName="stroke-width" values="8;10;8" dur="1.5s" repeatCount="indefinite"/>
                    </path>`;
            break;
          case 4: // Dupla (lendário)
            svgContent += `<path d="M 100 ${caudaY} Q 75 ${caudaY + 20} 65 ${caudaY + 45}" 
                    stroke="${cor2}" stroke-width="8" fill="none" opacity="0.8" stroke-linecap="round">
                    <animate attributeName="d" 
                             values="M 100 ${caudaY} Q 75 ${caudaY + 20} 65 ${caudaY + 45};
                                     M 100 ${caudaY} Q 72 ${caudaY + 22} 62 ${caudaY + 47};
                                     M 100 ${caudaY} Q 75 ${caudaY + 20} 65 ${caudaY + 45}" 
                             dur="2s" repeatCount="indefinite"/>
                    </path>
                    <path d="M 100 ${caudaY} Q 125 ${caudaY + 20} 135 ${caudaY + 45}" 
                    stroke="${cor2}" stroke-width="8" fill="none" opacity="0.8" stroke-linecap="round">
                    <animate attributeName="d" 
                             values="M 100 ${caudaY} Q 125 ${caudaY + 20} 135 ${caudaY + 45};
                                     M 100 ${caudaY} Q 128 ${caudaY + 22} 138 ${caudaY + 47};
                                     M 100 ${caudaY} Q 125 ${caudaY + 20} 135 ${caudaY + 45}" 
                             dur="2s" repeatCount="indefinite"/>
                    </path>`;
            break;
        }
      }

      // Asas (3 tipos)
      if (temAsas) {
        switch(tipoAsas) {
          case 1: // Arredondadas
            svgContent += `<ellipse cx="60" cy="90" rx="28" ry="40" fill="url(#linearGrad${seed})" opacity="0.6" transform="rotate(-25 60 90)" stroke="${corBrilho}" stroke-width="2">
                    <animateTransform attributeName="transform" type="rotate" values="-25 60 90;-30 60 90;-25 60 90" dur="2s" repeatCount="indefinite"/>
                    </ellipse>
                    <ellipse cx="140" cy="90" rx="28" ry="40" fill="url(#linearGrad${seed})" opacity="0.6" transform="rotate(25 140 90)" stroke="${corBrilho}" stroke-width="2">
                    <animateTransform attributeName="transform" type="rotate" values="25 140 90;30 140 90;25 140 90" dur="2s" repeatCount="indefinite"/>
                    </ellipse>`;
            break;
          case 2: // Pontiagudas
            svgContent += `<path d="M 70 95 Q 45 85 40 65 Q 50 70 70 80 Z" fill="${cor1}" opacity="0.7" stroke="${cor2}" stroke-width="2">
                    <animate attributeName="d" 
                             values="M 70 95 Q 45 85 40 65 Q 50 70 70 80 Z;
                                     M 70 95 Q 42 83 38 62 Q 48 68 70 78 Z;
                                     M 70 95 Q 45 85 40 65 Q 50 70 70 80 Z" 
                             dur="2s" repeatCount="indefinite"/>
                    </path>
                    <path d="M 130 95 Q 155 85 160 65 Q 150 70 130 80 Z" fill="${cor1}" opacity="0.7" stroke="${cor2}" stroke-width="2">
                    <animate attributeName="d" 
                             values="M 130 95 Q 155 85 160 65 Q 150 70 130 80 Z;
                                     M 130 95 Q 158 83 162 62 Q 152 68 130 78 Z;
                                     M 130 95 Q 155 85 160 65 Q 150 70 130 80 Z" 
                             dur="2s" repeatCount="indefinite"/>
                    </path>`;
            break;
          case 3: // Morcego
            svgContent += `<path d="M 70 90 Q 45 70 35 60 L 40 75 L 50 70 L 55 85 Z" fill="${corSec}" opacity="0.8" stroke="${cor1}" stroke-width="2">
                    <animate attributeName="opacity" values="0.8;0.6;0.8" dur="2s" repeatCount="indefinite"/>
                    </path>
                    <path d="M 130 90 Q 155 70 165 60 L 160 75 L 150 70 L 145 85 Z" fill="${corSec}" opacity="0.8" stroke="${cor1}" stroke-width="2">
                    <animate attributeName="opacity" values="0.8;0.6;0.8" dur="2s" repeatCount="indefinite"/>
                    </path>`;
            break;
        }
      }

      // Tentáculos
      if (temTentaculos) {
        const numTentaculos = random(2, 4);
        for (let i = 0; i < numTentaculos; i++) {
          const angulo = (Math.PI * 2 * i) / numTentaculos;
          const startX = 100 + Math.cos(angulo) * 35;
          const startY = 100 + Math.sin(angulo) * 35;
          const midX = 100 + Math.cos(angulo) * 60;
          const midY = 100 + Math.sin(angulo) * 60;
          const endX = 100 + Math.cos(angulo) * 80;
          const endY = 100 + Math.sin(angulo) * 80;
          
          svgContent += `<path d="M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}" 
                  stroke="${corSec}" stroke-width="6" fill="none" opacity="0.7" stroke-linecap="round">
                  <animate attributeName="d" 
                           values="M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY};
                                   M ${startX} ${startY} Q ${midX + 5} ${midY - 5} ${endX} ${endY};
                                   M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}" 
                           dur="2s" repeatCount="indefinite"/>
                  </path>`;
        }
      }

      // Braços/Garras
      for (let i = 0; i < numBracos; i++) {
        const lado = i % 2 === 0 ? -1 : 1;
        const offset = Math.floor(i / 2) * 15;
        const startX = 100 + (lado * 35);
        const startY = 95 + offset;
        const midX = 100 + (lado * 50);
        const midY = 100 + offset + random(5, 15);
        const endX = 100 + (lado * 65);
        const endY = 100 + offset + random(20, 35);
        
        svgContent += `<path d="M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}" 
                stroke="${cor2}" stroke-width="${avatar.raridade === 'Lendário' ? '8' : '6'}" fill="none" opacity="0.7" stroke-linecap="round">
                <animate attributeName="d" 
                         values="M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY};
                                 M ${startX} ${startY} Q ${midX} ${midY + 3} ${endX} ${endY + 2};
                                 M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}" 
                         dur="3s" repeatCount="indefinite"/>
                </path>`;
        
        // Garras
        if (avatar.raridade !== 'Comum') {
          svgContent += `<line x1="${endX}" y1="${endY}" x2="${endX + lado * 8}" y2="${endY + 6}" 
                  stroke="${corBrilho}" stroke-width="3" opacity="0.8" stroke-linecap="round">
                  <animate attributeName="opacity" values="0.8;0.5;0.8" dur="2s" repeatCount="indefinite"/>
                  </line>`;
        }
      }

      // Corpo (8 tipos)
      switch(tipoCorpo) {
        case 1: // Circular
          svgContent += `<circle cx="100" cy="100" r="45" fill="url(#grad${seed})" opacity="0.95" stroke="${corSec}" stroke-width="2">
                  <animate attributeName="r" values="45;46;45" dur="3s" repeatCount="indefinite"/>
                  </circle>`;
          break;
        case 2: // Oval vertical
          svgContent += `<ellipse cx="100" cy="100" rx="35" ry="50" fill="url(#grad${seed})" opacity="0.95" stroke="${corSec}" stroke-width="2">
                  <animate attributeName="ry" values="50;52;50" dur="3s" repeatCount="indefinite"/>
                  </ellipse>`;
          break;
        case 3: // Oval horizontal
          svgContent += `<ellipse cx="100" cy="100" rx="50" ry="38" fill="url(#grad${seed})" opacity="0.95" stroke="${corSec}" stroke-width="2">
                  <animate attributeName="rx" values="50;52;50" dur="3s" repeatCount="indefinite"/>
                  </ellipse>`;
          break;
        case 4: // Blob
          svgContent += `<path d="M 100 55 Q 145 65 148 100 Q 145 135 100 148 Q 55 135 52 100 Q 55 65 100 55 Z" 
                  fill="url(#grad${seed})" opacity="0.95" stroke="${corSec}" stroke-width="2"/>`;
          break;
        case 5: // Triangular
          svgContent += `<polygon points="100,58 145,132 55,132" fill="url(#grad${seed})" opacity="0.95" stroke="${corSec}" stroke-width="2"/>`;
          break;
        case 6: // Hexagonal
          svgContent += `<polygon points="100,60 130,80 130,120 100,140 70,120 70,80" fill="url(#grad${seed})" opacity="0.95" stroke="${corSec}" stroke-width="2">
                  <animateTransform attributeName="transform" type="rotate" values="0 100 100;5 100 100;0 100 100;-5 100 100;0 100 100" dur="6s" repeatCount="indefinite"/>
                  </polygon>`;
          break;
        case 7: // Estrela
          svgContent += `<path d="M 100 60 L 110 90 L 140 95 L 115 115 L 120 145 L 100 130 L 80 145 L 85 115 L 60 95 L 90 90 Z" 
                  fill="url(#grad${seed})" opacity="0.95" stroke="${corSec}" stroke-width="2">
                  <animateTransform attributeName="transform" type="rotate" values="0 100 100;10 100 100;0 100 100" dur="4s" repeatCount="indefinite"/>
                  </path>`;
          break;
        case 8: // Cristalino
          svgContent += `<polygon points="100,55 125,75 135,100 125,125 100,145 75,125 65,100 75,75" 
                  fill="url(#grad${seed})" opacity="0.95" stroke="${corBrilho}" stroke-width="3" filter="url(#glow${seed})">
                  <animate attributeName="opacity" values="0.95;1;0.95" dur="2s" repeatCount="indefinite"/>
                  </polygon>`;
          break;
      }

      // Espinhos
      for (let i = 0; i < numEspinhos; i++) {
        const angulo = (Math.PI * 2 * i) / numEspinhos;
        const raio = 48;
        const x = 100 + Math.cos(angulo) * raio;
        const y = 100 + Math.sin(angulo) * raio;
        const altura = random(12, 20);
        const ponta_x = 100 + Math.cos(angulo) * (raio + altura);
        const ponta_y = 100 + Math.sin(angulo) * (raio + altura);
        
        svgContent += `<polygon points="${x},${y} ${ponta_x},${ponta_y} ${x + 3},${y + 3}" 
                fill="${corBrilho}" opacity="0.7" filter="url(#innerGlow${seed})" stroke="${cor1}" stroke-width="1">
                <animate attributeName="opacity" values="0.7;0.9;0.7" dur="2s" repeatCount="indefinite"/>
                </polygon>`;
      }

      // Chifres
      for (let i = 0; i < numChifres; i++) {
        const x = 75 + (i * (50 / Math.max(numChifres - 1, 1)));
        const altura = random(20, 35);
        const largura = random(8, 12);
        svgContent += `<polygon points="${x},70 ${x + largura / 2},${70 - altura} ${x + largura},70" 
                fill="url(#linearGrad${seed})" opacity="0.9" filter="url(#glow${seed})" stroke="${corBrilho}" stroke-width="2">
                <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
                </polygon>`;
      }

      // Olhos (8 tipos completos)
      const espacamento = numOlhos === 1 ? 0 : 60 / (numOlhos - 1);
      for (let i = 0; i < numOlhos; i++) {
        const x = numOlhos === 1 ? 100 : 70 + (i * espacamento);
        const tamanhoBase = avatar.raridade === 'Lendário' ? 14 : avatar.raridade === 'Raro' ? 12 : 10;
        const tamanho = tamanhoBase + random(-1, 1);
        
        switch(tipoOlho) {
          case 1: // Redondo clássico
            svgContent += `<circle cx="${x}" cy="95" r="${tamanho}" fill="#0a0a0a"/>
                    <circle cx="${x}" cy="95" r="${tamanho * 0.75}" fill="${corOlho}" filter="url(#glow${seed})">
                    <animate attributeName="r" values="${tamanho * 0.75};${tamanho * 0.8};${tamanho * 0.75}" dur="3s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="${x}" cy="95" r="${tamanho * 0.4}" fill="#000"/>
                    <circle cx="${x + 3}" cy="92" r="${tamanho * 0.25}" fill="#fff" opacity="0.9"/>`;
            break;
          case 2: // Reptiliano
            svgContent += `<ellipse cx="${x}" cy="95" rx="${tamanho}" ry="${tamanho * 1.2}" fill="#0a0a0a"/>
                    <ellipse cx="${x}" cy="95" rx="${tamanho * 0.75}" ry="${tamanho * 0.9}" fill="${corOlho}" filter="url(#glow${seed})"/>
                    <ellipse cx="${x}" cy="95" rx="${tamanho * 0.2}" ry="${tamanho * 0.8}" fill="#000">
                    <animate attributeName="ry" values="${tamanho * 0.8};${tamanho * 0.9};${tamanho * 0.8}" dur="2s" repeatCount="indefinite"/>
                    </ellipse>
                    <ellipse cx="${x + 2}" cy="92" rx="${tamanho * 0.15}" ry="${tamanho * 0.3}" fill="#fff" opacity="0.8"/>`;
            break;
          case 3: // Brilhante
            svgContent += `<circle cx="${x}" cy="95" r="${tamanho}" fill="${corOlho}" filter="url(#glow${seed})">
                    <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="${x}" cy="95" r="${tamanho * 0.6}" fill="${corBrilho}" opacity="0.8">
                    <animate attributeName="r" values="${tamanho * 0.6};${tamanho * 0.7};${tamanho * 0.6}" dur="1.5s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="${x + 3}" cy="92" r="${tamanho * 0.3}" fill="#fff" opacity="0.9"/>`;
            break;
          case 4: // Múltiplo
            svgContent += `<circle cx="${x}" cy="95" r="${tamanho}" fill="#0a0a0a"/>
                    <circle cx="${x}" cy="95" r="${tamanho * 0.75}" fill="${corOlho}" filter="url(#glow${seed})"/>
                    <circle cx="${x}" cy="95" r="${tamanho * 0.5}" fill="none" stroke="#000" stroke-width="2"/>
                    <circle cx="${x}" cy="95" r="${tamanho * 0.3}" fill="#000">
                    <animate attributeName="r" values="${tamanho * 0.3};${tamanho * 0.35};${tamanho * 0.3}" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="${x + 2}" cy="92" r="${tamanho * 0.2}" fill="#fff" opacity="0.9"/>`;
            break;
          case 5: // Composto
            svgContent += `<circle cx="${x}" cy="95" r="${tamanho}" fill="#0a0a0a"/>
                    <circle cx="${x}" cy="95" r="${tamanho * 0.75}" fill="${corOlho}" filter="url(#glow${seed})"/>
                    <circle cx="${x - tamanho * 0.3}" cy="${95 - tamanho * 0.3}" r="${tamanho * 0.25}" fill="${corBrilho}" opacity="0.6"/>
                    <circle cx="${x + tamanho * 0.3}" cy="${95 - tamanho * 0.3}" r="${tamanho * 0.25}" fill="${corBrilho}" opacity="0.6"/>
                    <circle cx="${x}" cy="${95 + tamanho * 0.3}" r="${tamanho * 0.25}" fill="${corBrilho}" opacity="0.6">
                    <animate attributeName="opacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite"/>
                    </circle>`;
            break;
          case 6: // Triangular
            svgContent += `<path d="M ${x} ${95 - tamanho} L ${x + tamanho * 0.87} ${95 + tamanho * 0.5} L ${x - tamanho * 0.87} ${95 + tamanho * 0.5} Z" 
                    fill="#0a0a0a"/>
                    <path d="M ${x} ${95 - tamanho * 0.7} L ${x + tamanho * 0.6} ${95 + tamanho * 0.35} L ${x - tamanho * 0.6} ${95 + tamanho * 0.35} Z" 
                    fill="${corOlho}" filter="url(#glow${seed})">
                    <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite"/>
                    </path>
                    <circle cx="${x}" cy="${95 - tamanho * 0.2}" r="${tamanho * 0.3}" fill="#000"/>`;
            break;
          case 7: // Espiral
            svgContent += `<circle cx="${x}" cy="95" r="${tamanho}" fill="#0a0a0a"/>
                    <circle cx="${x}" cy="95" r="${tamanho * 0.75}" fill="${corOlho}" filter="url(#glow${seed})"/>
                    <path d="M ${x} 95 Q ${x + tamanho * 0.3} 95 ${x + tamanho * 0.4} ${95 - tamanho * 0.2} Q ${x + tamanho * 0.3} ${95 - tamanho * 0.4} ${x} ${95 - tamanho * 0.3}" 
                    stroke="#000" stroke-width="2" fill="none">
                    <animateTransform attributeName="transform" type="rotate" values="0 ${x} 95;360 ${x} 95" dur="4s" repeatCount="indefinite"/>
                    </path>`;
            break;
          case 8: // Diamante
            svgContent += `<path d="M ${x} ${95 - tamanho} L ${x + tamanho} 95 L ${x} ${95 + tamanho} L ${x - tamanho} 95 Z" 
                    fill="#0a0a0a"/>
                    <path d="M ${x} ${95 - tamanho * 0.7} L ${x + tamanho * 0.7} 95 L ${x} ${95 + tamanho * 0.7} L ${x - tamanho * 0.7} 95 Z" 
                    fill="${corOlho}" filter="url(#glow${seed})">
                    <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite"/>
                    </path>
                    <circle cx="${x}" cy="95" r="${tamanho * 0.3}" fill="#000">
                    <animate attributeName="r" values="${tamanho * 0.3};${tamanho * 0.35};${tamanho * 0.3}" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="${x + 2}" cy="93" r="${tamanho * 0.2}" fill="#fff" opacity="0.9"/>`;
            break;
        }
      }

      // Boca (8 tipos completos)
      const bocaY = 115;
      switch(bocaTipo) {
        case 1: // Sorriso
          svgContent += `<path d="M 75 ${bocaY} Q 100 ${bocaY + 12} 125 ${bocaY}" 
                  stroke="#000" stroke-width="3" fill="none" opacity="0.8"/>`;
          break;
        case 2: // Carranca
          svgContent += `<path d="M 75 ${bocaY + 8} Q 100 ${bocaY - 4} 125 ${bocaY + 8}" 
                  stroke="#000" stroke-width="3" fill="none" opacity="0.8"/>`;
          break;
        case 3: // Zigue-zague
          svgContent += `<path d="M 75 ${bocaY} L 82 ${bocaY + 8} L 90 ${bocaY} L 97 ${bocaY + 8} L 103 ${bocaY} L 110 ${bocaY + 8} L 118 ${bocaY} L 125 ${bocaY + 8}" 
                  stroke="#000" stroke-width="3" fill="none" opacity="0.8"/>`;
          break;
        case 4: // Com língua
          svgContent += `<ellipse cx="100" cy="${bocaY + 5}" rx="18" ry="12" fill="#000" opacity="0.8" stroke="${corSec}" stroke-width="2">
                  <animate attributeName="ry" values="12;14;12" dur="2s" repeatCount="indefinite"/>
                  </ellipse>
                  <ellipse cx="100" cy="${bocaY + 10}" rx="8" ry="5" fill="${cor1}" opacity="0.7">
                  <animate attributeName="cy" values="${bocaY + 10};${bocaY + 12};${bocaY + 10}" dur="2s" repeatCount="indefinite"/>
                  </ellipse>`;
          break;
        case 5: // Maligno
          svgContent += `<path d="M 75 ${bocaY} Q 85 ${bocaY + 10} 100 ${bocaY + 8} Q 115 ${bocaY + 10} 125 ${bocaY}" 
                  stroke="#000" stroke-width="3" fill="none" opacity="0.8"/>
                  <circle cx="85" cy="${bocaY + 6}" r="2" fill="#fff"/>
                  <circle cx="100" cy="${bocaY + 8}" r="2" fill="#fff"/>
                  <circle cx="115" cy="${bocaY + 6}" r="2" fill="#fff"/>`;
          break;
        case 6: // Redonda
          svgContent += `<circle cx="100" cy="${bocaY + 3}" r="6" fill="#000" opacity="0.8">
                  <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite"/>
                  </circle>`;
          break;
        case 7: // Com presas
          svgContent += `<path d="M 85 ${bocaY} Q 100 ${bocaY + 8} 115 ${bocaY}" 
                  stroke="#000" stroke-width="3" fill="none" opacity="0.8"/>
                  <polygon points="90,${bocaY + 2} 92,${bocaY + 10} 94,${bocaY + 2}" fill="#fff"/>
                  <polygon points="106,${bocaY + 2} 108,${bocaY + 10} 110,${bocaY + 2}" fill="#fff"/>`;
          break;
        case 8: // Ondulada
          svgContent += `<path d="M 75 ${bocaY} Q 85 ${bocaY + 5} 90 ${bocaY} Q 95 ${bocaY - 5} 100 ${bocaY} Q 105 ${bocaY + 5} 110 ${bocaY} Q 115 ${bocaY - 5} 125 ${bocaY}" 
                  stroke="#000" stroke-width="3" fill="none" opacity="0.8">
                  <animate attributeName="d" 
                           values="M 75 ${bocaY} Q 85 ${bocaY + 5} 90 ${bocaY} Q 95 ${bocaY - 5} 100 ${bocaY} Q 105 ${bocaY + 5} 110 ${bocaY} Q 115 ${bocaY - 5} 125 ${bocaY};
                                   M 75 ${bocaY} Q 85 ${bocaY + 7} 90 ${bocaY} Q 95 ${bocaY - 7} 100 ${bocaY} Q 105 ${bocaY + 7} 110 ${bocaY} Q 115 ${bocaY - 7} 125 ${bocaY};
                                   M 75 ${bocaY} Q 85 ${bocaY + 5} 90 ${bocaY} Q 95 ${bocaY - 5} 100 ${bocaY} Q 105 ${bocaY + 5} 110 ${bocaY} Q 115 ${bocaY - 5} 125 ${bocaY}" 
                           dur="3s" repeatCount="indefinite"/>
                  </path>`;
          break;
      }

      // Detalhes extras (manchas)
      const numDetalhes = avatar.raridade === 'Lendário' ? random(4, 6) : random(3, 5);
      for (let i = 0; i < numDetalhes; i++) {
        const x = random(75, 125);
        const y = random(80, 120);
        const tamanho = random(2, 4);
        
        svgContent += `<circle cx="${x}" cy="${y}" r="${tamanho}" fill="${corBrilho}" opacity="0.25">
                <animate attributeName="opacity" values="0.25;0.15;0.25" dur="3s" repeatCount="indefinite"/>
                </circle>`;
      }

      // Partículas flutuantes específicas por elemento
      const numParticulas = avatar.raridade === 'Lendário' ? 14 : avatar.raridade === 'Raro' ? 9 : 5;
      for (let i = 0; i < numParticulas; i++) {
        const px = random(20, 180);
        const py = random(20, 180);
        const tamanhoP = random(1, avatar.raridade === 'Lendário' ? 3 : 2);
        const delay = random(0, 20) * 0.1;
        
        switch(config.particulas) {
          case 'chamas':
            svgContent += `<path d="M ${px} ${py} Q ${px - 2} ${py - 6} ${px} ${py - 10}" stroke="${corBrilho}" stroke-width="${tamanhoP}" opacity="0.6" fill="none" stroke-linecap="round" filter="url(#glow${seed})">
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" begin="${delay}s" repeatCount="indefinite"/>
              <animate attributeName="d" 
                       values="M ${px} ${py} Q ${px - 2} ${py - 6} ${px} ${py - 10};
                               M ${px} ${py} Q ${px - 1} ${py - 7} ${px} ${py - 11};
                               M ${px} ${py} Q ${px - 2} ${py - 6} ${px} ${py - 10}" 
                       dur="1.5s" begin="${delay}s" repeatCount="indefinite"/>
            </path>`;
            break;
          case 'gotas':
            svgContent += `<ellipse cx="${px}" cy="${py}" rx="${tamanhoP}" ry="${tamanhoP * 1.5}" fill="${corBrilho}" opacity="0.5" filter="url(#glow${seed})">
              <animate attributeName="cy" values="${py};${py + 10};${py}" dur="2s" begin="${delay}s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0.3;0.5" dur="2s" begin="${delay}s" repeatCount="indefinite"/>
            </ellipse>`;
            break;
          case 'raios':
            const rx = random(-5, 5);
            const ry = random(-8, -4);
            svgContent += `<line x1="${px}" y1="${py}" x2="${px + rx}" y2="${py + ry}" stroke="${corBrilho}" stroke-width="${tamanhoP}" opacity="0.7" stroke-linecap="round" filter="url(#glow${seed})">
              <animate attributeName="opacity" values="0.7;0;0.7" dur="0.8s" begin="${delay}s" repeatCount="indefinite"/>
            </line>`;
            break;
          case 'espirais':
            svgContent += `<path d="M ${px} ${py} Q ${px + 3} ${py - 3} ${px + 5} ${py - 1} Q ${px + 7} ${py + 2} ${px + 5} ${py + 4}" stroke="${corBrilho}" stroke-width="${tamanhoP * 0.8}" opacity="0.5" fill="none" filter="url(#glow${seed})">
              <animateTransform attributeName="transform" type="rotate" from="0 ${px} ${py}" to="360 ${px} ${py}" dur="4s" begin="${delay}s" repeatCount="indefinite"/>
            </path>`;
            break;
          case 'estrelas':
            svgContent += `<path d="M ${px} ${py - tamanhoP * 2} L ${px + tamanhoP * 0.5} ${py - tamanhoP * 0.5} L ${px + tamanhoP * 2} ${py} L ${px + tamanhoP * 0.5} ${py + tamanhoP * 0.5} L ${px} ${py + tamanhoP * 2} L ${px - tamanhoP * 0.5} ${py + tamanhoP * 0.5} L ${px - tamanhoP * 2} ${py} L ${px - tamanhoP * 0.5} ${py - tamanhoP * 0.5} Z" fill="${corBrilho}" opacity="0.6" filter="url(#glow${seed})">
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" begin="${delay}s" repeatCount="indefinite"/>
              <animateTransform attributeName="transform" type="rotate" from="0 ${px} ${py}" to="360 ${px} ${py}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
            </path>`;
            break;
          case 'pedras':
            const rotacao = random(0, 360);
            svgContent += `<rect x="${px - tamanhoP}" y="${py - tamanhoP}" width="${tamanhoP * 2}" height="${tamanhoP * 2}" fill="${corBrilho}" opacity="0.4" transform="rotate(${rotacao} ${px} ${py})" filter="url(#glow${seed})">
              <animate attributeName="opacity" values="0.4;0.2;0.4" dur="3s" begin="${delay}s" repeatCount="indefinite"/>
            </rect>`;
            break;
          case 'sombras':
            svgContent += `<circle cx="${px}" cy="${py}" r="${tamanhoP}" fill="${corBrilho}" opacity="0.4" filter="url(#glow${seed})">
              <animate attributeName="r" values="${tamanhoP};${tamanhoP * 1.5};${tamanhoP}" dur="2s" begin="${delay}s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" begin="${delay}s" repeatCount="indefinite"/>
            </circle>`;
            break;
        }
      }

      svgContent += `</g></svg>`;
      
      setSvg(svgContent);
      setLoading(false);
    };

    // Pequeno delay para não travar a UI
    const timer = setTimeout(gerarSVG, 50);
    return () => clearTimeout(timer);
  }, [avatar, seed, elementosConfig]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: tamanho, height: tamanho }}>
        <div className="animate-pulse text-cyan-400 text-2xl">🔮</div>
      </div>
    );
  }

  return (
    <div 
      className={`avatar-svg-container ${className}`}
      style={{ width: tamanho, height: tamanho }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
