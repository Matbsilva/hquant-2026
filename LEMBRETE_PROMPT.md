# 📝 Lembrete: Melhorias no Prompt de Geração de Composições

## 1. Indicadores OBRIGATÓRIOS na Seção 5 (Tabela de Indicadores)

O prompt DEVE instruir a IA a gerar **TODOS** os indicadores abaixo na Seção 5:

### Custos por unidade de medida:
- **Custo de Material** (R$/un) — subtotal da tabela de insumos (somente Mat)
- **Custo de Mão de Obra** (R$/un) — total da tabela de M.O.
- **Custo de Equipamento** (R$/un) — subtotal das linhas "Equip" da tabela de insumos (locação de betoneira, furadeira, etc.) — **SEPARAR do material**
- **Custo Direto Total** (R$/un) — soma: Material + M.O. + Equipamento
- **Peso Total** (kg/un)

### HH por função (cada profissional separadamente):
- Ex: Pedreiro Oficial: 2,80 HH/m²
- Ex: Ajudante de Obras: 2,20 HH/m²
- Ex: Aplicador Especializado: 0,70 HH/m²
- **Se houver Técnico, Encarregado ou qualquer outra função, listar também**

### Produtividade e equipe:
- **Composição da equipe** — SEMPRE com quantidades:
  - ✅ Correto: "1 Pedreiro Oficial + 1 Ajudante de Obras"
  - ❌ Errado: "Equipe" ou "M.O."
- **Rendimento/Produtividade da equipe por dia**:
  - Ex: "6,20 m²/noite" ou "17 m/noite"
- **Prazo estimado** (em dias/noites):
  - Ex: "12 Noites (ritmo de 6,20 m²/noite)"

### Indicadores adicionais (quando aplicável):
- **BDI sugerido** (%) — faixa recomendada sobre custo direto para o tipo de serviço
- **Risco logístico** — classificação: Baixo / Médio / Alto (baseado no peso total e acesso)

### Formato na tabela:
Usar tabela com colunas: `| Indicador | Unidade | Valor por un | Valor Total | Observação |`

---

## 2. Tabela de Insumos — Separar Categorias

Na Seção 2 (Lista de Insumos), SEMPRE usar coluna `Categoria`:
- **Mat** = Material
- **Equip** = Equipamento (locação, ferramentas)

Isso permite o parsing automático de custo de equipamento separado do material.

---

## 3. Seção 7 COMPLETA — NUNCA resumir

### Regras obrigatórias:

- **NENHUMA seção pode ser resumida** — todas devem ser geradas por completo
- A **Seção 7** é especialmente crítica e DEVE conter TODAS as subseções:
  - 7.1 — Nota do Engenheiro
  - 7.2 — Fontes e Referências
  - 7.3 — Quadro de Análise de Produtividade (4 colunas)
  - 7.4 — Análise e Recomendação
- **Seção 7.3 — SEM LIMITE de referências**:
  - Quanto MAIS referências comparativas, MELHOR
  - Não economizar: se existirem 10, 15 referências, USAR TODAS
  - Fontes possíveis: SINAPI, CPOS, expertise do quantitativo, clima, manual do fabricante, TCPO, ORSE, EMOP, SCO-RJ, literatura técnica, etc.
  - O objetivo é VALIDAR o índice adotado com o máximo de referências possível

### Por quê:
> O valor do H-QUANT está na completude e validação. Um índice com 10 referências é infinitamente mais confiável do que um com 3. O custo de ter mais dados é zero, mas o benefício é enorme.
