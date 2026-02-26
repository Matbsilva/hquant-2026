'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeComposition } from '../lib/normalize';

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
  menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
};

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

  // CÓDIGO: Try multiple patterns for resilience
  const codigo = ex(/COMPOSIÇÃO:\s*([A-Z0-9][\w-]+)/i)
    || ex(/\*\*CÓDIGO:\*\*\s*(.+?)(?:\s*\||\s*$)/im)
    || ex(/CÓDIGO:\s*(.+?)(?:\s*\||\s*$)/im)
    || ex(/COMPOSIÇÃO:\s*(.+)/i);

  // TÍTULO: Try many patterns
  const titulo = ex(/🛠️\s*COMPOSIÇÃO[^-]*-\s*(.+)/i)
    || ex(/🛠️\s*ITEM\s*[\d.]+:\s*(.+)/i)
    || ex(/\*\*TÍTULO:\*\*\s*(.+?)(?:\s*$)/im)
    || ex(/TÍTULO:\s*(.+?)(?:\s*$)/im);

  const unidade = ex(/\*\*UNIDADE:\*\*\s*(.+?)(?:\s*\||\s*$)/im) || ex(/UNIDADE:\s*(.+?)(?:\s*\||\s*$)/im);
  const grupo = ex(/\*\*GRUPO:\*\*\s*(.+?)(?:\s*\||\s*$)/im) || ex(/GRUPO:\s*(.+?)(?:\s*\||\s*$)/im);
  const qref = ex(/\*\*QUANTIDADE (?:REF|DE REFERÊNCIA):\*\*\s*(.+?)(?:\s*\||\s*$)/im)
    || ex(/QUANTIDADE (?:REF|DE REFERÊNCIA):\s*(.+?)(?:\s*\||\s*$)/im)
    || ex(/\*\*REFERÊNCIA:\*\*\s*(.+?)(?:\s*\||\s*$)/im);
  const tagsR = ex(/\*\*TAGS:\*\*\s*(.+)/i) || ex(/TAGS:\s*(.+)/i);
  const tags = tagsR ? tagsR.split(',').map(t => t.trim().replace(/^#/, '').replace(/\*\*/g, '')).filter(Boolean) : [];

  let custo = null, hh = null;

  // CUSTO - look for CUSTO DIRETO TOTAL in table rows
  const allLines = text.split('\n');
  let custoRow = allLines.find(l => /\|\s*\*\*CUSTO DIRETO TOTAL/i.test(l));
  if (custoRow) {
    const rMatch = custoRow.match(/R\$\s*([\d.,]+)/g);
    // In the indicators table (Seção 5), the FIRST R$ is the unit cost (what we want)
    custo = rMatch && rMatch.length >= 1 ? parseNum(rMatch[0].replace(/R\$\s*/, '')) : null;
  }
  if (!custo) {
    const cM = text.match(/\*\*CUSTO DIRETO TOTAL\*\*[^R]*R\$\s*([\d.,]+)/i) || text.match(/CUSTO DIRETO TOTAL[^R]*R\$\s*([\d.,]+)/i);
    custo = cM ? parseNum(cM[1]) : null;
  }

  // HH - look for TOTAL M.O. in Seção 3
  // Find the section 3 table specifically (not section 4)
  const sec3Start = allLines.findIndex(l => l.includes('SEÇÃO 3') || l.includes('ESTIMATIVA DE MÃO DE OBRA'));
  const sec4Start = allLines.findIndex(l => l.includes('SEÇÃO 4') || l.includes('QUANTITATIVOS'));
  const searchEnd = sec4Start > -1 ? sec4Start : allLines.length;
  const searchStart = sec3Start > -1 ? sec3Start : 0;

  for (let i = searchStart; i < searchEnd; i++) {
    const l = allLines[i];
    if (/\|\s*\*\*TOTAL M\.O/i.test(l)) {
      const cols = l.split('|').map(x => x.replace(/\*\*/g, '').trim()).filter(Boolean);
      // Find the HH value — look for a decimal number that is NOT a currency value
      const numVals = cols.filter(c => /^[\d.,]+\s*(HH)?$/.test(c.trim()));
      if (numVals.length > 0) {
        // The last pure numeric value in TOTAL M.O. row is typically HH
        hh = parseNum(numVals[numVals.length - 1].replace(/\s*HH$/, ''));
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

  // Helper: check if line is a table separator (handles both short and long formats)
  const isSeparator = (l) => {
    const stripped = l.replace(/[\s|:\-]/g, '');
    return stripped.length === 0 && l.includes('-');
  };

  // 1. Custo material (SUBTOTAL da tabela de insumos)
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

  // 2. Custo M.O. total
  let custo_mo = null;
  const moRow = text.split('\n').find(l => /\|\s*\*\*TOTAL M\.O/i.test(l));
  if (moRow) {
    const vals = moRow.match(/R\$\s*([\d.,]+)/g);
    custo_mo = vals && vals.length >= 1 ? rp(vals[0]) : null;
  }

  // 3. Custo Equipamento
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
        const match = lines[i].match(/R\$\s*([\d.,]+)/g);
        // Value at index 1 is "Total" (Value 0 is "Unit")
        if (match && match.length >= 2) eqSum += rp(match[1]);
        else if (match && match.length === 1) eqSum += rp(match[0]);
      }
    }
    if (eqSum > 0) custo_equip = eqSum;
  }

  // 4. M.O. por Profissão (Seção 3 only)
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
        // Skip if nome looks like a number or separator
        if (/^[\d\-]+$/.test(nome.trim())) continue;
        const numVals = cols.filter(c => /^[\d.,]+\s*(HH)?$/.test(c.trim()));
        if (nome && numVals.length > 0) {
          hhProfs.push({ nome, hh: parseNum(numVals[numVals.length - 1].replace(/\s*HH$/, '')) });
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
  // Method 1: Split by # 🛠️ COMPOSIÇÃO headers
  const parts = text.split(/(?=^#\s*🛠️\s*(?:COMPOSIÇÃO|ITEM\s))/m).filter(t => t.trim().length > 50);
  if (parts.length > 1) return parts;

  // Method 2: Split by --- separator followed by # header
  const parts2 = text.split(/\n---\n(?=\s*#)/m).filter(t => t.trim().length > 50);
  if (parts2.length > 1) return parts2;

  // Method 3: Split by "✅ Composição ... CONCLUÍDA" markers (each composition ends with this)
  const parts3 = text.split(/(?<=✅\s*Composição\s+[\w-]+\s+CONCLUÍDA[^\n]*\n)(?=[\s\S]*?#\s*🛠️)/m).filter(t => t.trim().length > 50);
  if (parts3.length > 1) return parts3;

  return [text];
}

// --- MARKDOWN RENDERER ---
function Md({ text }) {
  if (!text) return null;
  const lines = text.split('\n'), els = [];
  let tR = [], tK = 0, lastH = '';
  const C = { a: '#D4AF37', ay: '#FBBF24', d: '#94A3B8', t: '#F8FAFC', m: '#64748B', bd: 'rgba(212,175,55,0.12)', lt: '#E2E8F0', err: '#EF4444', ok: '#10B981' };

  const flushT = () => {
    if (!tR.length) return;

    let hdr = [];
    if (!tR[0].includes('|')) {
      hdr = tR[0].replace(/^#\s*/, '').split(/\s{2,}|\t/).filter(Boolean).map(c => c.trim().replace(/\*\*/g, ''));
    } else {
      hdr = tR[0].split('|').filter(Boolean).map(c => c.trim().replace(/\*\*/g, ''));
      if (tR[0].startsWith('#')) {
        if (hdr.length > 0 && hdr[0] === '#') hdr.shift();
        else if (hdr.length > 0) hdr[0] = hdr[0].replace(/^#\s*/, '');
      }
    }

    const rows = tR.slice(1).filter(row => row.replace(/[\s|:\-]/g, '').length > 0);
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

    let isNextDivider = false;
    for (let j = 1; j <= 3; j++) {
      if (lines[i + j] !== undefined) {
        let nl = lines[i + j].trim();
        if (!nl) continue;
        if (nl.includes('-') && (nl.includes('|') || nl.startsWith('-'))) {
          if (nl.replace(/[\s|:\-]/g, '').length === 0) isNextDivider = true;
        }
        break;
      }
    }
    const isPipeRow = t.includes('|') && t.split('|').length > 1;

    if ((t.startsWith('|') && t.endsWith('|')) || (isPipeRow && (tR.length > 0 || isNextDivider)) || (tR.length === 0 && isNextDivider)) {
      tR.push(t); return;
    }
    // FIX: Don't flush table buffer on blank lines if next non-empty line continues the table
    if (tR.length && !t) {
      let nextContinuesTable = false;
      for (let k = i + 1; k < lines.length && k <= i + 3; k++) {
        const nxt = (lines[k] || '').trim();
        if (!nxt) continue;
        if (nxt.includes('|') && nxt.split('|').length > 1) nextContinuesTable = true;
        break;
      }
      if (nextContinuesTable) return; // skip blank line, keep table buffer open
    }
    if (tR.length) flushT();

    // ignore empty lines unless they were skipped by table loop
    if (!t) return;

    if (t === '---' || t === '***' || t === '* * *') { els.push(<hr key={i} style={{ border: 'none', borderTop: `1px solid ${C.bd}`, margin: '20px 0' }} />); return; }

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

    // Inline metadata items that might be glued on the same line (like tags + classificacao)
    if (t.includes('**') && t.includes(':**')) {
      // Split by **KEY:** 
      const parts = t.split(/(\*\*[A-ZÀ-Ú0-9\s/]+:\*\*)/g).filter(Boolean);
      if (parts.length > 1 && parts[0].startsWith('**')) {
        let metaEls = [];
        for (let j = 0; j < parts.length; j += 2) {
          const key = parts[j].replace(/\*\*/g, '').replace(':', '');
          const val = (parts[j + 1] || '').trim();
          metaEls.push(<div key={i + '-' + j} style={{ margin: '6px 0', fontSize: 12, lineHeight: 1.6 }}><span style={{ color: C.a, fontWeight: 600 }}>{key}:</span> <span style={{ color: C.lt }}>{val.replace(/\*\*/g, '')}</span></div>);
        }
        els.push(<div key={i}>{metaEls}</div>);
        return;
      }

      const clean = t.replace(/\*\*/g, ''); const idx = clean.indexOf(':');
      if (idx > 0) { els.push(<div key={i} style={{ margin: '6px 0', fontSize: 12, lineHeight: 1.6 }}><span style={{ color: C.a, fontWeight: 600 }}>{clean.slice(0, idx)}:</span> <span style={{ color: C.lt }}>{clean.slice(idx + 1).trim()}</span></div>); return; }
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
    if (t.includes('5.1 ANÁLISE DE CUSTO')) {
      els.push(
        <div key={i} style={{ margin: '24px 0 12px', padding: '14px 20px', background: 'rgba(59, 130, 246, 0.08)', borderLeft: `3px solid ${BL}`, borderRadius: '0 8px 8px 0' }}>
          <div style={{ color: BL, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📈 {t.replace(/\*\*/g, '').replace(/^#+\s*/, '')}</div>
        </div>
      );
      return;
    }

    // Composição do Custo Unitário header
    if (t === 'Composição do Custo Unitário:' || t === 'Composição do Custo Unitário') {
      els.push(<div key={i} style={{ margin: '12px 0 6px', fontSize: 12, color: C.a, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{t}</div>);
      return;
    }

    // Cost breakdown lines: "Material: R$ ...", "Equipamentos: R$ ...", "Mão de Obra: R$ ...", "TOTAL: R$ ..."
    const costLineMatch = t.match(/^(Material|Equipamentos?|Mão de Obra|TOTAL):?\s+(R\$\s*[\d.,]+\/[\w²³]+)\s*(\([^)]+\))?\s*(←\s*.+)?$/i);
    if (costLineMatch) {
      const label = costLineMatch[1];
      const value = costLineMatch[2];
      const pct = costLineMatch[3] || '';
      const arrow = costLineMatch[4] || '';
      const isTotal = /TOTAL/i.test(label);
      els.push(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', margin: '2px 0', background: isTotal ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 12, flexWrap: 'wrap' }}>
          <span style={{ color: isTotal ? C.a : C.lt, fontWeight: isTotal ? 700 : 500, minWidth: 110 }}>{label}:</span>
          <span style={{ color: isTotal ? C.a : C.ay, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{value}</span>
          {pct && <span style={{ color: C.d, fontSize: 11 }}>{pct}</span>}
          {arrow && <span style={{ background: 'rgba(96,165,250,0.12)', color: '#60A5FA', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>{arrow.replace('←', '◂').trim()}</span>}
        </div>
      );
      return;
    }

    const formatRich = (text) => {
      let t2 = text.replace(/\*\*/g, '');
      const kws = [
        { r: /(DRIVER PRINCIPAL)/gi, c: C.a, bg: 'rgba(245,158,11,0.1)', i: '🔥 ' },
        { r: /(SEGUNDO DRIVER)/gi, c: '#60A5FA', bg: 'rgba(96,165,250,0.1)', i: '💧 ' },
        { r: /(CRÍTICO:?|ALERTA ACORDADO:?|NOTA:?)/gi, c: '#EF4444', bg: 'rgba(239,68,68,0.1)', i: '⚠️ ' },
        { r: /(Economia:?|-R\$|\+R\$|Trade-off:?)/gi, c: '#22C55E', bg: 'rgba(34,197,94,0.1)', i: '💡 ' }
      ];

      let matched = false;
      let el = t2;
      for (const kw of kws) {
        if (kw.r.test(t2)) {
          matched = true;
          // Split by the keyword and wrap it in a styled pill
          const parts = t2.split(kw.r);
          el = parts.map((p, pIdx) => {
            if (p.match(kw.r)) {
              return <span key={pIdx} style={{ background: kw.bg, color: kw.c, padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11, letterSpacing: '0.5px', whiteSpace: 'nowrap', display: 'inline-block', lineHeight: 1.6 }}>{kw.i}{p.toUpperCase()}</span>;
            }
            return p;
          });
          break; // apply only the first major matching rule per line for simplicity
        }
      }

      // If no custom semantic keyword matched, but the original text had bold (**), render standard logic
      if (!matched && text.includes('**')) {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((p, pi) => p.startsWith('**') ? <strong key={pi} style={{ color: C.t, fontWeight: 600 }}>{p.replace(/\*\*/g, '')}</strong> : p);
      }

      return matched ? el : t2;
    };

    if (t.includes('**') || /(DRIVER|NOTA|CRÍTICO|ALERTA|Economia|Trade-off)/i.test(t)) {
      els.push(<div key={i} style={{ margin: isIndented ? '4px 0 4px 12px' : '6px 0', fontSize: 13, color: C.lt, lineHeight: 1.8, flexWrap: 'wrap' }}>{formatRich(t)}</div>);
      return;
    }

    if (t.length > 0) els.push(<div key={i} style={{ margin: isIndented ? '4px 0 4px 12px' : '6px 0', fontSize: 13, color: C.lt, lineHeight: 1.6 }}>{t}</div>);
  });

  flushT();
  return <div>{els}</div>;
}

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
  const [isMobile, setIsMobile] = useState(false);
  const [sbOpen, setSbOpen] = useState(false);
  const [sbPinned, setSbPinned] = useState(true);
  const [selMode, setSelMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmBatchDel, setConfirmBatchDel] = useState(false);
  const [dragInfo, setDragInfo] = useState(null);
  const [seqMap, setSeqMap] = useState({});
  const [validationWarning, setValidationWarning] = useState(null);

  // --- COMPUTED STATES ---
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

  useEffect(() => {
    if (vw !== 'proj') {
      if (Object.keys(seqMap).length > 0) setSeqMap({});
    } else if (pid && pComps.length > 0) {
      setSeqMap(prev => {
        let newMap = { ...prev };
        let changed = false;
        pComps.forEach((c) => {
          if (!newMap[c.id]) {
            newMap[c.id] = Object.keys(newMap).length + 1;
            changed = true;
          }
        });
        return changed ? newMap : prev;
      });
    }
  }, [vw, pid, pComps]);

  const nf = (m, ok = true) => { setNt({ m, ok }); setTimeout(() => setNt(null), 3000); };

  const toggleSel = (id) => setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const selectAll = (ids) => setSelectedIds(new Set(ids));
  const clearSel = () => { setSelectedIds(new Set()); setSelMode(false); };

  const downloadMD = (comps) => {
    const content = comps.map(c => normalizeComposition(c.conteudo_completo)).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = comps.length === 1 ? `${comps[0].codigo || 'composicao'}.md` : `composicoes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const batchDelete = async () => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => supabase.from('composicoes').delete().eq('id', id)));
    setComposicoes(prev => prev.filter(c => !selectedIds.has(c.id)));
    clearSel();
    setConfirmBatchDel(false);
    nf(`${ids.length} composiç${ids.length > 1 ? 'ões excluídas' : 'ão excluída'}`);
  };

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
  useEffect(() => {
    const handleResize = () => { setIsMobile(window.innerWidth <= 768); if (window.innerWidth > 768) setSbOpen(false); };
    handleResize(); window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const addComp = async (force = false) => {
    if (!fC.trim() || !pid) return;

    const parts = splitComps(fC);

    if (!force) {
      const missingSectionsComps = [];
      parts.forEach((txt, idx) => {
        const missing = [];
        for (let i = 1; i <= 7; i++) {
          if (!new RegExp(`SEÇÃO ${i}|SECAO ${i}`, 'i').test(txt)) {
            missing.push(i);
          }
        }
        if (missing.length > 0) {
          const tituloFallback = txt.split('\n').find(l => l.trim().length > 5)?.replace(/[#*🛠️]/g, '').trim().slice(0, 100) || `Composição ${idx + 1}`;
          const title = aiComps && aiComps[idx] ? (aiComps[idx].titulo || tituloFallback) : tituloFallback;
          missingSectionsComps.push({ title, missing });
        }
      });

      if (missingSectionsComps.length > 0) {
        setValidationWarning(missingSectionsComps);
        return;
      }
    }

    setValidationWarning(null);
    setImporting(true);
    let rows;
    const baseTime = Date.now();

    // Use AI-parsed data if available
    if (aiComps && aiComps.length > 0) {
      const textParts = splitComps(fC);
      rows = aiComps.map((c, i) => ({
        projeto_id: pid,
        created_at: new Date(baseTime + i * 1000).toISOString(),
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
      rows = parts.map((txt, i) => {
        const p = parseComp(txt);
        return {
          projeto_id: pid,
          created_at: new Date(baseTime + i * 1000).toISOString(),
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

  const onDropComp = async (e, targetCid) => {
    e.preventDefault();
    setDragInfo(null);
    if (selMode) return;
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetCid) return;

    const compList = [...pComps];
    const fromIdx = compList.findIndex(c => c.id === draggedId);
    const toIdx = compList.findIndex(c => c.id === targetCid);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = compList.splice(fromIdx, 1);
    compList.splice(toIdx, 0, moved);

    const earliest = compList.reduce((min, c) => Math.min(min, new Date(c.created_at).getTime()), Date.now() - compList.length * 1000);
    const updates = compList.map((c, i) => ({ ...c, created_at: new Date(earliest + i * 1000).toISOString() }));

    setComposicoes(prev => {
      const other = prev.filter(p => p.projeto_id !== pid);
      return [...other, ...updates].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    const { error } = await supabase.from('composicoes').upsert(updates.map(({ id, projeto_id, codigo, titulo, unidade, grupo, tags, conteudo_completo, custo_unitario, hh_unitario, created_at }) => ({
      id, projeto_id, codigo, titulo, unidade, grupo, tags, conteudo_completo, custo_unitario, hh_unitario, created_at
    })));
    if (error) nf('Erro ao salvar nova ordem', false);
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
    <div style={{ minHeight: '100vh', background: BG, color: TX, fontFamily: FS, display: 'flex', overflowX: 'hidden' }}>
      {(isMobile || !sbPinned) && <button onClick={() => setSbOpen(!sbOpen)} style={{ position: 'fixed', top: 16, left: 16, zIndex: 60, background: SF, border: `1px solid ${BD}`, color: TX, padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic.menu}</button>}
      {(isMobile || !sbPinned) && sbOpen && <div onClick={() => setSbOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />}
      {/* SIDEBAR */}
      <div style={{ width: 210, background: SF, borderRight: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: (isMobile || !sbPinned) ? (sbOpen ? 0 : -210) : 0, bottom: 0, zIndex: 50, transition: 'left 0.3s' }}>
        <div onClick={() => { setVw('home'); setPid(null); setCid(null); if (isMobile || !sbPinned) setSbOpen(false); }} style={{ padding: '18px 14px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, borderRadius: 6, background: AD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: A, fontSize: 15, fontWeight: 800, fontFamily: FN }}>H</div>
          <div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: FN, letterSpacing: '0.5px' }}>H-QUANT</div><div style={{ fontSize: 10, color: TL, letterSpacing: '2px' }}>COMPOSIÇÕES 2026</div></div>
        </div>
        <div style={{ padding: '10px 0', flex: 1 }}>
          {[['home', ic.folder, 'Projetos'], ['busca', ic.search, 'Buscar Composição']].map(([id, icon, label]) => {
            const act = vw === id || (id === 'home' && ['proj', 'comp'].includes(vw));
            return <div key={id} onClick={() => { setVw(id); setPid(null); setCid(null); if (id === 'busca') setQ(''); if (isMobile || !sbPinned) setSbOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 16px', cursor: 'pointer', color: act ? A : TL, background: act ? AD : 'transparent', borderLeft: act ? `2px solid ${A}` : '2px solid transparent', fontSize: 13, fontWeight: act ? 600 : 400 }}>{icon}<span>{label}</span></div>;
          })}
        </div>
        {!isMobile && (
          <div style={{ padding: '10px 16px', cursor: 'pointer', color: TL, display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }} onClick={() => { setSbPinned(!sbPinned); setSbOpen(false); }}>
            {ic.pin}<span>{sbPinned ? 'Recolher Menu' : 'Fixar Menu'}</span>
          </div>
        )}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${BD}`, fontSize: 12, color: TL }}>{projetos.length} projetos • {tot} composições</div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: (!isMobile && sbPinned) ? 210 : 0, flex: 1, padding: (!isMobile && sbPinned) ? '0 32px 32px' : '70px 32px 32px', minHeight: '100vh', maxWidth: 1600, transition: 'all 0.3s', width: '100%' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, paddingRight: 10 }}><span style={{ color: A }}>{ic.folder}</span><span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#FFFFFF' }}>{p.nome}</span></div>
                <button title="Excluir Projeto" onClick={e => { e.stopPropagation(); delP(p.id); }} style={{ ...bt('g'), padding: 6, border: 'none', background: 'transparent', color: '#EF4444', transition: 'all 0.2s', opacity: 0.4 }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.opacity = '1'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.4'; }}>{ic.trash}</button>
              </div>
              {p.descricao && <p style={{ fontSize: 12, color: TL, margin: '8px 0 0', lineHeight: 1.5 }}>{p.descricao.slice(0, 120)}{p.descricao.length > 120 ? '...' : ''}</p>}
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}><span style={bg()}>{pCnt(p.id)} comp</span><span style={{ fontSize: 9, color: TM }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span></div>
            </div>)}
            {!projetos.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: TM }}><div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>📁</div><p style={{ fontSize: 14 }}>Nenhum projeto ainda</p></div>}
          </div>
        </>}

        {/* PROJECT */}
        {vw === 'proj' && pid && <>
          {/* STICKY HEADER */}
          <div style={{ position: 'sticky', top: 0, zIndex: 20, background: BG, borderBottom: `1px solid ${BD}`, padding: '16px 0', marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{ ...bt('g'), padding: 6 }} onClick={() => { setVw('home'); setPid(null); clearSel(); }}>{ic.back}</button>
              <div><h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: FN }}>{proj?.nome}</h1>{proj?.descricao && <p style={{ fontSize: 13, color: TL, margin: '3px 0 0' }}>{proj.descricao}</p>}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selMode ? (
                <>
                  <button style={{ ...bt('g'), fontSize: 11, padding: '5px 10px', color: GR, borderColor: 'rgba(34,197,94,0.3)', transition: 'all 0.2s' }} onClick={() => selectAll(pComps.map(c => c.id))} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.15)'; e.currentTarget.style.borderColor = GR; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; }}>Todos</button>
                  <button style={{ ...bt('g'), fontSize: 11, padding: '5px 10px', color: RD, borderColor: 'rgba(239,68,68,0.3)', transition: 'all 0.2s' }} onClick={clearSel} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = RD; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}>Cancelar</button>
                </>
              ) : (
                <button style={{ ...bt('g'), fontSize: 11, padding: '6px 12px', color: GR, borderColor: 'rgba(34,197,94,0.3)', transition: 'all 0.2s' }} onClick={() => { setSelMode(true); setSelectedIds(new Set()); }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.15)'; e.currentTarget.style.borderColor = GR; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                  Selecionar
                </button>
              )}
              <button style={{ ...bt(), transition: 'all 0.2s' }} onClick={() => { setMl('nc'); setFC(''); }} onMouseEnter={e => { e.currentTarget.style.background = A; e.currentTarget.style.color = BG; e.currentTarget.style.boxShadow = '0 0 12px rgba(245,158,11,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; e.currentTarget.style.boxShadow = 'none'; }}>{ic.plus} Composição</button>
            </div>
          </div>

          {pComps.map((c, i) => {
            const det = parseCompDetail(c.conteudo_completo);
            const mData = c.conteudo_completo.match(/\*\*DATA:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.conteudo_completo.match(/DATA:\s*(.*?)(?:\n|$|\|)/i);
            const dataV = mData ? mData[1].split(/\*\*/)[0].trim() : '';
            const un = c.unidade || 'un';
            const isSel = selectedIds.has(c.id);

            return (
              <div key={c.id} draggable={!selMode}
                onDragStart={e => { e.dataTransfer.setData('text/plain', c.id); setDragInfo(c.id); }}
                onDragEnd={() => setDragInfo(null)}
                onDragOver={e => { e.preventDefault(); if (dragInfo && dragInfo !== c.id) e.currentTarget.style.borderTop = `2px solid ${A}`; }}
                onDragLeave={e => { if (dragInfo && dragInfo !== c.id) e.currentTarget.style.borderTop = ''; }}
                onDrop={e => { e.currentTarget.style.borderTop = ''; onDropComp(e, c.id); }}
                style={{ ...cd, padding: '16px 20px', marginBottom: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, borderColor: isSel ? A : BD, background: dragInfo === c.id ? `rgba(245,158,11,0.02)` : (isSel ? `rgba(245,158,11,0.06)` : SF), transition: 'all 0.15s', cursor: selMode ? 'pointer' : (dragInfo ? 'grabbing' : 'grab') }}
                onClick={() => { if (selMode) { toggleSel(c.id); } else { setCid(c.id); setVw('comp'); } }}
                onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = A; e.currentTarget.style.background = S2; } }}
                onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = BD; e.currentTarget.style.background = SF; } }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', transition: 'all 0.2s' }}>
                    {selMode ? (
                      <div style={{ width: 22, height: 22, borderRadius: 5, border: `2px solid ${isSel ? A : TM}`, background: isSel ? A : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 }}>
                        {isSel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                      </div>
                    ) : (
                      <div style={{ color: A, fontSize: 11, fontFamily: FN, background: AD, borderRadius: 6, padding: '4px 10px', fontWeight: 800, textAlign: 'center', marginTop: 2 }}>#{String(seqMap[c.id] || i + 1).padStart(2, '0')}</div>
                    )}
                    {!selMode && <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                      <button className="list-btn" title="Copiar" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(normalizeComposition(c.conteudo_completo) || ''); setNt({ ok: true, m: 'Copiado!' }); setTimeout(() => setNt(null), 2000); }} style={{ ...bt('g'), padding: '5px 4px', border: 'none', background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', width: '100%', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#38BDF8'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; e.currentTarget.style.color = '#38BDF8'; }}>{ic.copy}</button>
                      <button className="list-btn" title="Baixar .MD" onClick={e => { e.stopPropagation(); downloadMD([c]); }} style={{ ...bt('g'), padding: '5px 4px', border: 'none', background: 'rgba(167, 139, 250, 0.1)', color: '#A78BFA', width: '100%', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#A78BFA'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'; e.currentTarget.style.color = '#A78BFA'; }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg></button>
                      <button className="list-btn" title="Excluir" onClick={e => { e.stopPropagation(); setConfirmDel(c); }} style={{ ...bt('g'), padding: '5px 4px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', width: '100%', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#EF4444'; }}>{ic.trash}</button>
                    </div>}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      {c.codigo && <span style={{ ...bg(A), fontSize: 10, padding: '3px 8px', letterSpacing: '0.5px' }}>{c.codigo}</span>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: '#FFFFFF', marginBottom: 6 }}>{cleanMd(c.titulo)}</div>

                    {(() => {
                      const mData = c.conteudo_completo.match(/\*\*DATA:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.conteudo_completo.match(/DATA:\s*(.*?)(?:\n|$|\|)/i);
                      const dataV = mData ? mData[1].split(/\*\*/)[0].trim() : '';

                      const mTurno = c.conteudo_completo.match(/\*\*TURNO:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.conteudo_completo.match(/TURNO:\s*(.*?)(?:\n|$|\|)/i);
                      const turnoV = mTurno ? mTurno[1].split(/\*\*/)[0].trim() : '';

                      const mFator = c.conteudo_completo.match(/\*\*FATOR:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.conteudo_completo.match(/FATOR:\s*(.*?)(?:\n|$|\|)/i);
                      const fatorV = mFator ? mFator[1].split(/\*\*/)[0].trim() : '';

                      const mQref = c.conteudo_completo.match(/\*\*QUANTIDADE (?:REF|DE REFERÊNCIA):\*\*\s*(.*?)(?:\n|$|\|)/i) || c.conteudo_completo.match(/QUANTIDADE (?:REF|DE REFERÊNCIA):\s*(.*?)(?:\n|$|\|)/i) || c.conteudo_completo.match(/\*\*REFERÊNCIA:\*\*\s*(.*?)(?:\n|$|\|)/i);
                      const qrefV = mQref ? mQref[1].split(/\*\*/)[0].trim() : (c.qref || '');

                      return (
                        <div style={{ fontSize: 11, color: TM, display: 'flex', gap: 14, flexWrap: 'wrap', lineHeight: 1.4 }}>
                          {dataV && <span><strong style={{ color: TL, fontWeight: 600 }}>DATA:</strong> {dataV} &nbsp; </span>}
                          {turnoV && <span><strong style={{ color: TL, fontWeight: 600 }}>TURNO:</strong> {turnoV} &nbsp; </span>}
                          {fatorV && <span><strong style={{ color: TL, fontWeight: 600 }}>FATOR:</strong> {fatorV} &nbsp; </span>}
                          {qrefV && <span><strong style={{ color: TL, fontWeight: 600 }}>REF:</strong> {qrefV} &nbsp; </span>}
                          {det.equipe && <span style={{ whiteSpace: 'normal', display: 'block' }}><strong style={{ color: TL, fontWeight: 600 }}>EQUIPE:</strong> {det.equipe.slice(0, 200)}{det.equipe.length > 200 ? '...' : ''}</span>}
                        </div>
                      );
                    })()}
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

          {/* BATCH ACTION BAR */}
          {selMode && selectedIds.size > 0 && (
            <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: S2, border: `1px solid ${A}`, borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 13, color: A, fontWeight: 700, fontFamily: FN }}>{selectedIds.size} selecionada{selectedIds.size !== 1 ? 's' : ''}</span>
              <div style={{ width: 1, height: 20, background: BD }} />
              <button onClick={() => { const selComps = pComps.filter(c => selectedIds.has(c.id)); downloadMD(selComps); }} style={{ ...bt('g'), padding: '7px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#A78BFA', borderColor: 'rgba(167,139,250,0.3)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.15)'; e.currentTarget.style.borderColor = '#A78BFA'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Baixar .MD
              </button>
              <button onClick={() => setConfirmBatchDel(true)} style={{ ...bt('g'), padding: '7px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: RD, borderColor: 'rgba(239,68,68,0.3)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = RD; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}>
                {ic.trash} Excluir
              </button>
            </div>
          )}

          {/* FAB BUTTON FOR ADD COMP */}
          <button
            title="Adicionar Composição"
            onClick={() => { setMl('nc'); setFC(''); }}
            style={{ position: 'fixed', bottom: 32, right: 32, background: A, color: BG, width: 60, height: 60, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(245,158,11,0.5)', cursor: 'pointer', border: 'none', zIndex: 90, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.5)'; }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </>}


        {/* COMP DETAIL */}
        {vw === 'comp' && comp && (() => {
          const det = parseCompDetail(comp.conteudo_completo);
          const un = comp.unidade || 'un';
          const compIdx = pComps.findIndex(c => c.id === comp.id);
          const seqNum = compIdx >= 0 ? `#${String(compIdx + 1).padStart(2, '0')}` : '';
          const cleanGrupo = comp.grupo ? comp.grupo.split(/\*\*/)[0].trim() : '';

          const mQref = comp.conteudo_completo.match(/\*\*QUANTIDADE (?:REF|DE REFERÊNCIA):\*\*\s*(.*?)(?:\n|$|\|)/i) || comp.conteudo_completo.match(/QUANTIDADE (?:REF|DE REFERÊNCIA):\s*(.*?)(?:\n|$|\|)/i) || comp.conteudo_completo.match(/\*\*REFERÊNCIA:\*\*\s*(.*?)(?:\n|$|\|)/i);
          const qrefDetailV = mQref ? mQref[1].split(/\*\*/)[0].trim() : (comp.qref || '');

          const indCard = (label, value, color, suffix, highlight = false) => value != null ? (
            <div style={{ background: highlight ? `${color}10` : BG, border: `1px solid ${highlight ? `${color}30` : BD}`, borderTop: highlight ? `3px solid ${color}` : `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
              <div style={{ fontSize: 10, color: highlight ? color : TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: highlight ? TX : color, fontFamily: FN }}>{typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : value}{suffix && <span style={{ fontSize: 11, color: highlight ? color : TL, fontWeight: 500 }}> {suffix}</span>}</div>
            </div>
          ) : null;
          return <>
            <div style={{ padding: '24px 0 16px', borderBottom: `1px solid ${BD}`, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{ ...bt('g'), padding: 6 }} onClick={() => { setVw(pid ? 'proj' : 'busca'); setCid(null); }}>{ic.back}</button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{seqNum && <span style={{ color: A, fontSize: 11, fontFamily: FN, background: AD, borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>{seqNum}</span>}{comp.codigo && <span style={bg()}>{comp.codigo}</span>}<h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{cleanMd(comp.titulo)}</h1></div>
                <p style={{ fontSize: 12, color: TL, margin: '4px 0 0' }}>Projeto: {pName(comp.projeto_id)}{cleanGrupo && ` • ${cleanGrupo}`}{comp.unidade && ` • Un: ${comp.unidade}`}</p>
              </div>
              <button title="Baixar .MD" onClick={() => downloadMD([comp])} style={{ ...bt('g'), padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#A78BFA', borderColor: 'rgba(167,139,250,0.2)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.15)'; e.currentTarget.style.borderColor = '#A78BFA'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)'; }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Baixar .MD</button>
              <button title="Copiar composição" onClick={() => { navigator.clipboard.writeText(normalizeComposition(comp.conteudo_completo) || ''); setNt({ ok: true, m: 'Composição copiada!' }); setTimeout(() => setNt(null), 2000); }} style={{ ...bt('g'), padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#38BDF8', borderColor: 'rgba(56,189,248,0.2)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>{ic.copy} Copiar</button>
              <button title="Apagar composição" onClick={() => setConfirmDel(comp)} style={{ ...bt('g'), padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>{ic.trash} Apagar</button>
            </div>
            {comp.tags?.length > 0 && <div style={{ marginBottom: 14 }}>{comp.tags.map((t, i) => { const pureTag = t.split(/\*\*/)[0].trim(); return pureTag ? <span key={i} style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: 10, background: 'rgba(255,255,255,0.06)', color: TL, marginRight: 5 }}>#{pureTag.replace(/^#/, '')}</span> : null })}</div>}
            {/* --- INDICADORES CONSOLIDADOS --- */}
            <div style={{ background: SF, border: `1px solid ${BD}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: A, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>📊 Indicadores</div>
              {/* Row 1: Custos */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {indCard(`Custo Direto Total/${un}`, comp.custo_unitario ? Number(comp.custo_unitario) : null, '#10B981', `R$/${un}`, true)}
                {indCard(`Material/${un}`, det.custo_material, '#F59E0B', `R$/${un}`, true)}
                {indCard(`Mão de Obra/${un}`, det.custo_mo, BL, `R$/${un}`, true)}
                {indCard(`Equipamento/${un}`, det.custo_equip, '#A78BFA', `R$/${un}`, true)}
              </div>
              {/* Row 2: HH e Equipe */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {det.hhProfs.map((p, i) => <div key={i} style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>HH {p.nome}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TX, fontFamily: FN }}>{p.hh.toLocaleString('pt-BR', { minimumFractionDigits: 4 })} <span style={{ fontSize: 11, color: TL, fontWeight: 500 }}>HH/{un}</span></div>
                </div>)}
                {comp.hh_unitario && <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>HH Total Equipe/{un}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TX, fontFamily: FN }}>{comp.hh_unitario}</div>
                </div>}
                {det.equipe && <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 200px', minWidth: 180 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>Composição da Equipe</div>
                  <div style={{ fontSize: 14, color: TX, fontWeight: 500 }}>{det.equipe}</div>
                </div>}
              </div>
              {/* Row 3: Produtividade, Rendimento, Qtd Ref, Peso */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {det.produtividade && <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>Produtividade/Dia</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TX, fontFamily: FN }}>{det.produtividade} <span style={{ fontSize: 11, color: TL, fontWeight: 500 }}>{un}/dia</span></div>
                </div>}
                {det.rendimento && <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>Rendimento Diário</div>
                  <div style={{ fontSize: 14, color: GR, fontWeight: 600, fontFamily: FN }}>{det.rendimento}</div>
                </div>}
                {qrefDetailV && <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 8, padding: '12px 14px', flex: '1 1 140px', minWidth: 130 }}>
                  <div style={{ fontSize: 10, color: TM, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>Qtd. de Referência</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TX, fontFamily: FN }}>{qrefDetailV}</div>
                </div>}
                {indCard(`Peso/${un}`, det.peso_total, TL, 'kg')}
              </div>
            </div>
            <div style={{ background: SF, border: `1px solid ${BD}`, borderRadius: 10, padding: 26 }}><Md text={normalizeComposition(comp.conteudo_completo)} /></div>
          </>;
        })()}

        {/* SEARCH */}
        {vw === 'busca' && <>
          <div style={{ padding: '24px 0 16px', borderBottom: `1px solid ${BD}`, marginBottom: 22 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: FN }}>Buscar Composição</h1>
          </div>
          <div style={{ position: 'relative', marginBottom: 22 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: TM }}>{ic.search}</div>
            <input type="text" placeholder="contrapiso, sóculo, CIV-SOCULO..." value={q} onChange={e => setQ(e.target.value)} style={{ ...inp, paddingLeft: 40, padding: '13px 14px 13px 40px' }} autoFocus />
          </div>
          {q && <p style={{ fontSize: 11, color: TM, marginBottom: 14 }}>{sR.length} resultado{sR.length !== 1 ? 's' : ''}</p>}
          {sR.map(c => <div key={c.id} style={{ ...cd, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={() => { setCid(c.id); setPid(c.projeto_id); setVw('comp'); }}
              onMouseEnter={e => { e.currentTarget.parentElement.style.borderColor = A; e.currentTarget.parentElement.style.background = S2; }}
              onMouseLeave={e => { e.currentTarget.parentElement.style.borderColor = BD; e.currentTarget.parentElement.style.background = SF; }}
            >
              <span style={{ color: A, marginTop: 2, flexShrink: 0 }}>{ic.file}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>{c.codigo && <span style={{ ...bg(), fontSize: 9 }}>{c.codigo}</span>}<span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'normal', lineHeight: 1.5 }}>{cleanMd(c.titulo)}</span></div>
                <div style={{ fontSize: 11, color: TL, marginTop: 4 }}>Projeto: {pName(c.projeto_id)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {c.custo_unitario && <span style={{ fontSize: 13, color: A, fontWeight: 600, fontFamily: FN }}>R$ {Number(c.custo_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
              <button title="Copiar" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(normalizeComposition(c.conteudo_completo) || ''); setNt({ ok: true, m: 'Copiado!' }); setTimeout(() => setNt(null), 2000); }} style={{ ...bt('g'), padding: '5px 8px', border: 'none', background: 'rgba(56,189,248,0.1)', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#38BDF8'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; e.currentTarget.style.color = '#38BDF8'; }}>{ic.copy}</button>
              <button title="Excluir" onClick={e => { e.stopPropagation(); setConfirmDel(c); }} style={{ ...bt('g'), padding: '5px 8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: RD, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = RD; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = RD; }}>{ic.trash}</button>
            </div>
          </div>)}
          {q && !sR.length && <div style={{ textAlign: 'center', padding: 50, color: TM }}>Nenhum resultado</div>}
          {!q && <div style={{ textAlign: 'center', padding: 60, color: TM, opacity: 0.3 }}><div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div><p>Digite para buscar...</p></div>}
        </>}

      </div >

      {/* DELETE CONFIRMATION MODAL */}
      {
        confirmDel && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmDel(null)}>
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
        </div>
      }


      {/* BATCH DELETE CONFIRMATION MODAL */}
      {
        confirmBatchDel && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmBatchDel(false)}>
          <div style={{ background: SF, border: `1px solid ${RD}`, borderRadius: 12, padding: 28, maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: RD, marginBottom: 10 }}>⚠️ Excluir {selectedIds.size} composiç{selectedIds.size !== 1 ? 'ões' : 'ão'}?</div>
            <div style={{ fontSize: 12, color: TL, marginBottom: 6 }}>As seguintes composições serão removidas permanentemente:</div>
            <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pComps.filter(c => selectedIds.has(c.id)).map(c => (
                <div key={c.id} style={{ fontSize: 11, color: TM, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {c.codigo && <span style={{ ...bg(RD), fontSize: 8 }}>{c.codigo}</span>}
                  <span style={{ color: TL }}>{cleanMd(c.titulo).slice(0, 70)}...</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: TM, marginBottom: 20 }}>Esta ação não pode ser desfeita.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmBatchDel(false)} style={{ ...bt('g'), padding: '8px 16px' }}>Cancelar</button>
              <button onClick={batchDelete} style={{ ...bt('d'), padding: '8px 16px' }}>Excluir {selectedIds.size}</button>
            </div>
          </div>
        </div>
      }

      {/* MISSING SECTIONS VALIDATION MODAL */}
      {
        validationWarning && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1005, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setValidationWarning(null)}>
          <div style={{ background: SF, border: `1px solid ${BD}`, borderRadius: 12, padding: 28, maxWidth: 480, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>⚠️ Aviso de Validação</div>
            <div style={{ fontSize: 13, color: TL, marginBottom: 16, lineHeight: 1.5 }}>As seguintes composições não possuem todas as seções (1 a 7) recomendadas. Isso pode resultar em indicadores ou cálculos incorretos.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {validationWarning.map((warn, i) => (
                <div key={i} style={{ padding: 10, background: BG, borderRadius: 6, border: `1px solid ${BD}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TX, marginBottom: 4 }}>{warn.title}</div>
                  <div style={{ fontSize: 11, color: RD, fontWeight: 500 }}>Seções não encontradas: {warn.missing.map(m => `Seção ${m}`).join(', ')}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setValidationWarning(null)} style={{ ...bt('g'), padding: '8px 16px' }}>Cancelar</button>
              <button onClick={() => { setValidationWarning(null); addComp(true); }} style={{ ...bt('p'), padding: '8px 16px', background: '#F59E0B', color: BG }}>Adicionar Mesmo Assim</button>
            </div>
          </div>
        </div>
      }

      {/* MODALS */}
      {
        ml && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, backdropFilter: 'blur(4px)' }} onClick={() => !importing && setMl(null)}>
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
                <p style={{ fontSize: 11, color: TD, lineHeight: 1.5, margin: 0, marginBottom: 8 }}><strong style={{ color: A }}>Individual ou Lote:</strong> Cole composições no padrão Markdown ou faça upload dos arquivos .md abaixo.</p>
                <input type="file" multiple accept=".md" onChange={async e => {
                  const files = Array.from(e.target.files);
                  if (!files.length) return;
                  const texts = await Promise.all(files.map(f => new Promise(res => {
                    const reader = new FileReader();
                    reader.onload = e => res(e.target.result);
                    reader.readAsText(f);
                  })));
                  setFC(prev => (prev ? prev + '\n\n\n' : '') + texts.join('\n\n\n'));
                }} style={{ fontSize: 11, color: TL }} />
              </div>
              <textarea placeholder="Cole aqui uma ou mais composições ou faça o upload acima..." value={fC} onChange={e => { setFC(e.target.value); setAiComps(null); setAiError(null); }} style={{ width: '100%', padding: '14px 16px', background: BG, border: `1px solid ${BD}`, borderRadius: 8, color: TX, fontSize: 11, fontFamily: FN, outline: 'none', resize: 'vertical', minHeight: 300, lineHeight: 1.7 }} />
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
        </div>
      }

      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${BG};overflow-x:hidden}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:3px}::selection{background:${A};color:${BG}}input:focus,textarea:focus{border-color:${A}!important;box-shadow:0 0 0 2px ${AD}}code{font-family:${FN}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
