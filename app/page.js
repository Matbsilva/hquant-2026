'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeComposition } from '../lib/normalize';

// --- HELPERS ---
const cleanMd = (s) => {
  if (!s) return '';
  let str = s.replace(/[*#]/g, '').trim();
  // Strip trailing metadata incorrectly squashed into early DB generation files
  const cutIdx = str.search(/(?:DATA:|TURNO:|GRUPO:|TAGS:|CLASSIFICAÇÃO:)/i);
  if (cutIdx > 15) return str.substring(0, cutIdx).trim();
  return str;
};
const parseNum = (s) => { if (!s) return null; const n = parseFloat(s.replace(/\./g, '').replace(',', '.')); return isNaN(n) ? null : n; };

// --- PARSER ---
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

  // CUSTO
  let custoRow = text.split('\n').find(l => /^\|\s*\*\*CUSTO DIRETO TOTAL/i.test(l));
  if (custoRow) {
    const rMatch = custoRow.match(/R\$\s*([\d.,]+)/g);
    custo = rMatch && rMatch.length >= 1 ? parseNum(rMatch[0].replace(/R\$\s*/, '')) : null;
  }
  if (!custo) {
    const cM = text.match(/\*\*CUSTO DIRETO TOTAL\*\*[^R]*R\$\s*([\d.,]+)/i) || text.match(/CUSTO DIRETO TOTAL[^R]*R\$\s*([\d.,]+)/i);
    custo = cM ? parseNum(cM[1]) : null;
  }

  // HH
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

// --- EXTENDED PARSER (for detail view) ---
function parseCompDetail(text) {
  if (!text) return {};
  const rp = (v) => v ? parseNum(v.replace(/R\$\s*/, '')) : null;

  // 1. Custo material (SUBTOTAL da tabela de insumos)
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

  // 2. Custo M.O. total
  let custo_mo = null;
  const moRow = text.split('\n').find(l => /^\|\s*\*\*TOTAL M\.O/i.test(l));
  if (moRow) {
    const vals = moRow.match(/R\$\s*([\d.,]+)/g);
    custo_mo = vals && vals.length >= 1 ? rp(vals[0]) : null;
  }

  // 3. Custo Equipamento
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
        // Value at index 1 is "Total" (Value 0 is "Unit")
        if (match && match.length >= 2) eqSum += rp(match[1]);
      }
    }
    if (eqSum > 0) custo_equip = eqSum;
  }

  // 4. M.O. por Profissao
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

function splitComps(text) {
  const parts = text.split(/(?=^#\s*🛠️\s*(?:COMPOSIÇÃO|ITEM\s))/m).filter(t => t.trim().length > 50);
  if (parts.length > 1) return parts;
  const parts2 = text.split(/\n---\n(?=\s*#)/m).filter(t => t.trim().length > 50);
  if (parts2.length > 1) return parts2;
  return [text];
}

// --- MARKDOWN RENDERER ---
function Md({ text }) {
  if (!text) return null;
  const lines = text.split('\n'), els = [];
  let tR = [], tK = 0, lastH = '';
  const C = { a: '#F59E0B', ay: '#FBBF24', d: '#A8A29E', t: '#F5F5F4', m: '#78716C', bd: 'rgba(245,158,11,0.08)', lt: '#D6D3D1', err: '#EF4444', ok: '#22C55E' };

  const flushT = () => {
    if (!tR.length) return;
    const hdr = tR[0].split('|').filter(Boolean).map(c => c.trim().replace(/\*\*/g, ''));
    const rows = tR.slice(2);
    const is73 = lastH.includes('7.3') || lastH.includes('PRODUTIVIDADE') || hdr.some(h => h.toLowerCase().includes('produtividade') || h.toLowerCase().includes('variação'));
    els.push(
      <div key={`t${tK++}`} style={{ overflowX: 'auto', margin: '14px 0 20px', borderRadius: 8, border: `1px solid ${is73 ? 'rgba(245,158,11,0.25)' : C.bd}`, background: is73 ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead><tr>{hdr.map((h, i) => <th key={i} style={{ padding: '8px 10px', borderBottom: `2px solid ${C.a}`, textAlign: 'left', fontWeight: 700, color: C.a, fontSize: 10, letterSpacing: '0.4px', textTransform: 'uppercase', background: 'rgba(245,158,11,0.06)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((row, ri) => {
            const cells = row.split('|').filter(Boolean).map(c => c.trim());
            const isHL = cells[0]?.includes('**') || cells.some(c => c.includes('TOTAL') || c.includes('SUBTOTAL') || c.includes('CUSTO DIRETO'));
            return <tr key={ri} style={{ borderBottom: `1px solid ${C.bd}`, background: isHL ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
              {cells.map((cell, ci) => {
                const bold = cell.includes('**'); const clean = cell.replace(/\*\*/g, ''); const isVal = clean.startsWith('R$') || /^[\d.,]+$/.test(clean.trim());
                return <td key={ci} style={{ padding: '6px 10px', color: bold ? (isHL ? C.a : C.t) : (isVal ? C.ay : C.d), fontWeight: bold ? 700 : 400, fontSize: 11, fontFamily: isVal ? "'JetBrains Mono',monospace" : 'inherit' }}>{clean}</td>;
              })}</tr>;
          })}</tbody>
        </table>
      </div>
    );
    tR = [];
  };

  lines.forEach((l, i) => {
    let t = l.trim();
    const isIndented = l.startsWith('    ') || l.startsWith('\t');

    if (t.startsWith('|') && t.endsWith('|')) { tR.push(t); return; }
    if (tR.length) flushT();

    if (!t || t === '---' || t === '***' || t === '* * *') { if (t) els.push(<hr key={i} style={{ border: 'none', borderTop: `1px solid ${C.bd}`, margin: '20px 0' }} />); return; }

    if (t.startsWith('### ')) { const txt = t.slice(4).replace(/\*\*/g, ''); lastH = txt; els.push(<h3 key={i} style={{ color: C.ay, fontSize: 15, fontWeight: 700, margin: '28px 0 12px', padding: '6px 0', borderBottom: `1px solid ${C.bd}` }}>{txt}</h3>); return; }

    if (t.startsWith('#### ') || t.startsWith('##### ')) {
      const txt = t.replace(/^#+\s+/, '').replace(/\*\*/g, '');
      lastH = txt;
      els.push(<h4 key={i} style={{ color: C.a, fontSize: 12, fontWeight: 700, margin: '24px 0 10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{txt}</h4>);
      return;
    }

    if (t.startsWith('# ') && t.includes('🛠️')) { els.push(<h2 key={i} style={{ color: C.a, fontSize: 16, fontWeight: 800, margin: '14px 0 12px' }}>{t.slice(2).replace(/\*\*/g, '')}</h2>); return; }

    const emojiMatch = t.match(/^(✅|❌|⚠️|🔴|📋|☑|☐)\s+(.*)/);
    if (emojiMatch) {
      els.push(<div key={i} style={{ margin: '8px 0 8px 12px', fontSize: 12, lineHeight: 1.6, color: C.lt, display: 'flex', gap: 8 }}><span style={{ fontSize: 12 }}>{emojiMatch[1]}</span><span style={{ flex: 1 }}>{emojiMatch[2].replace(/\*\*/g, '')}</span></div>);
      return;
    }

    const subMatch = t.match(/^\*\*(\d+\.\d+\s+[^:*]+)(?::\*\*\s*|\*\*\s*)(.*)/);
    if (subMatch) {
      const label = subMatch[1].trim(); const rest = subMatch[2]?.trim() || ''; lastH = label;
      if (rest) { els.push(<div key={i} style={{ margin: '18px 0 8px' }}><span style={{ color: C.a, fontSize: 12, fontWeight: 700 }}>{label}:</span><span style={{ color: C.lt, fontSize: 12, fontWeight: 400, marginLeft: 6, lineHeight: 1.6 }}>{rest.replace(/\*\*/g, '')}</span></div>); }
      else { els.push(<h4 key={i} style={{ color: C.a, fontSize: 12, fontWeight: 700, margin: '18px 0 8px' }}>{label}</h4>); }
      return;
    }

    if (t.startsWith('**') && t.includes(':**')) {
      const clean = t.replace(/\*\*/g, ''); const idx = clean.indexOf(':');
      if (idx > 0) { els.push(<p key={i} style={{ margin: '6px 0', fontSize: 12, lineHeight: 1.6 }}><span style={{ color: C.a, fontWeight: 600 }}>{clean.slice(0, idx)}:</span> <span style={{ color: C.lt }}>{clean.slice(idx + 1).trim()}</span></p>); return; }
    }

    // Parse indented bullet points explicitly as they are common in V4
    if (t.startsWith('- ') || t.startsWith('* ') || t.startsWith('• ')) {
      let clean = t.replace(/^[-*•]\s*/, '');
      const parts = clean.split(/(\*\*[^*]+\*\*)/g);
      els.push(
        <div key={i} style={{ margin: '8px 0 8px 12px', fontSize: 12, lineHeight: 1.6, color: C.lt }}>
          <span style={{ color: C.a, marginRight: 6 }}>▸</span>
          {parts.map((p, pi) => p.startsWith('**') ? <strong key={pi} style={{ color: '#E7E5E4', fontWeight: 600 }}>{p.replace(/\*\*/g, '')}</strong> : p)}
        </div>
      );
      return;
    }

    // Parse pseudo headings inside indented blocks (like "MÉTODO EXECUTIVO PASSO-A-PASSO:")
    if (t.endsWith(':') && t === t.toUpperCase() && t.length > 5 && !t.includes('**')) {
      els.push(<h5 key={i} style={{ margin: '16px 0 6px', fontSize: 11, color: C.a, fontWeight: 600, letterSpacing: '0.3px' }}>{t}</h5>);
      return;
    }

    // Numbered steps (like "1. MARCAÇÃO")
    const stepMatch = t.match(/^(\d+\.)\s+(.*)/);
    if (stepMatch) {
      const parts = stepMatch[2].split(/(\*\*[^*]+\*\*)/g);
      els.push(
        <div key={i} style={{ margin: '12px 0 4px', fontSize: 12, lineHeight: 1.6, color: C.lt }}>
          <span style={{ color: C.t, fontWeight: 700, marginRight: 6 }}>{stepMatch[1]}</span>
          {parts.map((p, pi) => p.startsWith('**') ? <strong key={pi} style={{ color: C.t, fontWeight: 600 }}>{p.replace(/\*\*/g, '')}</strong> : p)}
        </div>
      );
      return;
    }

    // Custom Highlight for "5.1 ANÁLISE DE CUSTO"
    if (t.includes('5.1 ANÁLISE DE CUSTO:')) {
      els.push(
        <div key={i} style={{ margin: '24px 0 16px', padding: '16px 20px', background: 'rgba(59, 130, 246, 0.08)', borderLeft: `3px solid ${BL}`, borderRadius: '0 8px 8px 0' }}>
          <div style={{ color: BL, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.5px' }}>📈 5.1 ANÁLISE DE CUSTO</div>
        </div>
      );
      return;
    }

    if (t.includes('**')) {
      // Don't format the first line if it's the 5.1 block continuation, but here we just render it.
      // If it's part of the composition unit cost analysis:
      if (t.includes('Material: R$') || t.includes('Equipamentos: R$') || t.includes('Mão de Obra: R$')) {
        els.push(
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', margin: '4px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 12, color: C.lt }}>
            <span>{t.replace(/\*\*/g, '')}</span>
          </div>
        );
        return;
      }

      const parts = t.split(/(\*\*[^*]+\*\*)/g);
      els.push(<div key={i} style={{ margin: isIndented ? '4px 0 4px 12px' : '6px 0', fontSize: 13, color: C.lt, lineHeight: 1.6 }}>{parts.map((p, pi) => p.startsWith('**') ? <strong key={pi} style={{ color: C.t, fontWeight: 600 }}>{p.replace(/\*\*/g, '')}</strong> : p)}</div>);
      return;
    }

    if (t.length > 0) els.push(<div key={i} style={{ margin: isIndented ? '4px 0 4px 12px' : '6px 0', fontSize: 13, color: C.lt, lineHeight: 1.6 }}>{t}</div>);
  });

  flushT();
  return <div>{els}</div>;
}

// --- THEME ---
const A = '#F59E0B', BG = '#0A0908', SF = '#161412', S2 = '#1C1A17', BD = 'rgba(245,158,11,0.08)', AD = 'rgba(245,158,11,0.12)', TX = '#F5F5F4', TD = '#A8A29E', TM = '#A8A29E', TL = '#D6D3D1', RD = '#EF4444', GR = '#22C55E', BL = '#60A5FA', FN = "'JetBrains Mono',monospace", FS = "'DM Sans',system-ui,sans-serif";

const ic = {
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7M19 12H5" /></svg>,
  file: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>,
};

export default function Home() {
  const [projetos, setProjetos] = useState([]);
  const [composicoes, setComposicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vw, setVw] = useState('home');
  const [pid, setPid] = useState(null);
  const [cid, setCid] = useState(null);
  const [q, setQ] = useState('');
  const [ml, setMl] = useState(null);
  const [nt, setNt] = useState(null);
  const [fN, setFN] = useState(''); const [fD, setFD] = useState(''); const [fC, setFC] = useState('');
  const [importing, setImporting] = useState(false);
  const [aiComps, setAiComps] = useState(null);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const nf = (m, ok = true) => { setNt({ m, ok }); setTimeout(() => setNt(null), 3000); };

  // Load data
  const loadData = useCallback(async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('projetos').select('*').order('created_at', { ascending: false }),
      supabase.from('composicoes').select('*').order('created_at', { ascending: true }),
    ]);
    setProjetos(p || []);
    setComposicoes(c || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const proj = pid ? projetos.find(p => p.id === pid) : null;
  const comp = cid ? composicoes.find(c => c.id === cid) : null;
  const pComps = pid ? composicoes.filter(c => c.projeto_id === pid) : [];
  const pName = (id) => projetos.find(p => p.id === id)?.nome || '—';
  const pCnt = (id) => composicoes.filter(c => c.projeto_id === id).length;
  const tot = composicoes.length;
  const sR = q.trim() ? composicoes.filter(c => {
    const s = q.toLowerCase();
    return [c.titulo, c.codigo, c.grupo, ...(c.tags || [])].some(f => (f || '').toLowerCase().includes(s));
  }) : [];

  // CRUD
  const addP = async () => {
    if (!fN.trim()) return;
    const { data, error } = await supabase.from('projetos').insert({ nome: fN.trim(), descricao: fD.trim() }).select().single();
    if (error) { nf('Erro ao criar projeto', false); return; }
    setProjetos(prev => [data, ...prev]);
    nf(`Projeto "${data.nome}" criado`);
    setFN(''); setFD(''); setMl(null);
  };

  const delP = async (id) => {
    if (!confirm('Excluir projeto e todas as composições?')) return;
    await supabase.from('composicoes').delete().eq('projeto_id', id);
    await supabase.from('projetos').delete().eq('id', id);
    setProjetos(prev => prev.filter(p => p.id !== id));
    setComposicoes(prev => prev.filter(c => c.projeto_id !== id));
    if (pid === id) { setVw('home'); setPid(null); }
    nf('Projeto excluído');
  };

  // AI parse function (called by button)
  const analyzeWithAI = async () => {
    if (!fC.trim()) return;
    setAiParsing(true); setAiError(null); setAiComps(null);
    try {
      const res = await fetch('/api/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: fC }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro na API'); }
      const { composicoes } = await res.json();
      if (composicoes && composicoes.length > 0) { setAiComps(composicoes); }
      else { setAiError('IA não identificou composições no texto.'); }
    } catch (e) {
      setAiError(e.message || 'Falha ao conectar com Gemini');
    }
    setAiParsing(false);
  };

  const addComp = async () => {
    if (!fC.trim() || !pid) return;
    setImporting(true);
    let rows;
    // Use AI-parsed data if available
    if (aiComps && aiComps.length > 0) {
      const textParts = splitComps(fC);
      rows = aiComps.map((c, i) => ({
        projeto_id: pid,
        codigo: c.codigo || 'SEM-CÓD',
        titulo: c.titulo || 'Composição',
        unidade: c.unidade || '',
        grupo: c.grupo || '',
        tags: c.tags || [],
        conteudo_completo: normalizeComposition((textParts[i] || fC).trim()),
        custo_unitario: c.custo_unitario || null,
        hh_unitario: c.hh_unitario || null,
      }));
    } else {
      // Regex fallback
      const parts = splitComps(fC);
      rows = parts.map(txt => {
        const p = parseComp(txt);
        return {
          projeto_id: pid,
          codigo: p.codigo || 'SEM-CÓD',
          titulo: p.titulo || txt.split('\n').find(l => l.trim().length > 5)?.replace(/[#*🛠️]/g, '').trim().slice(0, 100) || 'Composição',
          unidade: p.unidade || '',
          grupo: p.grupo || '',
          tags: p.tags,
          conteudo_completo: normalizeComposition(txt.trim()),
          custo_unitario: p.custo,
          hh_unitario: p.hh,
        };
      });
    }
    const { data, error } = await supabase.from('composicoes').insert(rows).select();
    if (error) { nf('Erro ao salvar: ' + error.message, false); setImporting(false); return; }
    setComposicoes(prev => [...prev, ...(data || [])]);
    nf(`${rows.length} composiç${rows.length > 1 ? 'ões importadas' : 'ão salva'}!`);
    setFC(''); setMl(null); setImporting(false); setAiComps(null); setAiError(null);
  };

  const delC = async (id) => {
    if (!confirm('Excluir composição?')) return;
    await supabase.from('composicoes').delete().eq('id', id);
    setComposicoes(prev => prev.filter(c => c.id !== id));
    if (cid === id) { setVw('proj'); setCid(null); }
    nf('Excluída');
  };

  const batchCount = fC.trim() ? splitComps(fC).length : 0;

  // Styles
  const bt = (v = 'p') => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: v === 's' ? '5px 10px' : '8px 16px', borderRadius: 6, border: v === 'g' ? `1px solid ${BD}` : 'none', background: v === 'p' ? A : v === 'd' ? RD : 'transparent', color: v === 'p' ? BG : v === 'd' ? '#fff' : TD, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FS });
  const inp = { width: '100%', padding: '10px 14px', background: BG, border: `1px solid ${BD}`, borderRadius: 6, color: TX, fontSize: 13, fontFamily: FS, outline: 'none' };
  const cd = { background: SF, border: `1px solid ${BD}`, borderRadius: 8, padding: 18, cursor: 'pointer', transition: 'all 0.15s' };
  const bg = (c = A) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', background: `${c}20`, color: c, textTransform: 'uppercase' });
  const st = { textAlign: 'center', padding: '14px 16px', background: SF, border: `1px solid ${BD}`, borderRadius: 8 };

  if (loading) return <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TM, fontFamily: FS }}>Carregando...</div>;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TX, fontFamily: FS, display: 'flex' }}>
      {/* SIDEBAR */}
      <div style={{ width: 210, background: SF, borderRight: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div onClick={() => { setVw('home'); setPid(null); setCid(null); }} style={{ padding: '18px 14px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, borderRadius: 6, background: AD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: A, fontSize: 15, fontWeight: 800, fontFamily: FN }}>H</div>
          <div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: FN, letterSpacing: '0.5px' }}>H-QUANT</div><div style={{ fontSize: 10, color: TL, letterSpacing: '2px' }}>COMPOSIÇÕES 2026</div></div>
        </div>
        <div style={{ padding: '10px 0', flex: 1 }}>
          {[['home', ic.folder, 'Projetos'], ['busca', ic.search, 'Busca Global']].map(([id, icon, label]) => {
            const act = vw === id || (id === 'home' && ['proj', 'comp'].includes(vw));
            return <div key={id} onClick={() => { setVw(id); setPid(null); setCid(null); if (id === 'busca') setQ(''); }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 16px', cursor: 'pointer', color: act ? A : TL, background: act ? AD : 'transparent', borderLeft: act ? `2px solid ${A}` : '2px solid transparent', fontSize: 13, fontWeight: act ? 600 : 400 }}>{icon}<span>{label}</span></div>;
          })}
        </div>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${BD}`, fontSize: 12, color: TL }}>{projetos.length} projetos • {tot} composições</div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 210, flex: 1, padding: '0 32px 32px', minHeight: '100vh', maxWidth: 1600 }}>
        {nt && <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 999, padding: '10px 18px', borderRadius: 8, background: nt.ok ? GR : RD, color: '#fff', fontSize: 12, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{nt.ok ? '✓' : '✕'} {nt.m}</div>}

        {/* HOME */}
        {vw === 'home' && <>
          <div style={{ padding: '24px 0 16px', borderBottom: `1px solid ${BD}`, marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: FN }}>Projetos</h1><p style={{ fontSize: 13, color: TL, margin: '4px 0 0' }}>Gerencie seus projetos de engenharia de custos</p></div>
            <button style={bt()} onClick={() => { setMl('np'); setFN(''); setFD(''); }}>{ic.plus} Novo Projeto</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 22 }}>
            {[[projetos.length, 'Projetos'], [tot, 'Composições'], [projetos.length ? Math.round(tot / projetos.length) : 0, 'Média']].map(([v, l], i) => <div key={i} style={st}><div style={{ fontSize: 26, fontWeight: 700, color: A, fontFamily: FN }}>{v}</div><div style={{ fontSize: 11, color: TL, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4, fontWeight: 600 }}>{l}</div></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
            {projetos.map(p => <div key={p.id} style={cd} onClick={() => { setPid(p.id); setVw('proj'); }} onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.background = S2; }} onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.background = SF; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: A }}>{ic.folder}</span><span style={{ fontSize: 14, fontWeight: 600 }}>{p.nome}</span></div>
                <button onClick={e => { e.stopPropagation(); delP(p.id); }} style={{ ...bt('g'), padding: 3, border: 'none', opacity: 0.2 }}>{ic.trash}</button>
              </div>
              {p.descricao && <p style={{ fontSize: 13, color: TL, margin: '8px 0 0', lineHeight: 1.5 }}>{p.descricao.slice(0, 120)}{p.descricao.length > 120 ? '...' : ''}</p>}
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}><span style={bg()}>{pCnt(p.id)} comp</span><span style={{ fontSize: 9, color: TM }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span></div>
            </div>)}
            {!projetos.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: TM }}><div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>📁</div><p style={{ fontSize: 14 }}>Nenhum projeto ainda</p></div>}
          </div>
        </>}

        {/* PROJECT */}
        {vw === 'proj' && pid && <>
          <div style={{ padding: '24px 0 16px', borderBottom: `1px solid ${BD}`, marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{ ...bt('g'), padding: 6 }} onClick={() => { setVw('home'); setPid(null); }}>{ic.back}</button>
              <div><h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: FN }}>{proj?.nome}</h1>{proj?.descricao && <p style={{ fontSize: 13, color: TL, margin: '3px 0 0' }}>{proj.descricao}</p>}</div>
            </div>
            <button style={bt()} onClick={() => { setMl('nc'); setFC(''); }}>{ic.plus} Composição</button>
          </div>
          {pComps.map((c, i) => {
            const det = parseCompDetail(c.conteudo_completo);
            const mData = c.conteudo_completo.match(/\*\*DATA:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.conteudo_completo.match(/DATA:\s*(.*?)(?:\n|$|\|)/i);
            const dataV = mData ? mData[1].trim() : '';
            const un = c.unidade || 'un';

            return (
              <div key={c.id} style={{ ...cd, padding: '16px 20px', marginBottom: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }} onClick={() => { setCid(c.id); setVw('comp'); }} onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.background = S2; }} onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.background = SF; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                    <div style={{ color: A, fontSize: 11, fontFamily: FN, background: AD, borderRadius: 6, padding: '4px 10px', fontWeight: 800, textAlign: 'center', marginTop: 2 }}>#{String(i + 1).padStart(2, '0')}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button title="Copiar" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(normalizeComposition(c.conteudo_completo) || ''); setNt({ ok: true, m: 'Copiado!' }); setTimeout(() => setNt(null), 2000); }} style={{ ...bt('g'), padding: 4, border: 'none', opacity: 0.4 }}>{ic.copy}</button>
                      <button title="Excluir" onClick={e => { e.stopPropagation(); delC(c.id); }} style={{ ...bt('g'), padding: 4, border: 'none', opacity: 0.3 }}>{ic.trash}</button>
                    </div>
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      {c.codigo && <span style={{ ...bg(A), fontSize: 10, padding: '3px 8px', letterSpacing: '0.5px' }}>{c.codigo}</span>}
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: '#FFFFFF', marginBottom: 6 }}>{cleanMd(c.titulo)}</div>

                    <div style={{ fontSize: 11, color: TM, display: 'flex', gap: 14, flexWrap: 'wrap', lineHeight: 1.4 }}>
                      {dataV && <span><strong style={{ color: TL, fontWeight: 600 }}>DATA:</strong> {dataV}</span>}
                      {det.equipe && <span><strong style={{ color: TL, fontWeight: 600 }}>EQUIPE:</strong> {det.equipe.slice(0, 90)}{det.equipe.length > 90 ? '...' : ''}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {c.custo_unitario != null && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 18, color: A, fontWeight: 800, fontFamily: FN }}>{Number(c.custo_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: A }}>R$/{un}</span>
                      </div>
                    )}

                    {c.hh_unitario != null && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 13, color: BL, fontWeight: 700, fontFamily: FN }}>{c.hh_unitario}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: TL }}>HH Total/{un}</span>
                      </div>
                    )}
                  </div>

                  {det.hhProfs && det.hhProfs.length > 0 && (
                    <div style={{ textAlign: 'right', marginTop: 2, background: 'rgba(59, 130, 246, 0.05)', padding: '6px 10px', borderRadius: 6, border: `1px solid rgba(59, 130, 246, 0.1)` }}>
                      {det.hhProfs.map((pr, pi) => (
                        <div key={pi} style={{ fontSize: 10, color: TL, marginBottom: 2, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <span style={{ color: BL, fontWeight: 700, fontFamily: FN }}>{pr.hh.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</span>
                          <span style={{ fontWeight: 500 }}>HH {pr.nome.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {!pComps.length && <div style={{ textAlign: 'center', padding: 60, color: TM }}><div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>📋</div><p>Nenhuma composição</p></div>}
        </>}

        {/* COMP DETAIL */}
        {vw === 'comp' && comp && (() => {
          const det = parseCompDetail(comp.conteudo_completo);
          const un = comp.unidade || 'un';
          const compIdx = pComps.findIndex(c => c.id === comp.id);
          const seqNum = compIdx >= 0 ? `#${String(compIdx + 1).padStart(2, '0')}` : '';
          const indCard = (label, value, color, suffix) => value != null ? (
            <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
              <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: FN }}>{typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : value}{suffix && <span style={{ fontSize: 11, color: TL, fontWeight: 500 }}> {suffix}</span>}</div>
            </div>
          ) : null;
          return <>
            <div style={{ padding: '24px 0 16px', borderBottom: `1px solid ${BD}`, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{ ...bt('g'), padding: 6 }} onClick={() => { setVw(pid ? 'proj' : 'busca'); setCid(null); }}>{ic.back}</button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{seqNum && <span style={{ color: A, fontSize: 11, fontFamily: FN, background: AD, borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>{seqNum}</span>}{comp.codigo && <span style={bg()}>{comp.codigo}</span>}<h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{cleanMd(comp.titulo)}</h1></div>
                <p style={{ fontSize: 12, color: TL, margin: '4px 0 0' }}>Projeto: {pName(comp.projeto_id)}{comp.grupo && ` • ${comp.grupo}`}{comp.unidade && ` • Un: ${comp.unidade}`}</p>
              </div>
              <button title="Copiar composição" onClick={() => { navigator.clipboard.writeText(normalizeComposition(comp.conteudo_completo) || ''); setNt({ ok: true, m: 'Composição copiada!' }); setTimeout(() => setNt(null), 2000); }} style={{ ...bt('g'), padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: TL }}>{ic.copy} Copiar</button>
              <button title="Apagar composição" onClick={() => setConfirmDel(comp)} style={{ ...bt('g'), padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: RD, borderColor: 'rgba(239,68,68,0.2)' }}>{ic.trash} Apagar</button>
            </div>
            {comp.tags?.length > 0 && <div style={{ marginBottom: 14 }}>{comp.tags.map((t, i) => <span key={i} style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: 10, background: 'rgba(255,255,255,0.06)', color: TL, marginRight: 5 }}>#{t}</span>)}</div>}
            {/* --- INDICADORES CONSOLIDADOS --- */}
            <div style={{ background: SF, border: `1px solid ${BD}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: A, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>📊 Indicadores</div>
              {/* Custos */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {indCard(`Custo Direto Total/${un}`, comp.custo_unitario ? Number(comp.custo_unitario) : null, A, `R$/${un}`)}
                {indCard(`Material/${un}`, det.custo_material, '#FBBF24', `R$/${un}`)}
                {indCard(`Mão de Obra/${un}`, det.custo_mo, BL, `R$/${un}`)}
                {indCard(`Equipamento/${un}`, det.custo_equip, '#A78BFA', `R$/${un}`)}
                {indCard(`Peso/${un}`, det.peso_total, TL, 'kg')}
              </div>
              {/* HH por função */}
              {det.hhProfs.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {det.hhProfs.map((p, i) => <div key={i} style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>HH {p.nome}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: BL, fontFamily: FN }}>{p.hh.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span style={{ fontSize: 11, color: TL, fontWeight: 500 }}>HH/{un}</span></div>
                </div>)}
              </div>}
              {/* Produtividade + Equipe + HH Total + Rendimento */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {det.produtividade && <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>Produtividade/Dia</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: GR, fontFamily: FN }}>{det.produtividade} <span style={{ fontSize: 11, color: TL, fontWeight: 500 }}>{un}/dia</span></div>
                </div>}
                {comp.hh_unitario && <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>HH Total Equipe/{un}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TX, fontFamily: FN }}>{comp.hh_unitario}</div>
                </div>}
                {det.equipe && <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 200px', minWidth: 180 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>Composição da Equipe</div>
                  <div style={{ fontSize: 14, color: TX, fontWeight: 500 }}>{det.equipe}</div>
                </div>}
                {det.rendimento && <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>Rendimento Diário</div>
                  <div style={{ fontSize: 14, color: GR, fontWeight: 600, fontFamily: FN }}>{det.rendimento}</div>
                </div>}
              </div>
            </div>
            <div style={{ background: SF, border: `1px solid ${BD}`, borderRadius: 10, padding: 26 }}><Md text={normalizeComposition(comp.conteudo_completo)} /></div>
          </>;
        })()}

        {/* SEARCH */}
        {vw === 'busca' && <>
          <div style={{ padding: '24px 0 16px', borderBottom: `1px solid ${BD}`, marginBottom: 22 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: FN }}>Busca Global</h1>
          </div>
          <div style={{ position: 'relative', marginBottom: 22 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: TM }}>{ic.search}</div>
            <input type="text" placeholder="contrapiso, sóculo, CIV-SOCULO..." value={q} onChange={e => setQ(e.target.value)} style={{ ...inp, paddingLeft: 40, padding: '13px 14px 13px 40px' }} autoFocus />
          </div>
          {q && <p style={{ fontSize: 11, color: TM, marginBottom: 14 }}>{sR.length} resultado{sR.length !== 1 ? 's' : ''}</p>}
          {sR.map(c => <div key={c.id} style={{ ...cd, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }} onClick={() => { setCid(c.id); setPid(c.projeto_id); setVw('comp'); }} onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.background = S2; }} onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.background = SF; }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}><span style={{ color: A, marginTop: 2 }}>{ic.file}</span><div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>{c.codigo && <span style={{ ...bg(), fontSize: 9 }}>{c.codigo}</span>}<span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'normal', lineHeight: 1.5 }}>{cleanMd(c.titulo)}</span></div>
              <div style={{ fontSize: 11, color: TL, marginTop: 4 }}>Projeto: {pName(c.projeto_id)}</div>
            </div></div>
            {c.custo_unitario && <span style={{ fontSize: 13, color: A, fontWeight: 600, fontFamily: FN, flexShrink: 0, marginTop: 2 }}>R$ {Number(c.custo_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
          </div>)}
          {q && !sR.length && <div style={{ textAlign: 'center', padding: 50, color: TM }}>Nenhum resultado</div>}
          {!q && <div style={{ textAlign: 'center', padding: 60, color: TM, opacity: 0.3 }}><div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div><p>Digite para buscar...</p></div>}
        </>}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDel && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmDel(null)}>
        <div style={{ background: SF, border: `1px solid ${BD}`, borderRadius: 12, padding: 28, maxWidth: 400, width: '90%' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 15, fontWeight: 700, color: RD, marginBottom: 12 }}>⚠️ Apagar composição?</div>
          {confirmDel.codigo && <div style={{ ...bg(RD), marginBottom: 8 }}>{confirmDel.codigo}</div>}
          <div style={{ fontSize: 13, color: TL, marginBottom: 6 }}>{cleanMd(confirmDel.titulo)}</div>
          <div style={{ fontSize: 11, color: TM, marginBottom: 20 }}>Esta ação não pode ser desfeita.</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirmDel(null)} style={{ ...bt('g'), padding: '8px 16px' }}>Cancelar</button>
            <button onClick={async () => { const id = confirmDel.id; setConfirmDel(null); await supabase.from('composicoes').delete().eq('id', id); setComposicoes(prev => prev.filter(c => c.id !== id)); if (cid === id) { setVw('proj'); setCid(null); } nf('Composição excluída'); }} style={{ ...bt('d'), padding: '8px 16px' }}>Apagar</button>
          </div>
        </div>
      </div>}


      {/* MODALS */}
      {ml && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, backdropFilter: 'blur(4px)' }} onClick={() => !importing && setMl(null)}>
        <div style={{ background: S2, border: `1px solid ${BD}`, borderRadius: 12, padding: 28, width: '92%', maxWidth: ml === 'nc' ? 760 : 500, maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          {ml === 'np' && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Novo Projeto</h2><button style={{ ...bt('g'), padding: 4, border: 'none' }} onClick={() => setMl(null)}>{ic.x}</button></div>
            <label style={{ fontSize: 11, color: TM, display: 'block', marginBottom: 4, fontWeight: 600 }}>NOME *</label>
            <input type="text" placeholder="Ex: 4740/25 - Orçamento Civil" value={fN} onChange={e => setFN(e.target.value)} style={{ ...inp, marginBottom: 16 }} autoFocus />
            <label style={{ fontSize: 11, color: TM, display: 'block', marginBottom: 4, fontWeight: 600 }}>DESCRIÇÃO</label>
            <input type="text" placeholder="Breve descrição" value={fD} onChange={e => setFD(e.target.value)} style={{ ...inp, marginBottom: 20 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button style={bt('g')} onClick={() => setMl(null)}>Cancelar</button><button style={{ ...bt(), opacity: fN.trim() ? 1 : 0.4 }} onClick={addP}>Criar Projeto</button></div>
          </>}
          {ml === 'nc' && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div><h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Adicionar Composições</h2><p style={{ fontSize: 10, color: TM, margin: '3px 0 0' }}>Projeto: {proj?.nome}</p></div>
              <button style={{ ...bt('g'), padding: 4, border: 'none' }} onClick={() => !importing && setMl(null)}>{ic.x}</button>
            </div>
            <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: TD, lineHeight: 1.5, margin: 0 }}><strong style={{ color: A }}>Individual ou Lote:</strong> Cole composições no padrão Markdown. IA Gemini detecta e extrai automaticamente. Fallback: separador <code style={{ color: A, background: AD, padding: '1px 4px', borderRadius: 3, fontSize: 10 }}># 🛠️ COMPOSIÇÃO</code></p>
            </div>
            <textarea placeholder="Cole aqui uma ou mais composições..." value={fC} onChange={e => { setFC(e.target.value); setAiComps(null); setAiError(null); }} style={{ width: '100%', padding: '14px 16px', background: BG, border: `1px solid ${BD}`, borderRadius: 8, color: TX, fontSize: 11, fontFamily: FN, outline: 'none', resize: 'vertical', minHeight: 300, lineHeight: 1.7 }} />
            {/* AI Parse Button */}
            {fC.trim() && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <button onClick={analyzeWithAI} disabled={aiParsing} style={{ ...bt(), background: aiComps ? GR : 'linear-gradient(135deg, #8B5CF6, #6366F1)', border: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '8px 16px', opacity: aiParsing ? 0.6 : 1 }}>
                {aiParsing ? <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Analisando...</> : aiComps ? '✅ IA Concluída' : '🤖 Analisar com IA'}
              </button>
              {aiError && <span style={{ fontSize: 10, color: '#EF4444' }}>⚠️ {aiError}</span>}
              {!aiComps && !aiParsing && <span style={{ fontSize: 10, color: TM }}>Regex detectou {batchCount} composiç{batchCount > 1 ? 'ões' : 'ão'}</span>}
            </div>}
            {/* Regex Preview */}
            {fC.trim() && !aiComps && <div style={{ marginTop: 12, padding: 12, background: BG, borderRadius: 8, border: `1px solid ${BD}` }}>
              <div style={{ fontSize: 9, color: TM, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700 }}>PREVIEW REGEX ({batchCount})</div>
              {splitComps(fC).map((txt, i) => {
                const p = parseComp(txt); return <div key={i} style={{ padding: '6px 0', borderBottom: i < batchCount - 1 ? `1px solid ${BD}` : 'none', fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: TM, fontFamily: FN, fontSize: 10 }}>{String(i + 1).padStart(2, '0')}</span>{p.codigo && <span style={{ ...bg(), fontSize: 8 }}>{p.codigo}</span>}<span style={{ color: TX, fontWeight: 500 }}>{p.titulo || '—'}</span></div>
                  <div style={{ color: TD, fontSize: 10, marginLeft: 22 }}>Un: {p.unidade || '—'}{p.custo ? ` • R$ ${p.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}{p.hh ? ` • ${p.hh} HH` : ''}</div>
                </div>;
              })}
            </div>}
            {/* AI Preview */}
            {aiComps && <div style={{ marginTop: 12, padding: 12, background: 'rgba(139,92,246,0.06)', borderRadius: 8, border: '1px solid rgba(139,92,246,0.3)' }}>
              <div style={{ fontSize: 9, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700 }}>🤖 COMPOSIÇÕES IDENTIFICADAS PELA IA ({aiComps.length})</div>
              {aiComps.map((c, i) => <div key={i} style={{ padding: '8px 0', borderBottom: i < aiComps.length - 1 ? '1px solid rgba(139,92,246,0.15)' : 'none', fontSize: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#A78BFA', fontFamily: FN, fontSize: 10, fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</span>
                  {c.codigo && <span style={{ background: 'rgba(139,92,246,0.15)', color: '#C4B5FD', padding: '1px 6px', borderRadius: 4, fontSize: 8, fontWeight: 600 }}>{c.codigo}</span>}
                  <span style={{ color: TX, fontWeight: 500 }}>{c.titulo || '—'}</span>
                </div>
                <div style={{ color: TD, fontSize: 10, marginLeft: 22, marginTop: 2 }}>
                  {c.unidade && `Un: ${c.unidade}`}{c.custo_unitario ? ` • R$ ${Number(c.custo_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}{c.hh_unitario ? ` • ${c.hh_unitario} HH` : ''}{c.equipe ? ` • ${c.equipe}` : ''}
                </div>
              </div>)}
            </div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button style={bt('g')} onClick={() => { if (!importing) { setMl(null); setAiComps(null); setAiError(null); } }}>Cancelar</button>
              <button style={{ ...bt(), opacity: fC.trim() && !importing ? 1 : 0.4, background: aiComps ? GR : A }} onClick={addComp} disabled={importing}>
                {importing ? 'Importando...' : aiComps ? `Salvar ${aiComps.length} da IA` : `Salvar ${batchCount > 1 ? batchCount + ' Composições' : 'Composição'}`}
              </button>
            </div>
          </>}
        </div>
      </div>}

      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${BG};overflow-x:hidden}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:3px}::selection{background:${A};color:${BG}}input:focus,textarea:focus{border-color:${A}!important;box-shadow:0 0 0 2px ${AD}}code{font-family:${FN}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
