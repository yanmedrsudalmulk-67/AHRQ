const fs = require('fs');
let content = fs.readFileSync('components/AnalisaDataTab.tsx', 'utf8');

content = content.replace(
  /import \{([\s\S]*?)Filter\n\} from 'lucide-react';/,
  "import {$1Filter,\n  Award,\n  BarChart,\n  ListChecks,\n  HeartPulse,\n  AlertTriangle\n} from 'lucide-react';"
);

content = content.replace(
  /const \[activeView, setActiveView\] = useState\S+'main' \| 'hospital' \| 'unit' \| 'position' \| 'tenure' \| 'interaction' \| 'ai'\S+\('main'\);/,
  "const [activeView, setActiveView] = useState<'main' | 'hospital' | 'unit' | 'position' | 'tenure' | 'interaction' | 'benchmark'>('main');"
);

content = content.replace(
  /\{\n\s+id: 'ai',[\s\S]*?\} \/\/ Special case\n\s+\}/,
  `{
      id: 'benchmark',
      title: 'Hasil Perbandingan Dengan Rumah Sakit Percontohan',
      description: 'Analisis komparatif hasil survei dengan rumah sakit percontohan.',
      icon: <Award className="w-8 h-8 text-indigo-600" />,
      color: 'from-indigo-500 to-blue-700',
      dataCount: 4 // Special case
    }`
);

content = content.replace(
  /card\.id \!\=\= 'ai'/g,
  "card.id !== 'benchmark'"
);

content = content.replace(
  /\{\/\* Placeholder content for details \*\/\}\n\s*<div className="flex-1 bg-white rounded-\[24px\] shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\] border border-slate-100 p-8 flex items-center justify-center flex-col text-center">[\s\S]*?<\/div>/,
  `{activeView === 'benchmark' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
                {[
                  { title: 'Perbandingan Pengukuran Dimensi', icon: <BarChart className="w-8 h-8 text-indigo-600" /> },
                  { title: 'Perbandingan Hasil Per Item', icon: <ListChecks className="w-8 h-8 text-teal-600" /> },
                  { title: 'Perbandingan Penilaian Keselamatan Pasien', icon: <HeartPulse className="w-8 h-8 text-rose-600" /> },
                  { title: 'Perbandingan Jumlah Peristiwa Yang Dilaporkan', icon: <AlertTriangle className="w-8 h-8 text-amber-600" /> },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col cursor-pointer items-center text-center group"
                  >
                    <div className="p-4 bg-slate-50 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                    <p className="text-slate-500 text-sm font-medium">Modul Sedang Dalam Pengembangan</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex-1 bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex items-center justify-center flex-col text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                   {mainCards.find(c => c.id === activeView)?.icon}
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Modul Sedang Dalam Pengembangan</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  Data untuk analisis {mainCards.find(c => c.id === activeView)?.title.toLowerCase()} akan ditampilkan di sini.
                </p>
                <button 
                  onClick={() => setActiveView('main')}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Kembali ke Menu Utama
                </button>
              </div>
            )}`
);

fs.writeFileSync('components/AnalisaDataTab.tsx', content);
