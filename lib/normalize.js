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

    // 2. Remove indentação de 4+ espaços (code block acidental)
    //    Mantém indentação dentro de tabelas e listas
    t = t.replace(/^( {4,})(?!\||- |• |\* |\d+\. |✅|❌|⚠️|🔴|📋|☑|☐)/gm, (match) => {
        // Preserva indentação em blocos de exemplo (indented code blocks intencionais)
        // Detecta se é parte de um bloco contínuo indentado
        return '    '; // Normaliza para 4 espaços (padrão markdown code block)
    });

    // 3. Garantir separador entre seções (### SEÇÃO)
    t = t.replace(/([^\n])\n(### \*\*SEÇÃO)/g, '$1\n\n* * *\n\n$2');

    // 4. Garantir linha em branco antes e depois de headers
    t = t.replace(/([^\n])\n(#{1,4} )/g, '$1\n\n$2');
    t = t.replace(/(#{1,4} [^\n]+)\n([^\n#*])/g, '$1\n\n$2');

    // 5. Garantir linha em branco antes de tabelas
    t = t.replace(/([^\n|])\n(\|[^|]+\|)/g, '$1\n\n$2');

    // 6. Normalizar tabelas — espaço ao redor dos valores nas células
    t = t.replace(/\|([^\n|]+)/g, (match, cell) => {
        // Não tocar na linha de separadores (---|---|---)
        if (/^-+$/.test(cell.trim())) return match;
        // Adicionar espaços ao redor do conteúdo da célula
        const trimmed = cell.trim();
        if (!trimmed) return '| ';
        return `| ${trimmed} `;
    });

    // 7. Garantir \n\n entre blocos diferentes (parágrafo + lista, tabela + parágrafo)
    t = t.replace(/([^\n])\n(- \*\*)/g, '$1\n\n$2');
    t = t.replace(/([^\n])\n(\*\*\d+\.\d+)/g, '$1\n\n$2');

    // 8. Normalizar separadores de seção
    t = t.replace(/^---$/gm, '* * *');
    t = t.replace(/^\*\*\*$/gm, '* * *');

    // 9. Limpar linhas em branco excessivas (máx. 2 seguidas)
    t = t.replace(/\n{4,}/g, '\n\n\n');

    // 10. Trim final
    t = t.trim();

    return t;
}
