const fs = require('fs');

const file = 'components/AnalisaDataTab.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-\[20px\] pb-\[20px\] px-2">([\s\S]*?)\]\.map\(\(item, idx\) => {/;

let replacement = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-[20px] pb-[20px] px-2">
                    {[
                      { 
                        title: 'Perbandingan Pengukuran Dimensi', 
                        desc: 'Analisis Perbandingan tingkat persentase respon positif untuk 10 dimensi budaya keselamatan berdasarkan masa jabatan / lama kerja staf.', 
                        icon: <BarChart2 className="w-7 h-7 text-amber-500 stroke-[1.5]" />
                      },
                      { 
                        title: 'Perbandingan Hasil Per Item', 
                        desc: 'Mengevaluasi dan membandingkan tanggapan positif staf untuk setiap butir pertanyaan kuesioner SOPS di tiap kelompok masa jabatan.', 
                        icon: <ListChecks className="w-7 h-7 text-orange-500 stroke-[1.5]" />
                      },
                      { 
                        title: 'Penilaian Keselamatan Pasien', 
                        desc: 'Membandingkan penilaian peringkat keselamatan pasien umum (E1) berdasarkan masa jabatan atau lama kerja staf.', 
                        icon: <HeartPulse className="w-7 h-7 text-sky-500 stroke-[1.5]" />
                      },
                      { 
                        title: 'Jumlah Peristiwa Dilaporkan', 
                        desc: 'Melihat perbandingan frekuensi pelaporan kejadian tidak diharapkan (KTD/KNC) di antara kelompok masa jabatan staf.', 
                        icon: <AlertTriangle className="w-7 h-7 text-slate-800 stroke-[1.5]" />
                      }
                    ].map((item, idx) => {`;

code = code.replace(regex, replacement);

const clickRegex = /setTenureSubView\(item\.title === 'INFOGRAPHIC' \? item\.title : item\.title\)/;
code = code.replace(clickRegex, "setTenureSubView(item.title === 'Penilaian Keselamatan Pasien' ? 'Perbandingan Penilaian Keselamatan Pasien' : item.title === 'Jumlah Peristiwa Dilaporkan' ? 'Perbandingan Jumlah Peristiwa Yang Dilaporkan' : item.title)");

// also fix the styling for the torn paper to look cleaner
const tornRegex = /<svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-3 fill-current block">\s*<polygon points="[^"]*" \/>\s*<\/svg>/;
const newTorn = `<svg viewBox="0 0 100 6" preserveAspectRatio="none" className="w-full h-3 fill-current block">
                              <polygon points="0,0 100,0 100,1 98,6 96,1 94,6 92,1 90,6 88,1 86,6 84,1 82,6 80,1 78,6 76,1 74,6 72,1 70,6 68,1 66,6 64,1 62,6 60,1 58,6 56,1 54,6 52,1 50,6 48,1 46,6 44,1 42,6 40,1 38,6 36,1 34,6 32,1 30,6 28,1 26,6 24,1 22,6 20,1 18,6 16,1 14,6 12,1 10,6 8,1 6,6 4,1 2,6 0,1" />
                            </svg>`;
code = code.replace(tornRegex, newTorn);

fs.writeFileSync(file, code);
