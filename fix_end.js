const fs = require('fs');
let content = fs.readFileSync('components/AnalisaDataTab.tsx', 'utf8');

const prefix = content.substring(0, content.indexOf('{activeView !== \'main\' && ('));

const suffix = `{activeView !== 'main' && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto min-h-[600px] flex flex-col"
          >
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setActiveView('main')}
                className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {mainCards.find(c => c.id === activeView)?.title}
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  {mainCards.find(c => c.id === activeView)?.description}
                </p>
              </div>
            </div>

            {activeView === 'benchmark' ? (
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
                  Data untuk analisis {mainCards.find(c => c.id === activeView)?.title?.toLowerCase()} akan ditampilkan di sini.
                </p>
                <button 
                  onClick={() => setActiveView('main')}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Kembali ke Menu Utama
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;

fs.writeFileSync('components/AnalisaDataTab.tsx', prefix + suffix);
