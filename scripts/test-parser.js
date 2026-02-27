const fs = require('fs');
const path = require('path');

const parseNum = (s) => { if (!s) return null; const n = parseFloat(s.replace(/\./g, '').replace(',', '.')); return isNaN(n) ? null : n; };
const rp = (v) => v ? parseNum(v.replace(/R\$\s*/, '')) : null;

function parseCompDetail(text) {
    if (!text) return {};

    const exCusto = (kw) => {
        const m = text.match(new RegExp(`\\|\\s*\\*\\*?Custo de ${kw}\\*\\*?\\s*\\|(?:[^|]*\\|)?\\s*R\\$\\s*([\\d.,]+)`, 'i')) ||
            text.match(new RegExp(`Custo de ${kw}[:\\s*]+R\\$\\s*([\\d.,]+)`, 'i'));
        return m ? parseNum(m[1]) : null;
    };

    let custo_material = exCusto('Materiais');
    let custo_mo = exCusto('Mão de Obra') || exCusto('M\\.O\\.');
    let custo_equip = exCusto('Equipamentos');

    return { custo_material, custo_mo, custo_equip };
}

const dir = './composicoes-modelo-v4';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'ALL_MODELS.md' && !f.includes('BIBLIOTECA'));

console.log('Testing extraction on ' + files.length + ' files...\n');
let fails = 0;

for (const file of files) {
    const text = fs.readFileSync(path.join(dir, file), 'utf-8');
    const det = parseCompDetail(text);

    // Also parse manual check to see if Sec 5 exists but failed extraction
    const s5Mat = text.match(/Custo de Materiais.*?R\$\s*([\d.,]+)/i);
    const s5Equip = text.match(/Custo de Equipamentos.*?R\$\s*([\d.,]+)/i);
    const s5MO = text.match(/Custo de Mão de Obra.*?R\$\s*([\d.,]+)/i);

    const hasDataButFailed =
        (s5Mat && det.custo_material === null) ||
        (s5Equip && det.custo_equip === null) ||
        (s5MO && det.custo_mo === null);

    if (hasDataButFailed) {
        fails++;
        console.log(`[FAIL] ${file}`);
        console.log(`  Expected Mat: ${s5Mat ? s5Mat[1] : 'null'} | Got: ${det.custo_material}`);
        console.log(`  Expected Eq:  ${s5Equip ? s5Equip[1] : 'null'} | Got: ${det.custo_equip}`);
        console.log(`  Expected MO:  ${s5MO ? s5MO[1] : 'null'} | Got: ${det.custo_mo}`);
        console.log('');
    }
}

if (fails === 0) {
    console.log('✅ ALL FILES PARSED SUCCESSFULLY! No missed Section 5 costs.');
} else {
    console.log(`❌ FAILED on ${fails} files.`);
}
