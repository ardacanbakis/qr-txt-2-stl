/**
 * Convert a .ttf font to Three.js typeface.json format using opentype.js.
 *
 * Usage:
 *   node scripts/convert-font.js <input.ttf> <output.typeface.json> [charset]
 *
 * charset defaults to "latin-extended" which covers ASCII + Latin Extended
 * (including Turkish, German, French, Spanish, Portuguese, etc.)
 */

const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');

const CHARSETS = {
  ascii: range(32, 126),
  'latin-extended': [
    ...range(32, 126),   // Basic ASCII
    ...range(160, 383),  // Latin Extended-A (covers Turkish, accented Latin, etc.)
    ...range(402, 402),  // ƒ
    ...range(8211, 8230), // dashes, quotes, ellipsis
    ...range(8364, 8364), // €
  ],
};

function range(start, end) {
  const r = [];
  for (let i = start; i <= end; i++) r.push(i);
  return r;
}

function convertFont(inputPath, outputPath, charsetName = 'latin-extended') {
  const font = opentype.loadSync(inputPath);
  const scale = 1000 / font.unitsPerEm;
  const codepoints = CHARSETS[charsetName] || CHARSETS['latin-extended'];

  const glyphs = {};

  for (const code of codepoints) {
    const ch = String.fromCharCode(code);
    const glyph = font.charToGlyph(ch);
    if (!glyph || glyph.index === 0) continue;

    const pathObj = glyph.getPath(0, 0, 1000);
    let outline = '';

    for (const cmd of pathObj.commands) {
      switch (cmd.type) {
        case 'M':
          outline += `m ${r(cmd.x * scale)} ${r(cmd.y * scale)} `;
          break;
        case 'L':
          outline += `l ${r(cmd.x * scale)} ${r(cmd.y * scale)} `;
          break;
        case 'Q':
          outline += `q ${r(cmd.x1 * scale)} ${r(cmd.y1 * scale)} ${r(cmd.x * scale)} ${r(cmd.y * scale)} `;
          break;
        case 'C':
          outline += `b ${r(cmd.x1 * scale)} ${r(cmd.y1 * scale)} ${r(cmd.x2 * scale)} ${r(cmd.y2 * scale)} ${r(cmd.x * scale)} ${r(cmd.y * scale)} `;
          break;
        case 'Z':
          break;
      }
    }

    glyphs[ch] = {
      x_min: r(glyph.xMin * scale),
      x_max: r(glyph.xMax * scale),
      ha: r(glyph.advanceWidth * scale),
      o: outline.trim(),
    };
  }

  const result = {
    glyphs,
    familyName: font.names.fontFamily?.en || 'Unknown',
    ascender: r(font.ascender * scale),
    descender: r(font.descender * scale),
    underlinePosition: r((font.tables.post?.underlinePosition || -100) * scale),
    underlineThickness: r((font.tables.post?.underlineThickness || 50) * scale),
    boundingBox: {
      xMin: r(font.tables.head.xMin * scale),
      xMax: r(font.tables.head.xMax * scale),
      yMin: r(font.tables.head.yMin * scale),
      yMax: r(font.tables.head.yMax * scale),
    },
    resolution: 1000,
    original_font_information: {
      format: 0,
      copyright: font.names.copyright?.en || '',
      fontFamily: font.names.fontFamily?.en || '',
      fontSubfamily: font.names.fontSubfamily?.en || '',
      uniqueID: font.names.uniqueID?.en || '',
      fullName: font.names.fullName?.en || '',
      postScriptName: font.names.postScriptName?.en || '',
    },
    cssFontWeight: font.names.fontSubfamily?.en?.toLowerCase().includes('bold') ? 'bold' : 'normal',
    cssFontStyle: 'normal',
  };

  fs.writeFileSync(outputPath, JSON.stringify(result));
  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`Wrote ${outputPath} (${Object.keys(glyphs).length} glyphs, ${sizeMB} MB)`);
}

function r(n) {
  return Math.round(n);
}

const [,, input, output, charset] = process.argv;
if (!input || !output) {
  console.error('Usage: node convert-font.js <input.ttf> <output.typeface.json> [charset]');
  process.exit(1);
}

convertFont(input, output, charset);
