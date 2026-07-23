const fs = require('fs');

let code = fs.readFileSync('components/AnalisaDataTab.tsx', 'utf8');

const targetStr = `                                 {qStats.map(({ q, stat, stat2, bmStat }) => (
                                   <div key={q.id} className="flex flex-col lg:flex-row gap-6 lg:items-center">
                                     {/* Question Code & Text */}
                                     <div className="lg:w-[45%] flex gap-5">
                                       <div className="flex flex-col items-center">
                                         <span className="text-[15px] font-black text-indigo-600 leading-none">{q.code}{q.isReversed && !q.code.endsWith('R') ? 'R' : ''}</span>
                                         <div className="w-5 h-0.5 bg-indigo-600 mt-2 rounded-full"></div>
                                       </div>
                                       <p className="text-[14px] font-bold text-slate-700 leading-[1.6]">{q.text}</p>
                                     </div>

                                     {/* Bar Chart and N/A label */}
                                     <div className="flex-1 flex flex-col gap-3">
                                       <div className="flex items-center gap-4">
                                         {mode === 'Perbandingan' && <span className="text-[10px] text-slate-400 w-12 shrink-0 font-bold text-right">Thn {tahun1}</span>}
                                         <div className={\`flex-1 \${mode === 'Tunggal' ? 'h-10' : 'h-8'} flex rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/60 shadow-inner relative\`}>
                                           <div 
                                             className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-700 ease-out"
                                             style={{ width: \`\${stat.posPercent}%\` }}
                                           >
                                             {stat.posPercent >= 10 && <span className="text-[10px] font-black text-white">{stat.posPercent}%</span>}
                                           </div>
                                           <div 
                                             className="h-full bg-yellow-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                             style={{ width: \`\${stat.neuPercent}%\` }}
                                           >
                                             {stat.neuPercent >= 10 && <span className="text-[10px] font-black text-white">{stat.neuPercent}%</span>}
                                           </div>
                                           <div 
                                             className="h-full bg-rose-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                             style={{ width: \`\${stat.negPercent}%\` }}
                                           >
                                             {stat.negPercent >= 10 && <span className="text-[10px] font-black text-white">{stat.negPercent}%</span>}
                                           </div>
                                         </div>

                                         <div className="flex items-center gap-2 min-w-[140px] shrink-0">
                                           <div className="w-2 h-4 bg-slate-400 rounded-full"></div>
                                           <div className="leading-tight">
                                             <p className="text-[10px] text-slate-400 font-bold leading-tight">Tidak Menjawab /</p>
                                             <p className="text-[10px] text-slate-400 font-bold leading-tight">Tidak Tahu <span className="text-slate-800 font-black">{stat.missingPercent}%</span></p>
                                           </div>
                                         </div>
                                       </div>

                                       {mode === 'Perbandingan' && stat2 && (
                                         <div className="flex items-center gap-4">
                                           <span className="text-[10px] text-slate-400 w-12 shrink-0 font-bold text-right">Thn {tahun2}</span>
                                           <div className="flex-1 h-8 flex rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/60 shadow-inner relative opacity-80">
                                             <div 
                                               className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-700 ease-out"
                                               style={{ width: \`\${stat2.posPercent}%\` }}
                                             >
                                               {stat2.posPercent >= 10 && <span className="text-[10px] font-black text-white">{stat2.posPercent}%</span>}
                                             </div>
                                             <div 
                                               className="h-full bg-yellow-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                               style={{ width: \`\${stat2.neuPercent}%\` }}
                                             >
                                               {stat2.neuPercent >= 10 && <span className="text-[10px] font-black text-white">{stat2.neuPercent}%</span>}
                                             </div>
                                             <div 
                                               className="h-full bg-rose-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                               style={{ width: \`\${stat2.negPercent}%\` }}
                                             >
                                               {stat2.negPercent >= 10 && <span className="text-[10px] font-black text-white">{stat2.negPercent}%</span>}
                                             </div>
                                           </div>

                                           <div className="flex items-center gap-2 min-w-[140px] shrink-0">
                                             <div className="w-2 h-4 bg-slate-400 rounded-full"></div>
                                             <div className="leading-tight">
                                               <p className="text-[10px] text-slate-400 font-bold leading-tight">Tidak Menjawab /</p>
                                               <p className="text-[10px] text-slate-400 font-bold leading-tight">Tidak Tahu <span className="text-slate-800 font-black">{stat2.missingPercent}%</span></p>
                                             </div>
                                           </div>
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 ))`;

const replacementStr = `                                 {qStats.map(({ q, stat, stat2, bmStat }) => (
                                   <div key={q.id} className="flex flex-col lg:flex-row gap-6 lg:items-center">
                                     {/* Question Code & Text */}
                                     <div className="lg:w-[40%] flex gap-5">
                                       <div className="flex flex-col items-center">
                                         <span className="text-[15px] font-black text-indigo-600 leading-none">{q.code}{q.isReversed && !q.code.endsWith('R') ? 'R' : ''}</span>
                                         <div className="w-5 h-0.5 bg-indigo-600 mt-2 rounded-full"></div>
                                       </div>
                                       <p className="text-[14px] font-bold text-slate-700 leading-[1.6]">{q.text}</p>
                                     </div>

                                     {/* Bar Chart and N/A label */}
                                     <div className="flex-1 flex flex-col gap-2.5">
                                       {/* RS Anda Bar */}
                                       <div className="flex items-center gap-3">
                                         <span className="text-[11px] font-bold text-blue-900 w-28 shrink-0 text-right">Rumah Sakit Anda</span>
                                         <div className="flex-1 h-7 flex rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60 shadow-inner relative">
                                           <div 
                                             className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-700 ease-out"
                                             style={{ width: \`\${stat.posPercent}%\` }}
                                           >
                                             {stat.posPercent >= 10 && <span className="text-[10px] font-black text-white">{stat.posPercent}%</span>}
                                           </div>
                                           <div 
                                             className="h-full bg-yellow-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                             style={{ width: \`\${stat.neuPercent}%\` }}
                                           >
                                             {stat.neuPercent >= 10 && <span className="text-[10px] font-black text-white">{stat.neuPercent}%</span>}
                                           </div>
                                           <div 
                                             className="h-full bg-rose-500 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                             style={{ width: \`\${stat.negPercent}%\` }}
                                           >
                                             {stat.negPercent >= 10 && <span className="text-[10px] font-black text-white">{stat.negPercent}%</span>}
                                           </div>
                                         </div>

                                         <div className="flex items-center gap-1.5 min-w-[100px] shrink-0">
                                           <div className="w-1.5 h-3.5 bg-slate-400 rounded-full"></div>
                                           <p className="text-[10px] text-slate-500 font-medium">N/A <span className="text-slate-800 font-bold">{stat.missingPercent}%</span></p>
                                         </div>
                                       </div>

                                       {/* Benchmark Bar */}
                                       <div className="flex items-center gap-3">
                                         <span className="text-[11px] font-bold text-emerald-800 w-28 shrink-0 text-right truncate" title={activeBenchmarkLabel}>
                                           {activeBenchmarkLabel}
                                         </span>
                                         <div className="flex-1 h-7 flex rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60 shadow-inner relative opacity-90">
                                           <div 
                                             className="h-full bg-emerald-600 flex items-center justify-center transition-all duration-700 ease-out"
                                             style={{ width: \`\${bmStat.posPercent}%\` }}
                                           >
                                             {bmStat.posPercent >= 10 && <span className="text-[10px] font-black text-white">{bmStat.posPercent}%</span>}
                                           </div>
                                           <div 
                                             className="h-full bg-yellow-600 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                             style={{ width: \`\${bmStat.neuPercent}%\` }}
                                           >
                                             {bmStat.neuPercent >= 10 && <span className="text-[10px] font-black text-white">{bmStat.neuPercent}%</span>}
                                           </div>
                                           <div 
                                             className="h-full bg-rose-600 flex items-center justify-center transition-all duration-700 ease-out border-l border-white/20"
                                             style={{ width: \`\${bmStat.negPercent}%\` }}
                                           >
                                             {bmStat.negPercent >= 10 && <span className="text-[10px] font-black text-white">{bmStat.negPercent}%</span>}
                                           </div>
                                         </div>

                                         <div className="flex items-center gap-1.5 min-w-[100px] shrink-0">
                                           <div className="w-1.5 h-3.5 bg-slate-400 rounded-full"></div>
                                           <p className="text-[10px] text-slate-500 font-medium">N/A <span className="text-slate-800 font-bold">{bmStat.missingPercent}%</span></p>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 ))}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('components/AnalisaDataTab.tsx', code, 'utf8');
  console.log('SUCCESS PART 2 (item bars)');
} else {
  console.log('Target string for item bars not found!');
}
