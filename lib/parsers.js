/**
 * Pure parsing functions extracted from page.js for testability.
 * These are the same functions used at runtime — page.js imports from here.
 */

// --- HELPERS ---
const cleanMd = (s) => {
    if (!s) return '';
    let str = s.replace(/[*#]/g, '').trim();
    const cutIdx = str.search(/(?:DATA:|TURNO:|GRUPO:|TAGS:|CLASSIFICAÇÃO:)/i);
    if (cutIdx > 15) return str.substring(0, cutIdx).trim();
    return str;
};

const parseNum = (s) => {
    if (!s) return null;
    const n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
};

// --- PARSER ---
function parseComp(text) {
    const ex = (patt) => { const m = text.match(patt); return m ? m[1].trim() : ''; };
    const rp = (v) => v ? parseNum(v.replace(/R\$\s*/, '')) : null;

    const codigo = ex(/COMPOSIÇÃO:\s*([A-Z0-9][\w-]+)/i)
        || ex(/\*\*CÓDIGO:\*\*\s*(.+?)(?:\s*\||\s*$)/im)
        || ex(/CÓDIGO:\s*(.+?)(?:\s*\||\s*$)/im)
        || ex(/COMPOSIÇÃO:\s*(.+)/i);

    let titulo = null;
    const tituloM2 = text.match(/(?:\*\*TÍTULO:\*\*|TÍTULO:)\s*(.+?)(?:\s*$|\||\n)/im);
    if (tituloM2) {
        titulo = tituloM2[1].trim();
    } else {
        const tituloM = text.match(/(?:🛠️|🏗️)?\s*COMPOSIÇÃO[^-]*-\s*(.+)/i)
            || text.match(/(?:🛠️|🏗️)?\s*ITEM\s*[\d.]+:\s*(.+)/i);
        if (tituloM) titulo = tituloM[1].trim();
    }

    const unidadeM = text.match(/(?:\*\*UNIDADE:\*\*|UNIDADE:)\s*(.+?)(?:\s*\||\s*$)/im);
    const unidade = unidadeM ? unidadeM[1].trim() : '';

    const qrefM = text.match(/(?:\*\*QUANTIDADE (?:REF|DE REFERÊNCIA):\*\*|QUANTIDADE (?:REF|DE REFERÊNCIA):)\s*(.+?)(?:\s*\||\s*$)/im)
        || text.match(/(?:\*\*REFERÊNCIA:\*\*|REFERÊNCIA:)\s*(.+?)(?:\s*\||\s*$)/im);
    const qref = qrefM ? qrefM[1].trim() : '';

    const grupo = ex(/\*\*GRUPO:\*\*\s*(.+?)(?:\s*\||\s*$)/im) || ex(/GRUPO:\s*(.+?)(?:\s*\||\s*$)/im);
    const tagsR = ex(/\*\*TAGS:\*\*\s*(.+)/i) || ex(/TAGS:\s*(.+)/i);
    const tags = tagsR ? tagsR.split(',').map(t => t.trim().replace(/^#/, '').replace(/\*\*/g, '')).filter(Boolean) : [];

    let custo = null, hh = null;

    const allLines = text.split('\n');
    let custoRow = allLines.find(l => /\|\s*\*\*CUSTO DIRETO TOTAL/i.test(l));
    if (custoRow) {
        const rMatch = custoRow.match(/R\$\s*([\d.,]+)/g);
        custo = rMatch && rMatch.length >= 1 ? parseNum(rMatch[0].replace(/R\$\s*/, '')) : null;
    }
    if (!custo) {
        const cM = text.match(/\*\*CUSTO DIRETO TOTAL\*\*[^R]*R\$\s*([\d.,]+)/i) || text.match(/CUSTO DIRETO TOTAL[^R]*R\$\s*([\d.,]+)/i);
        custo = cM ? parseNum(cM[1]) : null;
    }

    const sec3Start = allLines.findIndex(l => l.includes('SEÇÃO 3') || l.includes('ESTIMATIVA DE MÃO DE OBRA'));
    const sec4Start = allLines.findIndex(l => l.includes('SEÇÃO 4') || l.includes('QUANTITATIVOS'));
    const searchEnd = sec4Start > -1 ? sec4Start : allLines.length;
    const searchStart = sec3Start > -1 ? sec3Start : 0;

    for (let i = searchStart; i < searchEnd; i++) {
        const l = allLines[i];
        if (/\|\s*\*\*TOTAL M\.O/i.test(l)) {
            const cols = l.split('|').map(x => x.replace(/\*\*/g, '').trim()).filter(Boolean);
            const numVals = cols.filter(c => /^[\d.,]+\s*(HH)?$/.test(c.trim()));
            if (numVals.length > 0) {
                const cleanVals = numVals.filter(c => !c.toLowerCase().includes('hh'));
                const targetStr = cleanVals.length > 0 ? cleanVals[cleanVals.length - 1] : numVals[numVals.length - 1].replace(/\s*HH$/i, '');
                hh = parseNum(targetStr);
            }
            break;
        }
    }

    if (!hh) {
        const hM = text.match(/\*\*TOTAL M\.O\.\*\*[^|]*\|\s*\*\*([\d.,]+)\*\*/) || text.match(/TOTAL M\.O\.\/.*?([\d.,]+)/i);
        hh = hM ? parseNum(hM[1]) : null;
    }

    return { codigo, titulo, unidade, grupo, qref, tags, custo, hh };
}

// --- EXTENDED PARSER (for detail view) ---
function parseCompDetail(text) {
    if (!text) return {};
    const rp = (v) => v ? parseNum(v.replace(/R\$\s*/, '')) : null;

    const isSeparator = (l) => {
        const stripped = l.replace(/[\s|:\-]/g, '');
        return stripped.length === 0 && l.includes('-');
    };

    let custo_material = null, peso_total = null;
    const matRow = text.split('\n').find(l => /\|\s*\*\*SUBTOTAL/i.test(l));
    if (matRow) {
        const vals = matRow.match(/R\$\s*([\d.,]+)/g);
        custo_material = vals && vals.length >= 1 ? rp(vals[0]) : null;
        if (matRow.includes('|')) {
            const cols = matRow.split('|');
            const lastItem = cols[cols.length - 2].replace(/\*\*/g, '').trim();
            if (/^[\d.,]+$/.test(lastItem)) peso_total = parseNum(lastItem);
        }
    }

    let custo_mo = null;
    const moRow = text.split('\n').find(l => /\|\s*\*\*TOTAL M\.O/i.test(l));
    if (moRow) {
        const vals = moRow.match(/R\$\s*([\d.,]+)/g);
        custo_mo = vals && vals.length >= 1 ? rp(vals[0]) : null;
    }

    let custo_equip = null;
    const lines = text.split('\n');
    const sec2StartIndex = lines.findIndex(l => l.includes('SEÇÃO 2') || l.includes('TABELA UNIFICADA'));
    const sec3StartIndex = lines.findIndex(l => l.includes('SEÇÃO 3') || l.includes('ESTIMATIVA DE MÃO DE OBRA'));
    const sec4StartIndex = lines.findIndex(l => l.includes('SEÇÃO 4') || l.includes('QUANTITATIVOS'));

    if (sec2StartIndex > -1) {
        const end = sec3StartIndex > -1 ? sec3StartIndex : lines.length;
        let eqSum = 0;
        for (let i = sec2StartIndex; i < end; i++) {
            if (lines[i].match(/\|\s*(Equip\b|Ferramentas\b|Andaime\b|Betoneira\b|Martelete\b|Nível\s*Laser\b)/i)) {
                // A Regex antes procurava qualquer R$, mas isso pegava o Valor Unit ou o Valor Total aleatoriamente dependendo de quantos R$ tinham na linha.
                // Colunas Típicas V8: | Cat | Desc | Unid | Qtd Pura | % Perda | Qtd c/ Perdas | Valor Unit. (R$) | Valor Total (R$) | Peso |

                // Primeiro, limpamos as colunas e pegamos as que tem R$
                const cols = lines[i].split('|').map(c => c.trim()).filter(Boolean);

                // Procurar pela coluna de "Qtd c/ Perdas" para multiplicar pelo Valor Unitário (se for Custo Direto)
                // O problema é que o "Valor Total" explodido já estava calculado errado lá? Ou o Parser extraiu o Valor Total no lugar do Unit?
                // O Relato dizia: "O total explodiu... estava multiplicando/somando fatores errados na Seção 5".
                // De fato, na aba detalhada, "custo_equip" é a soma dos EQUIPAMENTOS listados.

                // Se a linha tem R$, o valor correto de EQUIPAMENTO PARA O SUBTOTAL é o "Valor Total" DO EQUIPAMENTO (vezes a Quantidade, que a Tabela V8 já multiplicou).
                // Mas na linha do Markdown V8: | Equip | Betoneira | dia | 0,02 | 0% | 0,02 | R$ 120,00 | R$ 2,40 | 0,00 |
                // O valor total que custa para a composição é o "R$ 2,40".
                // Se o match[1] do antigo código pegasse R$ 2,40 estaria certo. Se pegasse R$ 120,00 explodiria (100x maior).

                const match = lines[i].match(/R\$\s*([\d.,]+)/g);
                if (match) {
                    // match[0] = R$ 120,00 (Valor Unit)
                    // match[1] = R$ 2,40 (Valor Total do Equipamento)
                    // Se houver 2 "R$", pegamos o ÚLTIMO (que sempre é o Valor Total embutido na tabela).
                    const valorTotalEquip = rp(match[match.length - 1]);
                    eqSum += valorTotalEquip;
                }
            }
        }
        if (eqSum > 0) custo_equip = eqSum;
    }

    const hhProfs = [];
    if (sec3StartIndex > -1) {
        const end = sec4StartIndex > -1 ? sec4StartIndex : lines.length;
        for (let i = sec3StartIndex; i < end; i++) {
            const l = lines[i];
            if (!l.includes('|')) continue;
            if (isSeparator(l)) continue;
            if (/Função|TOTAL M\.O\.|HH Base|HH Ajustado/i.test(l)) continue;
            const cols = l.split('|').map(x => x.replace(/\*\*/g, '').trim()).filter(Boolean);
            if (cols.length >= 4) {
                const nome = cols[0];
                if (/^[\d\-]+$/.test(nome.trim())) continue;
                const numVals = cols.filter(c => /^[\d.,]+\s*(HH)?$/.test(c.trim()));
                if (nome && numVals.length > 0) {
                    const cleanVals = numVals.filter(c => !c.toLowerCase().includes('hh'));
                    const targetStr = cleanVals.length > 0 ? cleanVals[cleanVals.length - 1] : numVals[numVals.length - 1].replace(/\s*HH$/i, '');
                    hhProfs.push({ nome, hh: parseNum(targetStr) });
                }
            }
        }
    }

    const equipeM = text.match(/(?:equipe|COMPOSIÇÃO DA EQUIPE)[^:]*:\s*\*\*?([^\n\*\|]+)/i);
    let equipe = equipeM ? cleanMd(equipeM[1]) : (hhProfs.length > 0 ? hhProfs.map(pr => `1 ${pr.nome}`).join(' + ') : null);

    const rendM = text.match(/(?:Rendimento|Produtividade.*?Diária.*?):?\s*\*\*?([\d.,]+\s*[A-Za-z\u00c0-\u00fa\u00b2\u00b3/]+(?:\/dia)?)/i);
    const rendimento = rendM ? cleanMd(rendM[1]) : null;

    const hhTotalEquipe = hhProfs.reduce((s, pr) => s + pr.hh, 0);
    const produtividade = hhTotalEquipe > 0 ? (8 / hhTotalEquipe).toFixed(1) : null;

    return { custo_material, custo_mo, custo_equip, peso_total, hhProfs, equipe, rendimento, produtividade };
}

function splitComps(text) {
    const parts = text.split(/(?=^#\s*(?:🛠️|🏗️)?\s*(?:COMPOSIÇÃO|ITEM\s))/m).filter(t => t.trim().length > 50);
    if (parts.length > 1) return parts;

    const parts2 = text.split(/\n(?:---|[* ]{3,})\n+(?=\s*#\s*(?:🛠️|🏗️)?\s*(?:COMPOSIÇÃO|ITEM\s))/m).filter(t => t.trim().length > 50);
    if (parts2.length > 1) return parts2;

    const parts3 = text.split(/(?<=✅\s*Composição\s+[\w-]+\s+CONCLUÍDA[^\n]*\n)(?=[\s\S]*?#\s*(?:🛠️|🏗️)?)/m).filter(t => t.trim().length > 50);
    if (parts3.length > 1) return parts3;

    return [text];
}

module.exports = { cleanMd, parseNum, parseComp, parseCompDetail, splitComps };
