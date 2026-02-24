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
    t = t.replace(/(.)(\*\*(?:TÍTULO|DATA|TURNO|GRUPO|TAGS|CLASSIFICAÇÃO|COMPOSIÇÃO DA EQUIPE|UNIDADE|CÓDIGO|QUANTIDADE REF):\*\*)/gi, (match, prefix, key) => {
        if (prefix === '\n') return match;
        return `${prefix}\n${key}`;
    });

    // FIX: Another pass for non-bold metadata keys glued together
    t = t.replace(/(.)(?=(?:TÍTULO|DATA|TURNO|GRUPO|TAGS|CLASSIFICAÇÃO|COMPOSIÇÃO DA EQUIPE|UNIDADE|CÓDIGO|QUANTIDADE REF): )/g, (match, prefix) => {
        if (prefix === '\n' || prefix === '*') return match;
        if (prefix === ' ' || prefix === '|') return match; // might be in the same line like "CÓDIGO: X | UNIDADE: Y"
        // Safest approach: don't alter non-bold keys because it could break inside text. The bold ones above are the real issue.
        return match;
    });

    // 2. Remove indentação de 4+ espaços (code block acidental) e zera para a margem
    // Para resolver o problema de cópia com ruído
    t = t.replace(/^( {4,})/gm, '');

    // 3. Garantir separador entre seções (### SEÇÃO)
    t = t.replace(/([^\n])\n(### \*\*SEÇÃO)/g, '$1\n\n* * *\n\n$2');

    // 4. Garantir linha em branco antes e depois de headers
    t = t.replace(/([^\n])\n(#{1,4} )/g, '$1\n\n$2');
    t = t.replace(/(#{1,4} [^\n]+)\n([^\n#*])/g, '$1\n\n$2');

    // 5. Garantir linha em branco antes de tabelas
    t = t.replace(/([^\n|])\n(\|[^|]+\|)/g, '$1\n\n$2');

    // 6. Normalizar tabelas
    t = t.replace(/\|([^\n|]+)/g, (match, cell) => {
        if (/^-+$/.test(cell.trim())) return match;
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
