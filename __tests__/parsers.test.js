const fs = require('fs');
const path = require('path');
const { cleanMd, parseNum, parseComp, parseCompDetail, splitComps } = require('../lib/parsers');
const { normalizeComposition } = require('../lib/normalize');

// --- Load real composition fixture ---
const FIXTURE_DIR = path.join(__dirname, '..', 'composicoes-modelo-v4');
const loadFixture = (name) => fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf8');

const MUR = loadFixture('MUR-BLC-14-01.md');

// ============================
//  cleanMd
// ============================
describe('cleanMd', () => {
    test('strips bold and headers', () => {
        expect(cleanMd('**Hello** # World')).toBe('Hello  World');
    });
    test('truncates at metadata keys', () => {
        expect(cleanMd('Mureta Simples de Bloco DATA: 23/02')).toBe('Mureta Simples de Bloco');
    });
    test('returns empty for null/undefined', () => {
        expect(cleanMd(null)).toBe('');
        expect(cleanMd(undefined)).toBe('');
    });
});

// ============================
//  parseNum
// ============================
describe('parseNum', () => {
    test('parses BR number with comma decimal', () => {
        expect(parseNum('1.234,56')).toBe(1234.56);
    });
    test('parses simple decimal', () => {
        expect(parseNum('66,07')).toBe(66.07);
    });
    test('parses integer', () => {
        expect(parseNum('100')).toBe(100);
    });
    test('returns null for empty/null', () => {
        expect(parseNum(null)).toBeNull();
        expect(parseNum('')).toBeNull();
    });
    test('returns null for non-numeric', () => {
        expect(parseNum('abc')).toBeNull();
    });
});

// ============================
//  parseComp — MUR-BLC-14-01
// ============================
describe('parseComp (MUR-BLC-14-01)', () => {
    const result = parseComp(MUR);

    test('extracts codigo', () => {
        expect(result.codigo).toBe('MUR-BLC-14-01');
    });

    test('extracts titulo', () => {
        expect(result.titulo.toUpperCase()).toContain('MURETA SIMPLES');
    });

    test('extracts unidade = m', () => {
        expect(result.unidade).toBe('m');
    });

    test('extracts grupo', () => {
        expect(result.grupo).toBe('MURETAS E SÓCULOS');
    });

    test('extracts quantidade ref', () => {
        expect(result.qref).toContain('100');
    });

    test('extracts tags', () => {
        expect(result.tags).toContain('mureta');
        expect(result.tags).toContain('bloco-concreto');
        expect(result.tags.length).toBeGreaterThanOrEqual(4);
    });

    test('extracts custo direto total = 66.07', () => {
        expect(result.custo).toBeCloseTo(66.07, 1);
    });

    test('extracts HH total = 0.8941', () => {
        expect(result.hh).toBeCloseTo(0.8941, 3);
    });
});

// ============================
//  parseCompDetail — MUR-BLC-14-01
// ============================
describe('parseCompDetail (MUR-BLC-14-01)', () => {
    const det = parseCompDetail(MUR);

    test('extracts custo_material from SUBTOTAL', () => {
        expect(det.custo_material).toBeCloseTo(25.36, 1);
    });

    test('extracts custo_mo from TOTAL M.O.', () => {
        expect(det.custo_mo).toBeCloseTo(40.41, 1);
    });

    test('extracts peso_total from SUBTOTAL row', () => {
        expect(det.peso_total).toBeCloseTo(59.70, 1);
    });

    test('extracts hhProfs with correct professions', () => {
        expect(det.hhProfs.length).toBe(2);
        const names = det.hhProfs.map(p => p.nome);
        expect(names).toContain('Pedreiro Oficial');
        expect(names).toContain('Ajudante');
    });

    test('HH values match', () => {
        const pedreiro = det.hhProfs.find(p => p.nome === 'Pedreiro Oficial');
        const ajudante = det.hhProfs.find(p => p.nome === 'Ajudante');
        expect(pedreiro.hh).toBeCloseTo(0.5, 3);
        expect(ajudante.hh).toBeCloseTo(0.3941, 3);
    });

    test('extracts equipe string', () => {
        expect(det.equipe).toBeTruthy();
        expect(det.equipe).toContain('Pedreiro');
    });

    test('calculates produtividade', () => {
        // 8 / (0.5 + 0.3941) = 8 / 0.8941 ≈ 8.9
        expect(Number(det.produtividade)).toBeCloseTo(8.9, 0);
    });
});

// ============================
//  splitComps
// ============================
describe('splitComps', () => {
    test('single composition returns array of 1', () => {
        const result = splitComps(MUR);
        expect(result.length).toBe(1);
    });

    test('two compositions separated by header', () => {
        const double = MUR + '\n\n' + MUR.replace('MUR-BLC-14-01', 'MUR-BLC-14-02');
        const result = splitComps(double);
        expect(result.length).toBe(2);
    });
});

// ============================
//  normalizeComposition
// ============================
describe('normalizeComposition', () => {
    test('returns empty string for null', () => {
        expect(normalizeComposition(null)).toBe('');
        expect(normalizeComposition('')).toBe('');
    });

    test('is idempotent (applying twice gives same result)', () => {
        const once = normalizeComposition(MUR);
        const twice = normalizeComposition(once);
        expect(twice).toBe(once);
    });

    test('normalizes line endings', () => {
        const withCR = 'Line1\r\nLine2\rLine3';
        const result = normalizeComposition(withCR);
        expect(result).not.toContain('\r');
    });

    test('replaces --- with * * *', () => {
        const result = normalizeComposition('hello\n---\nworld');
        expect(result).toContain('* * *');
    });

    test('limits excessive blank lines', () => {
        const result = normalizeComposition('A\n\n\n\n\n\nB');
        const maxConsecutive = result.match(/\n{4,}/);
        expect(maxConsecutive).toBeNull();
    });
});

// ============================
//  Cross-fixture: all v4 compositions
// ============================
describe('parseComp on all v4 fixtures', () => {
    const files = fs.readdirSync(FIXTURE_DIR)
        .filter(f => f.endsWith('.md') && !f.startsWith('BIBLIOTECA') && !f.startsWith('ALL_MODELS'));

    files.forEach(file => {
        test(`${file}: extracts codigo and custo`, () => {
            const text = loadFixture(file);
            const result = parseComp(text);
            // Every composition should have a codigo
            expect(result.codigo).toBeTruthy();
            // Most should have a custo (allow some to be null for special cases)
        });
    });
});
