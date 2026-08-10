const fs = require('fs');
let code = fs.readFileSync('components/LaporanTab.tsx', 'utf8');

// Table 1 (Demografi)
code = code.replace(/<th className="p-2 border-r border-white\/20 text-center w-\[120px\]">Karakteristik<\/th>/g, '<th className="p-2 border-r border-white/20 text-center w-[20%]">Karakteristik</th>');
code = code.replace(/<th className="p-2 border-r border-white\/20 text-center">Kategori \/ Detail<\/th>/g, '<th className="p-2 border-r border-white/20 text-center w-[50%]">Kategori / Detail</th>');
code = code.replace(/<th className="p-2 border-r border-white\/20 text-center w-\[85px\]">Jumlah \(n\)<\/th>/g, '<th className="p-2 border-r border-white/20 text-center w-[15%]">Jumlah (n)</th>');
code = code.replace(/<th className="p-2 text-center w-\[95px\]">Persentase \(%\)<\/th>/g, '<th className="p-2 text-center w-[15%]">Persentase (%)</th>');

// Table 2 & 3 (Dimensi Positif/Negatif)
code = code.replace(/<th className="p-1 border-r border-indigo-800 w-8 text-center">No<\/th>/g, '<th className="p-1 border-r border-indigo-800 w-[10%] text-center">No</th>');
code = code.replace(/<th className="p-1 border-r border-indigo-800 min-w-\[140px\]">Dimensi Budaya Keselamatan<\/th>/g, '<th className="p-1 border-r border-indigo-800 w-[90%]">Dimensi Budaya Keselamatan</th>');

code = code.replace(/<th className="p-1 border-r border-teal-700 w-8 text-center">No<\/th>/g, '<th className="p-1 border-r border-teal-700 w-[10%] text-center">No</th>');
code = code.replace(/<th className="p-1 border-r border-teal-700 min-w-\[140px\]">Dimensi Budaya Keselamatan<\/th>/g, '<th className="p-1 border-r border-teal-700 w-[90%]">Dimensi Budaya Keselamatan</th>');

// Table 4 (Trend)
code = code.replace(/<th className="p-1.5 border-r border-emerald-800 w-10 text-center">Kode<\/th>/g, '<th className="p-1.5 border-r border-emerald-800 w-[10%] text-center">Kode</th>');
code = code.replace(/<th className="p-1.5 border-r border-emerald-800">Dimensi Budaya Keselamatan<\/th>/g, '<th className="p-1.5 border-r border-emerald-800 w-[45%]">Dimensi Budaya Keselamatan</th>');
code = code.replace(/<th className="p-1.5 text-center border-r border-emerald-800 w-24">\{previousYear\}<\/th>/g, '<th className="p-1.5 text-center border-r border-emerald-800 w-[15%]">{previousYear}</th>');
code = code.replace(/<th className="p-1.5 text-center border-r border-emerald-800 w-24">\{tahunSurvei\}<\/th>/g, '<th className="p-1.5 text-center border-r border-emerald-800 w-[15%]">{tahunSurvei}</th>');
code = code.replace(/<th className="p-1.5 text-center w-24">Selisih \(Trend\)<\/th>/g, '<th className="p-1.5 text-center w-[15%]">Selisih (Trend)</th>');

// Table 5 (Benchmark)
code = code.replace(/<th className="p-1.5 border-r border-indigo-800 w-10 text-center">Kode<\/th>/g, '<th className="p-1.5 border-r border-indigo-800 w-[10%] text-center">Kode</th>');
code = code.replace(/<th className="p-1.5 border-r border-indigo-800">Dimensi Budaya Keselamatan<\/th>/g, '<th className="p-1.5 border-r border-indigo-800 w-[45%]">Dimensi Budaya Keselamatan</th>');
code = code.replace(/<th className="p-1.5 text-center border-r border-indigo-800 w-24">\{activeHospitalName\} \(Anda\)<\/th>/g, '<th className="p-1.5 text-center border-r border-indigo-800 w-[15%]">{activeHospitalName} (Anda)</th>');
code = code.replace(/<th className="p-1.5 text-center border-r border-indigo-800 w-24">\{selectedBenchmarkHospital.namaRs\}<\/th>/g, '<th className="p-1.5 text-center border-r border-indigo-800 w-[15%]">{selectedBenchmarkHospital.namaRs}</th>');
code = code.replace(/<th className="p-1.5 text-center w-24">Kesenjangan \(Gap\)<\/th>/g, '<th className="p-1.5 text-center w-[15%]">Kesenjangan (Gap)</th>');

fs.writeFileSync('components/LaporanTab.tsx', code);
