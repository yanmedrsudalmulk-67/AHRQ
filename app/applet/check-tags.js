const fs = require('fs');
const content = fs.readFileSync('components/LaporanTab.tsx', 'utf8');
const stack = [];
const htmlTags = ['div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'section', 'ul', 'li', 'ol', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'button', 'select', 'option', 'svg', 'path', 'circle', 'rect', 'defs', 'pattern', 'lineargradient', 'stop'];
const regex = /<(\/?[a-z1-6]+)(?=[\s>\/])/gi;
let match;
while ((match = regex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    if (['img', 'br', 'hr', 'input', 'link', 'meta'].includes(tag)) continue;
    if (!htmlTags.includes(tag.replace('/', ''))) continue;
    if (tag.startsWith('/')) {
        const openTag = tag.slice(1);
        if (stack.length === 0) {
            console.log('Extra close tag </' + openTag + '> at line ' + content.substring(0, match.index).split('\n').length);
        } else {
            const top = stack.pop();
            if (top.tag !== openTag) {
                console.log('Mismatch: expected </' + top.tag + '> (from line ' + top.line + ') but found </' + openTag + '> at line ' + content.substring(0, match.index).split('\n').length);
            }
        }
    } else {
        const rest = content.substring(match.index + match[0].length);
        const endOfTag = rest.indexOf('>');
        if (rest[endOfTag - 1] === '/') continue; // self closing
        stack.push({ tag, line: content.substring(0, match.index).split('\n').length });
    }
}
console.log('Remaining unclosed tags:', stack.length);
stack.forEach(s => console.log(s.tag + ' at line ' + s.line));
