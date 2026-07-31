const fs = require('fs');
let code = fs.readFileSync('components/LaporanTab.tsx', 'utf8');

const oldPrintPage = `            padding-top: 3cm !important;
            padding-bottom: 3cm !important;
            padding-left: 4cm !important;
            padding-right: 3cm !important;`;
const newPrintPage = `            padding-top: 2.5cm !important;
            padding-bottom: 2.5cm !important;
            padding-left: 2.5cm !important;
            padding-right: 2.5cm !important;`;
code = code.replace(oldPrintPage, newPrintPage);

const oldWordPage = `          padding-top: 3cm;
          padding-bottom: 3cm;
          padding-left: 4cm;
          padding-right: 3cm;`;
const newWordPage = `          padding-top: 2.5cm;
          padding-bottom: 2.5cm;
          padding-left: 2.5cm;
          padding-right: 2.5cm;`;
code = code.replace(oldWordPage, newWordPage);

fs.writeFileSync('components/LaporanTab.tsx', code);
