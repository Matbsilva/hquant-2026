# 📝 Lembrete: Melhorias no Prompt de Geração de Composições

## 1. Indicadores separados e detalhados

O prompt deve instruir a IA a gerar uma seção de **INDICADORES** com dados separados:

- **Custo de Material** (subtotal insumos em R$)
- **Custo de Mão de Obra** (total M.O. em R$)
- **Custo Direto Total** (R$)
- **Peso Total** (kg)
- **HH por profissão** — listar CADA profissional separadamente:
  - Ex: Pedreiro Oficial: 2,80 HH/m²
  - Ex: Ajudante de Obras: 2,20 HH/m²
- **Composição da equipe** — descrever explicitamente:
  - Ex: "1 Pedreiro Oficial + 1 Ajudante de Obras"
- **Rendimento médio diário da equipe** — produtividade por dia:
  - Ex: "2,00 m²/dia para equipe de 2 pessoas"

**Formato sugerido:** usar seção `### INDICADORES` com tabela ou bullets para facilitar o parsing automático no H-QUANT.

---

## 2. Seção 7 COMPLETA — NUNCA resumir

### Regras obrigatórias:

- **NENHUMA seção pode ser resumida** — todas devem ser geradas por completo
- A **Seção 7** é especialmente crítica e DEVE conter TODAS as subseções:
  - 7.1
  - 7.2
  - 7.3 — Quadro de Análise de Produtividade
  - 7.4
- **Seção 7.3 — SEM LIMITE de referências**:
  - Quanto MAIS referências comparativas, MELHOR
  - Não economizar: se existirem 10, 15 referências, USAR TODAS
  - Fontes possíveis: SINAPI, CPOS, expertise do quantitativo, clima, manual do fabricante, TCPO, ORSE, EMOP, SCO-RJ, literatura técnica, etc.
  - O objetivo é VALIDAR o índice adotado com o máximo de referências possível
  - Ex: "Referências: SINAPI (2,50 HH/m²), CPOS (3,00 HH/m²), TCPO (2,80 HH/m²), ORSE (2,60 HH/m²), expertise quantitativo (2,70 HH/m²), manual fabricante (2,40 HH/m²) → Índice adotado: 2,80 HH/m² — justificativa: ..."

### Por quê:
> O valor do H-QUANT está na completude e validação. Um índice com 10 referências é infinitamente mais confiável do que um com 3. O custo de ter mais dados é zero, mas o benefício é enorme.
