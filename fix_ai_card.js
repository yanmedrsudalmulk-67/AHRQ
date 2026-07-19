const fs = require('fs');
let content = fs.readFileSync('components/AnalisaDataTab.tsx', 'utf8');

content = content.replace(
  /id: 'ai',\s*title: 'Analisis AI & Prediksi Tren',\s*description: 'Interpretasi cerdas hasil survei dan rekomendasi perbaikan menggunakan AI.',\s*icon: <Brain className="w-8 h-8 text-indigo-600" \/>,\s*color: 'from-indigo-500 to-blue-700',\s*dataCount: 0 \/\/ Special case/,
  `id: 'benchmark',
      title: 'Hasil Perbandingan Dengan Rumah Sakit Percontohan',
      description: 'Analisis komparatif hasil survei dengan rumah sakit percontohan.',
      icon: <Award className="w-8 h-8 text-indigo-600" />,
      color: 'from-indigo-500 to-blue-700',
      dataCount: 4 // Special case`
);

fs.writeFileSync('components/AnalisaDataTab.tsx', content);
