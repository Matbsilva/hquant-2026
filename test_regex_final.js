const fs = require('fs');

// Exact code from app/page.js
const cleanMd = (s) => {
  if (!s) return '';
  let str = s.replace(/[*#]/g, '').trim();
  const cutIdx = str.search(/(?:DATA:|TURNO:|GRUPO:|TAGS:|CLASSIFICAÇÃO:)/i);
  if (cutIdx > 15) return str.substring(0, cutIdx).trim();
  return str;
};

const parseNum = (s) => { if (!s) return null; const n = parseFloat(s.replace(/\./g, '').replace(',', '.')); return isNaN(n) ? null : n; };

function parseComp(text) {
  const ex = (patt) => { const m = text.match(patt); return m ? m[1].trim() : ''; };
  const rp = (v) => v ? parseNum(v.replace(/R\$\s*/, '')) : null;

  const codigo = ex(/COMPOSIÇÃO:\s*(.+)/i) || ex(/\*\*CÓDIGO:\*\*\s*(.+?)(?:\s*\||\s*$)/im) || ex(/CÓDIGO:\s*(.+?)(?:\s*\||\s*$)/im);
  const titulo = ex(/🛠️\s*COMPOSIÇÃO\s*[\d./]+[A-Za-z]?:\s*(.+)/i) || ex(/🛠️\s*ITEM\s*[\d.]+:\s*(.+)/i) || ex(/\*\*TÍTULO:\*\*\s*(.+)/i) || ex(/TÍTULO:\s*(.+)/i);
  const unidade = ex(/\*\*UNIDADE:\*\*\s*(.+?)(?:\s*\||\s*$)/im) || ex(/UNIDADE:\s*(.+?)(?:\s*\||\s*$)/im);
  const grupo = ex(/\*\*GRUPO:\*\*\s*(.+?)(?:\s*\||\s*$)/im) || ex(/GRUPO:\s*(.+?)(?:\s*\||\s*$)/im);
  const qref = ex(/\*\*QUANTIDADE REF:\*\*\s*(.+?)(?:\s*\||\s*$)/im) || ex(/QUANTIDADE REF:\s*(.+?)(?:\s*\||\s*$)/im) || ex(/\*\*REFERÊNCIA:\*\*\s*(.+?)(?:\s*\||\s*$)/im);
  const tagsR = ex(/\*\*TAGS:\*\*\s*(.+)/i) || ex(/TAGS:\s*(.+)/i);
  const tags = tagsR ? tagsR.split(',').map(t => t.trim().replace('#', '')).filter(Boolean) : [];

  let custo = null, hh = null;

  let custoRow = text.split('\n').find(l => /^\|\s*\*\*CUSTO DIRETO TOTAL/i.test(l));
  if (custoRow) {
    const rMatch = custoRow.match(/R\$\s*([\d.,]+)/g);
    custo = rMatch && rMatch.length >= 1 ? parseNum(rMatch[0].replace(/R\$\s*/, '')) : null;
  }
  if (!custo) {
    const cM = text.match(/\*\*CUSTO DIRETO TOTAL\*\*[^R]*R\$\s*([\d.,]+)/i) || text.match(/CUSTO DIRETO TOTAL[^R]*R\$\s*([\d.,]+)/i);
    custo = cM ? parseNum(cM[1]) : null;
  }

  let moRow = text.split('\n').find(l => /^\|\s*\*\*TOTAL M\.O/i.test(l));
  if (moRow) {
    const cols = moRow.split('|').map(x => x.replace(/\*\*/g, '').trim()).filter(Boolean);
    const numVals = cols.filter(c => /^[\d.,]+$/.test(c));
    hh = numVals.length > 0 ? parseNum(numVals[numVals.length - 1]) : null;
  }
  if (!hh) {
    const hM = text.match(/\*\*TOTAL M\.O\.\*\*[^|]*\|\s*\*\*([\d.,]+)\*\*/) || text.match(/TOTAL M\.O\.\/m.*?([\d.,]+)/i);
    hh = hM ? parseNum(hM[1]) : null;
  }

  return { codigo, titulo, unidade, grupo, qref, tags, custo, hh };
}

function parseCompDetail(text) {
  if (!text) return {};
  const rp = (v) => v ? parseNum(v.replace(/R\$\s*/, '')) : null;

  let custo_material = null, peso_total = null;
  const matRow = text.split('\n').find(l => /^\|\s*\*\*SUBTOTAL/i.test(l));
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
  const moRow = text.split('\n').find(l => /^\|\s*\*\*TOTAL M\.O/i.test(l));
  if (moRow) {
    const vals = moRow.match(/R\$\s*([\d.,]+)/g);
    custo_mo = vals && vals.length >= 1 ? rp(vals[0]) : null;
  }

  let custo_equip = null;
  const lines = text.split('\n');
  const sec2StartIndex = lines.findIndex(l => l.includes('SEÇÃO 2') || l.includes('TABELA UNIFICADA DE INSUMOS'));
  const sec3StartIndex = lines.findIndex(l => l.includes('SEÇÃO 3') || l.includes('ESTIMATIVA DE MÃO DE OBRA'));
  const sec4StartIndex = lines.findIndex(l => l.includes('SEÇÃO 4') || l.includes('QUANTITATIVOS'));

  if (sec2StartIndex > -1) {
    const end = sec3StartIndex > -1 ? sec3StartIndex : lines.length;
    let eqSum = 0;
    for (let i = sec2StartIndex; i < end; i++) {
      if (lines[i].match(/\|\s*(Equip\b|Ferramentas\b|Andaime\b)/i)) {
        const match = lines[i].match(/R\$\s*([\d.,]+)/g);
        if (match && match.length >= 2) eqSum += rp(match[1]);
      }
    }
    if (eqSum > 0) custo_equip = eqSum;
  }

  const hhProfs = [];
  if (sec3StartIndex > -1) {
    const end = sec4StartIndex > -1 ? sec4StartIndex : lines.length;
    for (let i = sec3StartIndex; i < end; i++) {
      const l = lines[i];
      if (l.startsWith('|') && !l.match(/Função|TOTAL M\.O\.|---/i)) {
        const cols = l.split('|').map(x => x.replace(/\*\*/g, '').trim()).filter(Boolean);
        if (cols.length >= 4) {
          const nome = cols[0];
          const numVals = cols.filter(c => /^[\d.,]+$/.test(c));
          if (nome && numVals.length > 0) {
            hhProfs.push({ nome, hh: parseNum(numVals[numVals.length - 1]) });
          }
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

const files = fs.readdirSync('composicoes-modelo-v4').filter(f => f.endsWith('.md') && !f.includes('BIBLIOTECA'));
let falhas = 0;

for(const file of files) {
   const content = fs.readFileSync('composicoes-modelo-v4/' + file, 'utf8');
   const p = parseComp(content);
   const d = parseCompDetail(content);

   if (!p.custo || !p.hh) {
       console.log('Falha em:', file, '- Custo:', p.custo, '- HH:', p.hh);
       falhas++;
   }
}

if (falhas === 0) {
   console.log('SUCESSO TOTAL! O Regex e Parser reais do App passaram liso pelas ' + files.length + ' composições.');
} else {
   console.log('Erros ao usar funcoes do page.js:', falhas);
}
