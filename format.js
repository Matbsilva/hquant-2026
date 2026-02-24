const fs = require('fs');
let content = fs.readFileSync('PROMPT-COMPOSICAO-V4.md', 'utf8');

const regex = /^( {4})([a-zA-Z0-9\-\•✅❌🔴⚠️])/gm;
// We actually want to replace all 4-space indents that are not inside HTML or special blocks,
// but an easier way is to just add a strict explicit instruction at the top of the prompt.
// Let's just prepend the rule.
const formatRule = `
> ⚠️ **REGRA DE FORMATAÇÃO DO MARKDOWN (MUITO IMPORTANTE!)**:
> O cliente odeia textos dentro de "blocos de código" (code blocks) ou "wall-of-text".
> **PROIBIDO** indentar parágrafos de texto com 4 espaços antes da linha.
> **PROIBIDO** criar longos parágrafos de texto denso.
> **Sempre** use a estrutura de listas com marcadores (bullet points: \`-\` ou \`•\` ou \`▸\`) para descrever Escopo, Método, Incluso, etc.
> Títulos de subseções podem ser mantidos (ex: \`#### 1.1 ESCOPO DETALHADO\`), mas o conteúdo abaixo deve vir encostado na margem esquerda, preferencialmente itemizado em bullet points.
> Mantenha a legibilidade "Padrão Ouro", que é ágil para leitura dinâmica.

`;

content = content.replace('## 🎯 INSTRUÇÕES CRÍTICAS\n', '## 🎯 INSTRUÇÕES CRÍTICAS\n' + formatRule);

// Let's also remove 4-space indentations from the prompt examples to lead by example
let lines = content.split('\n');
let newLines = [];
let insideExample = false;
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.match(/^    [a-zA-Z0-9\-•✅❌🔴⚠️]/)) {
        line = line.replace(/^    /, '');
    }
    newLines.push(line);
}

fs.writeFileSync('PROMPT-COMPOSICAO-V4.md', newLines.join('\n'));
console.log('Prompt updated!');
