import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Você é um parser técnico de composições de custos de engenharia civil SUPER inteligente. 
Recebe um texto em Markdown contendo uma ou mais composições e deve extrair os dados retornando um JSON puro.
As composições podem ter pequenas variações visuais no Markdown (V3, V4, tabelas grandes, pequenas), mas o coração dos dados é o mesmo.

REGRAS RÍGIDAS DE EXTRAÇÃO:
1. Identifique TODAS as composições no texto. Geralmente iniciam com "# 🛠️ COMPOSIÇÃO" ou algo parecido.
2. Para cada composição, extraia:
   - codigo: Código principal (ex: CIV-ENCH-01)
   - titulo: Título descritivo (sem o código, sem metragens. ex: Mureta Simples de Bloco Vazado)
   - unidade: Unidade (ex: m², un, m³, pt)
   - grupo: Grupo/categoria da obra.
   - quantidade_ref: (ex: 100 m² ou 1 un)
   - tags: array de palavras-chave.
   - custo_unitario: Encontre a linha "CUSTO DIRETO TOTAL". Extraia o valor MONETÁRIO UNITÁRIO (em R$), ignorando as formatações textuais ao lado.
   - hh_unitario: Encontre a linha "TOTAL M.O.". Extraia o número DECIMAL da coluna "HH Ajustado" ou "HH Total". NÃO PEGUE VALOR EM REAIS NESTA CHAVE, pegue o quantitativo decimal de horas (ex: 1.45).
   - equipe: Leia qual é a "Composição da Equipe" (ex: "1 Pedreiro + 2 Ajudantes").
   - produtividade: A produtividade diária se houver expressa (ex: 15.5 m²/dia).
   - peso_unitario: O peso total dos MATERIAIS, se existir na tabela.

3. RESILIÊNCIA A FORMATOS: Seja tolerante a diferentes cabeçalhos, marcadores de lista ou números de espaços. Extraia as informações pelo SIGNIFICADO ("custo direto", "total M.O.", "produtividade").
4. O JSON deve ser puro, sem markdown backticks \`\`\`.

Retorne EXATAMENTE este formato:
{"composicoes": [{ "codigo": "...", "titulo": "...", "unidade": "...", "grupo": "...", "tags": [...], "custo_unitario": 123.45, "hh_unitario": 2.50, "equipe": "...", "produtividade": "...", "peso_unitario": 123.0 }]}
`;

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
