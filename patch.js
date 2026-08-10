const fs = require('fs');
let fileContent = fs.readFileSync('./components/LaporanTab.tsx', 'utf8');

console.log('Original length:', fileContent.length);

// 1. Fix Table 3.1.2 Demografi container and column widths
const target1 = `<div className="overflow-x-auto border border-slate-200 rounded-xl text-[9px]">
                          <table className="w-full table-fixed text-left border-collapse">
                            <thead>
                              <tr className="bg-[#14B8A6] text-white font-extrabold uppercase tracking-wider text-[8.5px]">
                                <th className="p-2 border-r border-white/20 text-center w-[20%]">Karakteristik</th>
                                <th className="p-2 border-r border-white/20 text-center w-[50%]">Kategori / Detail</th>
                                <th className="p-2 border-r border-white/20 text-center w-[15%]">Jumlah (n)</th>
                                <th className="p-2 text-center w-[15%]">Persentase (%)</th>
                              </tr>
                            </thead>`;

const replacement1 = `<div className="w-full border border-slate-200 rounded-xl text-[9px] overflow-hidden">
                          <table className="w-full table-fixed text-left border-collapse">
                            <thead>
                              <tr className="bg-[#14B8A6] text-white font-extrabold uppercase tracking-wider text-[8.5px]">
                                <th className="p-2 border-r border-white/20 text-center w-[22%]">Karakteristik</th>
                                <th className="p-2 border-r border-white/20 text-center w-[48%]">Kategori / Detail</th>
                                <th className="p-2 border-r border-white/20 text-center w-[15%]">Jumlah (n)</th>
                                <th className="p-2 text-center w-[15%]">Persentase (%)</th>
                              </tr>
                            </thead>`;

if (fileContent.includes(target1)) {
  fileContent = fileContent.replace(target1, replacement1);
  console.log('Fixed target1!');
} else {
  console.log('Target1 not found, checking alternatives...');
}

// 2. Fix Section C page class (landscape) and columns for Masa Kerja & Jam Kerja
const target2 = `<span>Analisis Demografis & Komparatif (Lanjutan)</span>`;
const replacement2 = `<span>Analisis Demografis & Komparatif (Masa Kerja & Jam Kerja)</span>`;

if (fileContent.includes(target2)) {
  fileContent = fileContent.replace(target2, replacement2);
  console.log('Fixed target2 header!');
}

// 3. Fix Section C container class from word-page to word-page word-page-landscape
const target3 = `{/* LEMBAR 10-C: 3.2.5-C Perbandingan berdasarkan Masa Kerja & Jam Kerja */}
          <div className="w-full flex flex-col items-center">
            <div className="word-page print-page">`;

const replacement3 = `{/* LEMBAR 10-C: 3.2.5-C Perbandingan berdasarkan Masa Kerja & Jam Kerja */}
          <div className="w-full flex flex-col items-center">
            <div className="word-page word-page-landscape print-page">`;

if (fileContent.includes(target3)) {
  fileContent = fileContent.replace(target3, replacement3);
  console.log('Fixed target3 landscape page class!');
}

// 4. Fix Section C table headers & widths for landscape (1123px width)
const target4 = `<th rowSpan={2} className="p-1.5 border-r border-slate-700 text-center align-middle" style={{ width: '5%' }}>No</th>
                            <th rowSpan={2} className="p-1.5 border-r border-slate-700 align-middle" style={{ width: '40%' }}>Dimensi Budaya Keselamatan</th>
                            <th colSpan={4} className="p-1.5 text-center border-r border-slate-700 bg-slate-700" style={{ width: '31.2%' }}>Masa Kerja (Staff Tenure)</th>
                            <th colSpan={3} className="p-1.5 text-center bg-slate-600" style={{ width: '23.8%' }}>Jam Kerja per Minggu</th>
                          </tr>
                          <tr className="bg-slate-700 text-white font-bold text-[7.5px] uppercase border-b border-slate-850 divide-x divide-slate-600">
                            {demografiStats.g1Data.slice(0, 4).map(g1 => (
                              <th key={g1.name} className="p-1 text-center font-medium leading-tight" style={{ width: '7.8%' }}>
                                {g1.name.replace('hingga', '-').replace('atau lebih', '+')}
                              </th>
                            ))}
                            {demografiStats.g3Data.slice(0, 3).map(g3 => (
                              <th key={g3.name} className="p-1 text-center font-medium leading-tight" style={{ width: '7.9%' }}>
                                {g3.name.replace('hingga', '-').replace('atau lebih', '+')}
                              </th>
                            ))}
                          </tr>`;

const replacement4 = `<th rowSpan={2} className="p-1.5 border-r border-slate-700 text-center align-middle" style={{ width: '4%' }}>No</th>
                            <th rowSpan={2} className="p-1.5 border-r border-slate-700 align-middle" style={{ width: '32%' }}>Dimensi Budaya Keselamatan</th>
                            <th colSpan={4} className="p-1.5 text-center border-r border-slate-700 bg-slate-700" style={{ width: '32%' }}>Masa Kerja (Staff Tenure)</th>
                            <th colSpan={4} className="p-1.5 text-center bg-slate-600" style={{ width: '32%' }}>Jam Kerja per Minggu</th>
                          </tr>
                          <tr className="bg-slate-700 text-white font-bold text-[7.5px] uppercase border-b border-slate-850 divide-x divide-slate-600">
                            {demografiStats.g1Data.slice(0, 4).map(g1 => (
                              <th key={g1.name} className="p-1 text-center font-medium leading-tight" style={{ width: '8%' }}>
                                {g1.name.replace('hingga', '-').replace('atau lebih', '+')}
                              </th>
                            ))}
                            {demografiStats.g3Data.slice(0, 4).map(g3 => (
                              <th key={g3.name} className="p-1 text-center font-medium leading-tight" style={{ width: '8%' }}>
                                {g3.name.replace('hingga', '-').replace('atau lebih', '+')}
                              </th>
                            ))}
                          </tr>`;

if (fileContent.includes(target4)) {
  fileContent = fileContent.replace(target4, replacement4);
  console.log('Fixed target4 table headers!');
}

// 5. Fix Section C table body cells widths
const target5 = `<td className="p-1 border-r border-slate-100 text-center font-bold text-slate-700" style={{ width: '5%' }}>{idx + 1}</td>
                                 <td className="p-1 border-r border-slate-100 font-semibold text-slate-800 text-[8.5px] break-words" style={{ width: '40%' }}>{info.nama}</td>
                                 {demografiStats.g1Data.slice(0, 4).map(g1 => {
                                   const val = tObj ? tObj[g1.name] : null;
                                   return (
                                     <td key={g1.name} className="p-1 text-center border-r border-slate-100 font-bold text-teal-800 bg-teal-50/10" style={{ width: '7.8%' }}>
                                       {val !== undefined && val !== null ? \`\${val.toFixed(1)}%\` : '-'}
                                     </td>
                                   );
                                 })}
                                 {demografiStats.g3Data.slice(0, 3).map(g3 => {`;

const replacement5 = `<td className="p-1 border-r border-slate-100 text-center font-bold text-slate-700" style={{ width: '4%' }}>{idx + 1}</td>
                                 <td className="p-1 border-r border-slate-100 font-semibold text-slate-800 text-[8.5px] break-words" style={{ width: '32%' }}>{info.nama}</td>
                                 {demografiStats.g1Data.slice(0, 4).map(g1 => {
                                   const val = tObj ? tObj[g1.name] : null;
                                   return (
                                     <td key={g1.name} className="p-1 text-center border-r border-slate-100 font-bold text-teal-800 bg-teal-50/10" style={{ width: '8%' }}>
                                       {val !== undefined && val !== null ? \`\${val.toFixed(1)}%\` : '-'}
                                     </td>
                                   );
                                 })}
                                 {demografiStats.g3Data.slice(0, 4).map(g3 => {`;

if (fileContent.includes(target5)) {
  fileContent = fileContent.replace(target5, replacement5);
  console.log('Fixed target5 table body!');
}

const target5_2 = `style={{ width: '7.9%' }}`;
if (fileContent.includes(target5_2)) {
  fileContent = fileContent.replaceAll(target5_2, `style={{ width: '8%' }}`);
  console.log('Fixed target5_2 width!');
}

fs.writeFileSync('./components/LaporanTab.tsx', fileContent, 'utf8');
console.log('Done patching LaporanTab.tsx!');
