const fs = require('fs');

const file = 'components/AnalisaDataTab.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">`;
const endStr = `                    ].map((item, idx) => (`;

// We'll replace the block.
// First, find the start and end of the map function.
const startIdx = code.indexOf(`!tenureSubView ? (`);
const endIdx = code.indexOf(`) : tenureSubView === 'Perbandingan Pengukuran Dimensi' ? (`);

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find section");
    process.exit(1);
}

let section = code.substring(startIdx, endIdx);

const replacementMap = `                    ].map((item, idx) => {
                      const colors = [
                        { bg: 'bg-[#FDBA21]', text: 'text-white', pin: 'text-red-500' },
                        { bg: 'bg-[#F27A54]', text: 'text-white', pin: 'text-red-500' },
                        { bg: 'bg-[#009EDB]', text: 'text-white', pin: 'text-red-500' },
                        { bg: 'bg-[#1A2B4C]', text: 'text-white', pin: 'text-red-500' }
                      ];
                      const color = colors[idx];
                      
                      return (
                        <motion.div
                          key={idx}
                          whileHover={{ y: -5 }}
                          onClick={() => setTenureSubView(item.title === 'INFOGRAPHIC' ? item.title : item.title)}
                          className="relative cursor-pointer group pt-6 pr-2 pl-2 flex flex-col h-full"
                          style={{ filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.08))' }}
                        >
                          {/* Top Left Tag */}
                          <div className={\`absolute top-0 left-0 \${color.bg} \${color.text} rounded-tl-[24px] rounded-br-[24px] rounded-tr-md rounded-bl-sm py-2 px-5 shadow-sm flex items-center gap-2 z-20\`} style={{ minWidth: '110px' }}>
                            <span className="text-[9px] font-bold uppercase opacity-90 mt-1">Step</span>
                            <span className="text-[26px] font-bold leading-none">0{idx + 1}</span>
                          </div>

                          {/* Main Paper */}
                          <div className="relative bg-white pt-14 pb-6 px-6 flex flex-col items-center text-center w-full flex-1 rounded-tr-md rounded-tl-md z-10" 
                               style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 26px, #f1f5f9 26px, #f1f5f9 27px)', backgroundPosition: '0 40px' }}>
                            
                            {/* Red Pin */}
                            <div className="absolute top-3 right-3 text-red-500 drop-shadow-sm z-30">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="rotate-[30deg]">
                                <path d="M16 9V4h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1v5l-2 3v2h5v7a1 1 0 0 0 2 0v-7h5v-2l-2-3z"/>
                              </svg>
                            </div>

                            <div className="mb-4 flex justify-center items-center bg-white p-2 rounded-full shadow-sm border border-slate-50">
                              {item.icon}
                            </div>
                            
                            <h3 className="text-slate-800 font-bold text-[13px] uppercase tracking-widest mb-3 bg-white px-2 rounded-sm">
                              {item.title}
                            </h3>
                            
                            <p className="text-slate-400 text-[10px] leading-[1.8] line-clamp-5 bg-white/70 px-2 rounded-sm">
                              {item.desc}
                            </p>
                          </div>

                          {/* Torn Bottom Edge SVG */}
                          <div className="w-full text-white relative z-10" style={{ marginTop: '-1px' }}>
                            <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-3 fill-current block">
                              <polygon points="0,0 100,0 100,1 98,3 96,0 94,3 92,0 90,3 88,0 86,3 84,0 82,3 80,0 78,3 76,0 74,3 72,0 70,3 68,0 66,3 64,0 62,3 60,0 58,3 56,0 54,3 52,0 50,3 48,0 46,3 44,0 42,3 40,0 38,3 36,0 34,3 32,0 30,3 28,0 26,3 24,0 22,3 20,0 18,3 16,0 14,3 12,0 10,3 8,0 6,3 4,0 2,3 0,0" />
                            </svg>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>`;

// Replace the grid start and items map
const regex = /<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">([\s\S]*?)\]\.map\(\(item, idx\) => \([\s\S]*?<\/motion\.div>\s*\)\)\s*}/;

let replacement = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-[20px] pb-[20px] px-2">
                    {[
                      { 
                        title: 'INFOGRAPHIC', 
                        desc: 'Analisis Perbandingan tingkat persentase respon positif untuk 10 dimensi budaya keselamatan berdasarkan masa jabatan / lama kerja staf.', 
                        icon: <BarChart2 className="w-7 h-7 text-amber-500 stroke-[1.5]" />
                      },
                      { 
                        title: 'INFOGRAPHIC', 
                        desc: 'Mengevaluasi dan membandingkan tanggapan positif staf untuk setiap butir pertanyaan kuesioner SOPS di tiap kelompok masa jabatan.', 
                        icon: <ListChecks className="w-7 h-7 text-orange-500 stroke-[1.5]" />
                      },
                      { 
                        title: 'INFOGRAPHIC', 
                        desc: 'Membandingkan penilaian peringkat keselamatan pasien umum (E1) berdasarkan masa jabatan atau lama kerja staf.', 
                        icon: <HeartPulse className="w-7 h-7 text-sky-500 stroke-[1.5]" />
                      },
                      { 
                        title: 'INFOGRAPHIC', 
                        desc: 'Melihat perbandingan frekuensi pelaporan kejadian tidak diharapkan (KTD/KNC) di antara kelompok masa jabatan staf.', 
                        icon: <AlertTriangle className="w-7 h-7 text-slate-800 stroke-[1.5]" />
                      }
${replacementMap}`;

code = code.substring(0, startIdx) + section.replace(regex, replacement) + code.substring(endIdx);
fs.writeFileSync(file, code);
