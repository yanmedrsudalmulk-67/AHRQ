const fs = require('fs');
let content = fs.readFileSync('components/LaporanTab.tsx', 'utf-8');
content = content.replace(/<div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md font-bold text-emerald-400">\&ge; 75%<\/span><\/div>/g, '<div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md"></div><span className="text-[10px] font-bold text-emerald-400">&ge; 75%</span></div>');
content = content.replace(/<div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-md font-bold text-yellow-400">50-74%<\/span><\/div>/g, '<div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-md"></div><span className="text-[10px] font-bold text-yellow-400">50-74%</span></div>');
content = content.replace(/<div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-md font-bold text-rose-400">\&lt; 50%<\/span><\/div>/g, '<div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-md"></div><span className="text-[10px] font-bold text-rose-400">&lt; 50%</span></div>');
fs.writeFileSync('components/LaporanTab.tsx', content);
