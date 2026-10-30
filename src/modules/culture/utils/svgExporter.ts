// =============================================================================
// AVS — Vector SVG Exporter
// Convertit les motifs (SVG pur, CSS natif ou futurs motifs CSS dynamiques)
// en documents XML SVG vectoriels totalement valides et autonomes pour l'export.
// Compatible avec Illustrator, Inkscape, Figma, Canva, etc.
// =============================================================================

export interface ExportablePattern {
  id: string;
  name: string;
  slug: string;
  type?: string;
  format?: 'SVG' | 'CSS' | 'HYBRID';
  cssClass?: string;
  cssCode?: string | null;
  svgContent?: string | null;
  colors?: Array<{ hex: string; name?: string }>;
}

export function generateVectorSvgFromCss(pattern: ExportablePattern): string {
  // 1. Si le motif possède déjà du contenu SVG vectoriel direct
  if (pattern.svgContent && pattern.svgContent.includes('<svg')) {
    let cleanSvg = pattern.svgContent.trim();
    if (!cleanSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return cleanSvg;
  }

  // Couleurs extraites ou valeurs par défaut traditionnelles
  const hexColors = pattern.colors && pattern.colors.length > 0
    ? pattern.colors.map(c => c.hex)
    : ['#d4a017', '#c0573e', '#4a6741', '#1a1208'];

  const c1 = hexColors[0] || '#d4a017'; // Or / primaire
  const c2 = hexColors[1] || '#c0573e'; // Rouge / secondaire
  const c3 = hexColors[2] || '#4a6741'; // Vert / accent
  const cBg = hexColors[3] || '#1a1208'; // Fond / sombre

  const patternType = (pattern.type || '').toUpperCase();
  const cssClass = pattern.cssClass || '';

  // 2. Génération vectorielle native selon le type de motif
  let patternId = 'genericPattern';
  let patternElements = '';

  if (patternType === 'KENTE' || cssClass.includes('kente')) {
    patternId = 'kentePattern';
    patternElements = `
    <pattern id="kentePattern" width="48" height="16" patternUnits="userSpaceOnUse">
      <rect width="48" height="16" fill="#1a1208" />
      <rect x="0" width="6" height="16" fill="${c1}" />
      <rect x="12" width="4" height="16" fill="${c2}" />
      <rect x="22" width="4" height="16" fill="${c3}" />
      <rect x="32" width="4" height="16" fill="${c1}" />
      <rect x="22" width="2" height="16" fill="#c0573e" opacity="0.15" />
      <path d="M0 1H48 M0 7H48" stroke="#f5ebe0" stroke-width="2" opacity="0.06" />
      <path d="M0 8H48" stroke="#d4a017" stroke-width="2" opacity="0.12" />
    </pattern>
    `;
  } else if (patternType === 'NDOP' || cssClass.includes('ndop')) {
    patternId = 'ndopPattern';
    patternElements = `
    <pattern id="ndopPattern" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill="#0d2340" />
      <path d="M0 0H24 M0 0V24" stroke="#c8a96e" stroke-width="1" opacity="0.2" />
      <circle cx="12" cy="12" r="1.5" fill="#c8a96e" opacity="0.4" />
    </pattern>
    `;
  } else if (patternType === 'BOGOLAN' || cssClass.includes('bogolan')) {
    patternId = 'bogolanPattern';
    patternElements = `
    <pattern id="bogolanPattern" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#f5ebe0" />
      <path d="M-14 14L14-14 M-7 21L21-7 M0 28L28 0 M-14-14L14 14 M-7-21L21 7 M0-28L28 0"
        stroke="#8b4513" stroke-width="3" />
    </pattern>
    `;
  } else if (patternType === 'ADINKRA' || cssClass.includes('adinkra')) {
    patternId = 'adinkraPattern';
    patternElements = `
    <pattern id="adinkraPattern" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#1d1d1b" />
      <circle cx="0" cy="0" r="1.5" fill="#d4a017" />
      <circle cx="0" cy="0" r="8.5" fill="none" stroke="#d4a017" stroke-width="1.5" />
      <path d="M3 0V14" stroke="#d4a017" stroke-width="1" />
    </pattern>
    `;
  } else if (patternType === 'KUBA' || cssClass.includes('kuba')) {
    patternId = 'kubaPattern';
    patternElements = `
    <pattern id="kubaPattern" width="4" height="6" patternUnits="userSpaceOnUse">
      <rect width="4" height="6" fill="#2a2420" />
      <path d="M-4 4L4-4 M-2 6L6-2 M0 8L8 0 M-4-4L4 4 M-2-6L6 2 M0-8L8 0"
        stroke="#c8a96e" stroke-width="1" />
      <rect x="2" width="2" height="6" fill="#c8a96e" opacity="0.2" />
    </pattern>
    `;
  } else if (patternType === 'WAX' || cssClass.includes('wax')) {
    patternId = 'waxPattern';
    patternElements = `
    <pattern id="waxPattern" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="#fdfbf7" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="${c2}" stroke-width="4" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="${c1}" stroke-width="3" />
      <circle cx="50" cy="50" r="16" fill="${c3}" />
      <path d="M 50,0 Q 65,25 50,50 Q 35,25 50,0 Z" fill="${c1}" opacity="0.7" />
      <path d="M 100,50 Q 75,65 50,50 Q 75,35 100,50 Z" fill="${c1}" opacity="0.7" />
    </pattern>
    `;
  } else {
    patternElements = `
    <pattern id="genericPattern" width="50" height="50" patternUnits="userSpaceOnUse">
      <rect width="50" height="50" fill="${cBg}" />
      <path d="M 0 0 L 50 50 M 50 0 L 0 50" stroke="${c1}" stroke-width="2" />
      <circle cx="25" cy="25" r="10" fill="${c2}" opacity="0.8" />
      <rect x="20" y="20" width="10" height="10" fill="${c3}" />
    </pattern>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <title>${escapeXml(pattern.name || 'Motif AVS')}</title>
  <defs>
    ${patternElements}
  </defs>
  <rect width="800" height="600" fill="url(#${patternId})" />
</svg>`.trim();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
