import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { normalizeComposition } from '../lib/normalize.js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(envFile.split(/\r?\n/).filter(l => l.includes('=')).map(line => line.split('=')));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/['"]/g, '');
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/['"]/g, '');


const supabase = createClient(supabaseUrl, supabaseKey);

// Parse detail using regex, identical to app/page.js
function parseCompDetail(t) {
    const p = (rgx) => { const m = t.match(rgx); return m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : null; };
    return {
        custo_direto_total: p(/CUSTO DIRETO TOTAL[^R]*R\$\s*([\d.,]+)/i) || p(/TOTAL[^R]*R\$\s*([\d.,]+)/i),
        hh_total_equipe: p(/HH TOTAL EQU[^\n]*\n*([\d.,]+)/i) || p(/(?:HH TOTAL EQUIPE|HH TOTAL).*?([\d.,]+)/i)
    };
}

async function upload() {
    console.log('Buscando projeto "Modelos Prompt V4"...');

    const { data: projs, error: perr } = await supabase.from('projetos').select('id, nome').ilike('nome', '%Modelos Prompt V4%');

    if (perr || !projs || projs.length === 0) {
        console.error('Projeto não encontrado!', perr);
        return;
    }

    const pid = projs[0].id;
    console.log(`Projeto encontrado: ${projs[0].nome} (ID: ${pid})`);

    // Buscar composições existentes no projeto para não duplicar (ver pelo código)
    const { data: exComps } = await supabase.from('composicoes').select('codigo').eq('projeto_id', pid);
    const exCodes = new Set(exComps?.map(c => c.codigo) || []);

    const dir = path.join(process.cwd(), 'composicoes-modelo-v4');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

    const rows = [];

    for (const f of files) {
        const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
        const c = normalizeComposition(raw);

        const mCod = c.match(/\*\*CÓDIGO:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.match(/CÓDIGO:\s*(.*?)(?:\n|$|\|)/i);
        const cod = mCod ? mCod[1].split(/\*\*/)[0].trim() : null;

        // Ignorar duplicadas pelo CÓDIGO
        if (cod && exCodes.has(cod)) {
            console.log(`Ignorando duplicado: ${cod}`);
            continue;
        }

        const mTit = c.match(/\*\*TÍTULO:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.match(/TÍTULO:\s*(.*?)(?:\n|$|\|)/i);
        const tit = mTit ? mTit[1].split(/\*\*/)[0].trim() : 'Sem Título';
        const mGrp = c.match(/\*\*GRUPO:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.match(/GRUPO:\s*(.*?)(?:\n|$|\|)/i);
        const mCls = c.match(/\*\*CLASSIFICAÇÃO:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.match(/CLASSIFICAÇÃO:\s*(.*?)(?:\n|$|\|)/i);
        const mUn = c.match(/\*\*UNIDADE:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.match(/UNIDADE:\s*(.*?)(?:\n|$|\|)/i);
        const mTags = c.match(/\*\*TAGS:\*\*\s*(.*?)(?:\n|$|\|)/i) || c.match(/TAGS:\s*(.*?)(?:\n|$|\|)/i);

        let tags = [];
        if (mTags) tags = mTags[1].split(/\*\*/)[0].split(',').map(t => t.trim().replace(/^#/, ''));

        const dt = parseCompDetail(c);

        rows.push({
            projeto_id: pid,
            codigo: cod,
            titulo: tit,
            grupo: mGrp ? mGrp[1].split(/\*\*/)[0].trim() : null,
            classificacao: mCls ? mCls[1].split(/\*\*/)[0].trim() : null,
            unidade: mUn ? mUn[1].split(/\*\*/)[0].trim() : null,
            tags: tags,
            conteudo_completo: c,
            custo_unitario: dt ? dt.custo_direto_total : null,
            hh_unitario: dt ? dt.hh_total_equipe : null
        });
    }

    if (rows.length === 0) {
        console.log('Nenhuma composição nova para fazer upload.');
        return;
    }

    console.log(`Fazendo upload de ${rows.length} composições...`);

    const { data, error } = await supabase.from('composicoes').insert(rows).select('codigo');

    if (error) {
        console.error('Erro no upload:', error.message);
    } else {
        console.log('Upload concluído com sucesso!');
        console.log(data.map(d => d.codigo).join(', '));
    }
}

upload();
