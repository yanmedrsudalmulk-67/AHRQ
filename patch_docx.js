const fs = require('fs');
let code = fs.readFileSync('lib/docxExporter.ts', 'utf8');

const oldMargin = `margin: { top: 1700, bottom: 1700, left: 2270, right: 1700 }, // Top/Bottom/Right: 3cm (~1700 dxa), Left: 4cm (~2270 dxa)`;
const newMargin = `margin: { top: 1417, bottom: 1417, left: 1417, right: 1417 }, // 2.5cm margin all around (~1417 dxa)`;
code = code.replace(oldMargin, newMargin);

fs.writeFileSync('lib/docxExporter.ts', code);
