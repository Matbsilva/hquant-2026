import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Você é um parser técnico de composições de custos de engenharia civil SUPER inteligente. 
Recebe um texto em Markdown contendo uma ou mais composições e deve extrair os dados retornando um JSON puro.
As composições podem ter pequenas variações visuais no Markdown (V3, V4, tabelas grandes, pequenas), mas o coração dos dados é o mesmo.

REGRAS RÍGIDAS DE EXTRAÇÃO:
1. Identifique TODAS as composições no texto. Geralmente iniciam com "# 🛠️ COMPOSIÇÃO" ou algo parecido.
2. Para cada composição, extraia:
   - codigo: Código principal (ex: CIV-ENCH-01). O código fica logo após "COMPOSIÇÃO:" ou "CÓDIGO:"
   - titulo: Título descritivo (sem o código, sem metragens. ex: Mureta Simples de Bloco Vazado). Extraia da primeira linha ou do campo TÍTULO.
   - unidade: Unidade (ex: m², un, m³, pt). Extraia do campo UNIDADE.
   - grupo: Grupo/categoria da obra. Extraia do campo GRUPO.
   - quantidade_ref: (ex: "100 m²" ou "1 un"). Extraia do campo QUANTIDADE REF.
   - tags: array de palavras-chave. Extraia do campo TAGS, separando por vírgula e removendo #.
   - custo_unitario: Encontre a linha "CUSTO DIRETO TOTAL" na tabela de indicadores (Seção 5). Extraia o valor MONETÁRIO UNITÁRIO (coluna "Valor por [unidade]", em R$). NÃO pegue o valor total (coluna "Valor Total"). Se houver "R$" antes do número, ignore. Converta vírgula decimal para ponto.
   - hh_unitario: Encontre a linha "TOTAL M.O." na Seção 3. Extraia o número DECIMAL da coluna "HH Ajustado" (o número em negrito que vem DEPOIS do fator). NÃO PEGUE valor em reais. Ex: se a linha mostra "3,0600", retorne 3.06.
   - equipe: Leia qual é a "Composição da Equipe" (ex: "1 Pedreiro + 2 Ajudantes"). Normalmente vem no campo COMPOSIÇÃO DA EQUIPE.
   - produtividade: A produtividade diária se houver expressa (ex: "15.5 m²/dia" ou "~9,3 m/noite"). Procurar na Seção 5 ou Seção 4.
   - peso_unitario: O peso total dos MATERIAIS por unidade. Procurar na linha SUBTOTAL da tabela de insumos (Seção 2), última coluna de peso.

3. RESILIÊNCIA A FORMATOS: Seja tolerante a diferentes cabeçalhos, marcadores de lista ou números de espaços. Extraia as informações pelo SIGNIFICADO ("custo direto", "total M.O.", "produtividade").
4. TOLERÂNCIA A SEPARADORES: As tabelas podem usar separadores curtos (---|---) ou longos (----------|----------). Ambos são válidos.
5. TOLERÂNCIA A ESPAÇAMENTO: Pode haver espaços extras ou colunas com largura variável. Focalize no conteúdo, não na formatação.
6. O JSON deve ser puro, sem markdown backticks \`\`\`.

Retorne EXATAMENTE este formato:
{"composicoes": [{ "codigo": "...", "titulo": "...", "unidade": "...", "grupo": "...", "tags": [...], "custo_unitario": 123.45, "hh_unitario": 2.50, "equipe": "...", "produtividade": "...", "peso_unitario": 123.0 }]}
`;

// Rate limiting: max 10 requests per minute per IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || (now - entry.start) > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) return false;
    entry.count++;
    return true;
}

// Cleanup stale entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now - entry.start > RATE_LIMIT_WINDOW_MS * 2) rateLimitMap.delete(ip);
    }
}, 5 * 60 * 1000);

// Max text size: 500KB (ALL_MODELS.md is ~372KB, so this gives comfortable headroom)
const MAX_TEXT_SIZE = 500 * 1024;

export async function POST(req) {
    try {
        // Rate limiting
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Limite de requisições excedido. Aguarde 1 minuto.' },
                { status: 429 }
            );
        }

        const { text } = await req.json();
        if (!text || text.trim().length < 50) {
            return NextResponse.json({ error: 'Texto muito curto (mínimo 50 caracteres)' }, { status: 400 });
        }
        if (text.length > MAX_TEXT_SIZE) {
            return NextResponse.json(
                { error: `Texto muito grande (${Math.round(text.length / 1024)}KB). Máximo: ${MAX_TEXT_SIZE / 1024}KB. Divida o lote em conjuntos menores.` },
                { status: 400 }
            );
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

        // Sanitize output — ensure all expected fields exist
        if (parsed.composicoes && Array.isArray(parsed.composicoes)) {
            parsed.composicoes = parsed.composicoes.map(c => ({
                codigo: String(c.codigo || 'SEM-CÓD').trim(),
                titulo: String(c.titulo || '').trim(),
                unidade: String(c.unidade || '').trim(),
                grupo: String(c.grupo || '').trim(),
                tags: Array.isArray(c.tags) ? c.tags.map(t => String(t).replace(/^#/, '').trim()).filter(Boolean) : [],
                custo_unitario: typeof c.custo_unitario === 'number' ? c.custo_unitario : null,
                hh_unitario: typeof c.hh_unitario === 'number' ? c.hh_unitario : null,
                equipe: c.equipe ? String(c.equipe).trim() : null,
                produtividade: c.produtividade ? String(c.produtividade).trim() : null,
                peso_unitario: typeof c.peso_unitario === 'number' ? c.peso_unitario : null,
            }));
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
