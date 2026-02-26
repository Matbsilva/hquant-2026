/**
 * normalizeComposition(raw) — Normaliza markdown antes de salvar no Supabase.
 * Resolve o problema de "wall-of-text" padronizando a formatação
 * independente da IA de origem (Claude, Gemini, ChatGPT, etc.)
 */
export function normalizeComposition(raw) {
    if (!raw) return '';
    let t = raw;

    // 1. Normalizar line endings
    t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // FIX: Force linebreaks before metadata keys that Gemini frequently glues together
    t = t.replace(/.(\*\*(?:TÍTULO|DATA|TURNO|GRUPO|TAGS|CLASSIFICAÇÃO|COMPOSIÇÃO DA EQUIPE|UNIDADE|CÓDIGO|QUANTIDADE REF):\*\*)/gi, (match, key) => {
        const prefix = match[0];
        if (prefix === '\n') return match;
        return `${prefix}\n${key}`;
    });

    // FIX: Another pass for non-bold metadata keys glued together
    t = t.replace(/(.)(?=(?:TÍTULO|DATA|TURNO|GRUPO|TAGS|CLASSIFICAÇÃO|COMPOSIÇÃO DA EQUIPE|UNIDADE|CÓDIGO|QUANTIDADE REF): )/g, (match, prefix) => {
        if (prefix === '\n' || prefix === '*') return match;
        if (prefix === ' ' || prefix === '|') return match;
        return match;
    });

    // 2. Remove indentação de 4+ espaços APENAS fora de tabelas
    // Preserva linhas que começam com | (são linhas de tabela indentadas)
    t = t.replace(/^( {4,})(.)/gm, (match, spaces, firstChar) => {
        // Preserve pipe-started lines (table rows) and separator lines
        if (firstChar === '|') return match;
        return firstChar;
    });

    // 3. Garantir separador entre seções (### SEÇÃO)
    t = t.replace(/([^\n])\n(### \*\*SEÇÃO)/g, '$1\n\n* * *\n\n$2');

    // 4. Garantir linha em branco antes e depois de headers
    t = t.replace(/([^\n])\n(#{1,4} )/g, '$1\n\n$2');
    t = t.replace(/(#{1,4} [^\n]+)\n([^\n#*|])/g, '$1\n\n$2');

    // 5. Garantir linha em branco antes de tabelas (PRIMEIRA linha da tabela apenas)
    // NÃO inserir blank line entre linhas consecutivas de tabela (evita quebrar header|separator)
    t = t.replace(/([^\n|])\n(\|[^|]+\|)/g, (match, pre, tbl) => {
        // Check if previous line is also a table line (ends with |)
        return `${pre}\n\n${tbl}`;
    });

    // 5b. Remove blank lines BETWEEN consecutive table rows (fix for header|blank|separator bug)
    t = t.replace(/(\|[^\n]+\|)\n\n+(\|[^\n]+\|)/g, '$1\n$2');

    // 6. Normalizar espaçamento dentro de células de tabela
    t = t.replace(/\|([^\n|]+)/g, (match, cell) => {
        // Don't touch separator lines
        if (/^[-:]+$/.test(cell.trim())) return match;
        // Don't touch long separator lines (e.g. | ------------ |)
        if (/^[\s-]+$/.test(cell)) return match;
        const trimmed = cell.trim();
        if (!trimmed) return '| ';
        return `| ${trimmed} `;
    });

    // 7. Garantir \n\n entre blocos diferentes
    t = t.replace(/([^\n])\n(- \*\*)/g, '$1\n\n$2');
    t = t.replace(/([^\n])\n(\*\*\d+\.\d+)/g, '$1\n\n$2');

    // 8. Normalizar separadores de seção
    t = t.replace(/^---$/gm, '* * *');
    t = t.replace(/^\*\*\*$/gm, '* * *');

    // 9. Limpar linhas em branco excessivas
    t = t.replace(/\n{4,}/g, '\n\n\n');

    t = t.trim();
    return t;
}
