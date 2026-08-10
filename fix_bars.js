const fs = require('fs');
let code = fs.readFileSync('components/LaporanTab.tsx', 'utf8');

// Fix posPercent bar
code = code.replace(/style=\{\{ width: `\$\{stat\.posPercent\}%` \}\}/g, 'style={{ width: `${stat.posPercent}%`, minWidth: `${stat.posPercent}%`, maxWidth: `${stat.posPercent}%` }}');
code = code.replace(/<span className="text-\[8\.5px\] font-extrabold text-white leading-none inline-block select-none px-0\.5">\{stat\.posPercent\}%<\/span>/g, '<span className="text-[8.5px] font-extrabold text-white leading-none inline-block select-none px-0.5 whitespace-nowrap flex-shrink-0">{stat.posPercent}%</span>');

// Fix neuPercent bar
code = code.replace(/style=\{\{ width: `\$\{stat\.neuPercent\}%` \}\}/g, 'style={{ width: `${stat.neuPercent}%`, minWidth: `${stat.neuPercent}%`, maxWidth: `${stat.neuPercent}%` }}');
code = code.replace(/<span className="text-\[8\.5px\] font-extrabold text-white leading-none inline-block select-none px-0\.5">\{stat\.neuPercent\}%<\/span>/g, '<span className="text-[8.5px] font-extrabold text-white leading-none inline-block select-none px-0.5 whitespace-nowrap flex-shrink-0">{stat.neuPercent}%</span>');

// Fix negPercent bar
code = code.replace(/style=\{\{ width: `\$\{stat\.negPercent\}%` \}\}/g, 'style={{ width: `${stat.negPercent}%`, minWidth: `${stat.negPercent}%`, maxWidth: `${stat.negPercent}%` }}');
code = code.replace(/<span className="text-\[8\.5px\] font-extrabold text-white leading-none inline-block select-none px-0\.5">\{stat\.negPercent\}%<\/span>/g, '<span className="text-[8.5px] font-extrabold text-white leading-none inline-block select-none px-0.5 whitespace-nowrap flex-shrink-0">{stat.negPercent}%</span>');

// Remove maxBarSize from Recharts to make them scale properly
code = code.replace(/maxBarSize=\{35\}/g, '');

fs.writeFileSync('components/LaporanTab.tsx', code);
