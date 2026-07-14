const fs = require('fs');
const path = require('path');

const map = {
  // text colors
  'text-white': 'text-slate-900 dark:text-white',
  'text-slate-100': 'text-slate-800 dark:text-slate-100',
  'text-slate-200': 'text-slate-700 dark:text-slate-200',
  'text-slate-300': 'text-slate-600 dark:text-slate-300',
  'text-slate-400': 'text-slate-500 dark:text-slate-400',
  'text-slate-500': 'text-slate-400 dark:text-slate-500',
  'hover:text-white': 'hover:text-slate-900 dark:hover:text-white',
  
  // specific colors
  'text-indigo-300': 'text-indigo-700 dark:text-indigo-300',
  'text-indigo-400': 'text-indigo-600 dark:text-indigo-400',
  'text-cyan-300': 'text-cyan-700 dark:text-cyan-300',
  'text-cyan-400': 'text-cyan-600 dark:text-cyan-400',
  'text-cyan-500': 'text-cyan-600 dark:text-cyan-500',
  'text-emerald-400': 'text-emerald-600 dark:text-emerald-400',
  'text-amber-400': 'text-amber-600 dark:text-amber-400',
  'text-yellow-400': 'text-yellow-600 dark:text-yellow-400',
  'text-rose-400': 'text-rose-600 dark:text-rose-400',
  'text-red-400': 'text-red-600 dark:text-red-400',

  // backgrounds
  'bg-\\[#0B101E\\]': 'bg-slate-50 dark:bg-[#0B101E]',
  'bg-slate-950\\/30': 'bg-white/50 dark:bg-slate-950/30',
  'bg-slate-950\\/40': 'bg-white/60 dark:bg-slate-950/40',
  'bg-slate-950\\/50': 'bg-white/70 dark:bg-slate-950/50',
  'bg-slate-950\\/60': 'bg-white/80 dark:bg-slate-950/60',
  'bg-slate-950': 'bg-white dark:bg-slate-950',
  
  'bg-slate-900\\/30': 'bg-white/50 dark:bg-slate-900/30',
  'bg-slate-900\\/40': 'bg-white/60 dark:bg-slate-900/40',
  'bg-slate-900\\/50': 'bg-white/70 dark:bg-slate-900/50',
  'bg-slate-900\\/60': 'bg-white/80 dark:bg-slate-900/60',
  'bg-slate-900\\/80': 'bg-white/90 dark:bg-slate-900/80',
  'bg-slate-900': 'bg-white dark:bg-slate-900',

  'bg-slate-800\\/50': 'bg-slate-100/80 dark:bg-slate-800/50',
  'bg-slate-800': 'bg-slate-100 dark:bg-slate-800',
  'hover:bg-slate-800': 'hover:bg-slate-100 dark:hover:bg-slate-800',
  'hover:bg-slate-700': 'hover:bg-slate-200 dark:hover:bg-slate-700',

  'bg-\\[#121826\\]\\/90': 'bg-white/90 dark:bg-[#121826]/90',
  'bg-\\[#121826\\]\\/80': 'bg-white/80 dark:bg-[#121826]/80',

  'bg-white\\/\\[0\\.01\\]': 'bg-slate-900/[0.01] dark:bg-white/[0.01]',
  'bg-white\\/\\[0\\.02\\]': 'bg-slate-900/[0.02] dark:bg-white/[0.02]',
  'bg-white\\/\\[0\\.03\\]': 'bg-slate-900/[0.03] dark:bg-white/[0.03]',
  'bg-white\\/\\[0\\.04\\]': 'bg-slate-900/[0.04] dark:bg-white/[0.04]',
  'bg-white\\/\\[0\\.05\\]': 'bg-slate-900/[0.05] dark:bg-white/[0.05]',
  'bg-white\\/\\[0\\.07\\]': 'bg-slate-900/[0.07] dark:bg-white/[0.07]',
  'bg-white\\/5': 'bg-slate-900/5 dark:bg-white/5',
  'bg-white\\/10': 'bg-slate-900/10 dark:bg-white/10',

  'bg-\\[#0c1a36\\]\\/60': 'bg-emerald-50 dark:bg-[#0c1a36]/60',
  'bg-\\[#0c1a36\\]\\/80': 'bg-white dark:bg-[#0c1a36]/80',
  'bg-\\[#0c1a36\\]\\/20': 'bg-slate-50 dark:bg-[#0c1a36]/20',

  'bg-indigo-950\\/40': 'bg-indigo-50 dark:bg-indigo-950/40',
  'bg-indigo-950\\/20': 'bg-indigo-50/50 dark:bg-indigo-950/20',
  
  'bg-cyan-950\\/30': 'bg-cyan-50 dark:bg-cyan-950/30',

  'bg-black\\/80': 'bg-slate-900/20 dark:bg-black/80',
  'bg-black\\/60': 'bg-slate-900/10 dark:bg-black/60',
  'bg-black\\/40': 'bg-slate-900/5 dark:bg-black/40',
  'bg-black\\/20': 'bg-slate-900/5 dark:bg-black/20',

  // borders
  'border-slate-800\\/80': 'border-slate-200 dark:border-slate-800/80',
  'border-slate-800': 'border-slate-200 dark:border-slate-800',
  'border-slate-700\\/50': 'border-slate-300/50 dark:border-slate-700/50',
  'border-white\\/10': 'border-slate-200 dark:border-white/10',
  'border-white\\/5': 'border-slate-100 dark:border-white/5',
  'border-white\\/20': 'border-slate-300 dark:border-white/20',
  'border-white\\/\\[0\\.08\\]': 'border-slate-200 dark:border-white/[0.08]',
  'border-white\\/\\[0\\.05\\]': 'border-slate-100 dark:border-white/[0.05]',
  
  'divide-white\\/5': 'divide-slate-200 dark:divide-white/5',
  'divide-white\\/\\[0\\.05\\]': 'divide-slate-200 dark:divide-white/[0.05]',
};

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const [key, value] of Object.entries(map)) {
    // We use a negative lookbehind to avoid replacing if it already starts with dark:
    // and negative lookahead for non-word boundary if needed. 
    // Since javascript regex doesn't support arbitrary lookbehind easily with dynamic length,
    // we can use a custom replacer.
    const regex = new RegExp(`(?<!dark:)(?<![\\w\\-])(${key})(?![\\w\\-\\/])`, 'g');
    content = content.replace(regex, value);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      patchFile(fullPath);
    }
  }
}

walk('./components');
walk('./app');
