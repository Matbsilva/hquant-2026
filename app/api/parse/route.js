import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Você é um parser técnico de composições de custos de engenharia civil. 
Recebe um texto em Markdown contendo uma ou mais composições e deve retornar um JSON puro.

REGRAS:
1. Identifique TODAS as composições no texto. Elas geralmente começam com "# 🛠️ COMPOSIÇÃO" ou "# 🛠️ ITEM" seguido de código/título.
2. Para cada composição, extraia:
   - codigo: o código da composição (ex: CIV-ENCH-CEL-20, IMP-VIA-7000)
   - titulo: o título/nome descritivo da composição (ex: "ENCHIMENTO COM BLOCO CELULAR (H=20cm TOTAL)")
   - unidade: a unidade de medida (m², m, un, etc)
   - grupo: o grupo/categoria se houver
   - quantidade_ref: quantidade de referência se mencionada
   - tags: array de tags relevantes (palavras-chave do serviço)
   - custo_unitario: o CUSTO DIRETO TOTAL por unidade em reais (número)
   - hh_unitario: o TOTAL M.O. em HH por unidade (número da linha TOTAL M.O., coluna HH Ajustado)
   - equipe: composição da equipe (ex: "1 Pedreiro + 1 Ajudante")
   - produtividade: rendimento diário da equipe se disponível
   - peso_unitario: peso total por unidade em kg se disponível

3. IMPORTANTE: O titulo NÃO deve incluir o código ou informações como UNIDADE/QUANTIDADE. Extraia apenas o nome descritivo.
4. Se o texto começar com um nome de projeto (como "# QUINTOANDAR" ou "# 6047/25 - HÍGIA"), ignore essa linha.
5. Tags devem ser geradas a partir do contexto (tipo de serviço, materiais principais, etc).

Retorne SOMENTE um JSON válido no formato:
{"composicoes": [{ "codigo": "...", "titulo": "...", "unidade": "...", "grupo": "...", "tags": [...], "custo_unitario": 123.45, "hh_unitario": 2.5, "equipe": "...", "produtividade": "...", "peso_unitario": 123.0 }]}

NUNCA inclua texto fora do JSON. Sem markdown, sem explicações.`;

export async function POST(req) {
    try {
        const { text } = await req.json();
        if (!text || text.trim().length < 50) {
            return NextResponse.json({ error: 'Texto muito longo ou curto' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: SYSTEM_PROMPT + '\n\n---\n\nTEXTO PARA PARSEAR:\n\n' + text,
            config: {
                temperature: 0.1,
                responseMimeType: 'application/json',
            }
        });

        const jsonText = response.text;

        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        } catch (e) {
            // Try to extract JSON from response if wrapped in markdown
            const match = jsonText.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                throw new Error('Resposta do Gemini não é JSON válido');
            }
        }

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('Parse API error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao processar composições' },
            { status: 500 }
        );
    }
}
