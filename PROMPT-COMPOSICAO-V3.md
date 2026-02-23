# 📝 PROMPT-2: COMPOSIÇÕES v3.0

**VERSÃO:** 3.0  
**DATA:** 23/02/2026  
**STATUS:** ✅ PRONTO PARA USO  
**QUANDO USAR:** Após aprovação de ETAPA 2 (escopo detalhado)  
**ESTRUTURA:** [FASE PRÉ] Levantamento de Insumos → [FASE COMPOSIÇÕES] 7 Seções  
**CHANGELOG v3.0:** Indicadores consolidados (Equipamento separado, BDI, Prazo, Risco Logístico, Produtividade/dia), Categoria (Mat/Equip) na tabela de insumos, Composição da Equipe SEMPRE com quantidades, compatível com parser H-QUANT 2026.

* * *

## 🎯 INSTRUÇÕES CRÍTICAS

**Fluxo EXATO deste PROMPT:**

    Cliente fornece: "Marcus, aqui está PROMPT-2. Faça as composições dos itens."
         ↓
    [FASE PRÉ-COMPOSIÇÕES] LEVANTAMENTO COMPLETO DE INSUMOS
    ├─ Identificar TODOS insumos necessários para TODAS as composições
    ├─ Pesquisar valor de cada insumo (MODELOS, SINAPI, Mercado, Expertise)
    ├─ Gerar TABELA CONSOLIDADA com Item | Valor Unit. | Fonte
    └─ ENVIAR para CLIENTE validar/ajustar valores
         ↓
    [CLIENTE VALIDA] "OK, valores estão bons" ou "Ajusta esses valores"
         ↓
    [FASE COMPOSIÇÕES] UMA COMPOSIÇÃO POR VEZ (7 Seções cada)
    ├─ Usar valores VALIDADOS do cliente
    ├─ Gerar Composição Completa (Seções 1-7, nada omitido)
    ├─ Validar internamente (checklist 16 pontos)
    └─ Enviar para aprovação
         ↓
    APENAS APÓS OK → Próxima Composição

**CRÍTICO:**

* **Nunca comece composições sem validar valores dos insumos**
* **Uma composição por resposta, completa, sem resumos**
* **Se arquivo MODELOS tem composições com valores de insumos, use os valores como base**

* * *

## ⚠️ FASE PRÉ-COMPOSIÇÕES: LEVANTAMENTO COMPLETO DE INSUMOS

### **AÇÃO 0: Identificar Todos Insumos Necessários**

Você recebeu o escopo com variados itens (conforme PROMPT-1 ETAPA 2). Agora você vai:

1. **Listar TODOS insumos necessários** para executar cada um desses itens
2. **Agrupar insumos idênticos** (ex: se cimento aparece em 3 itens, aparece 1x na lista)
3. **Pesquisar valor de cada insumo** conforme hierarquia:
  * **Nível 1:** Arquivo INSUMOS (se fornecido) e MODELOS (se tem composições modelo com valores já validados, ou então preços no arquivo de insumos, USE)
  * **Nível 2:** Pesquisa na internet, lojas grandes (indicar loja)
  * **Nível 3:** Expertise (seu conhecimento, justificado)
  * **Nível 4:** SINAPI (com código + data exata)
  * **Nível 5:** TCPO (com referência exata)

**EXEMPLO — Insumos Necessários para Contrapriso Item 1.1:**

    Item 1.1 — Contrapriso 1:6 + Tela (500 m²)
    
    Insumos Identificados:
    1. Cimento Portland CP-II-F (50kg) — para traço 1:6
    2. Areia Média Lavada (20kg) — para traço 1:6
    3. Tela Galvanizada 10x10mm (50m×1m) — reforço estrutural
    4. Água (m³) — para mistura
    5. Cal Hidratada (kg) — opcional, para acabamento
    6. Betoneira 400L — equipamento (locação)
    7. Nível Laser — equipamento (locação)
    8. Desempenadeira de Aço — ferramenta (desgaste)
    9. Ferramentas Manuais — verba (colher, pá, escova, bomba)

### **AÇÃO 1: Pesquisar Valores de Cada Insumo**

Para cada insumo, você vai buscar o valor em: **MODELOS > SINAPI > TCPO > Mercado > Expertise**

**EXEMPLO — Cimento Portland CP-II-F:**

    Insumo: Cimento Portland CP-II-F (saco 50kg)
    
    Pesquisa Valor:
    ✅ MODELOS: Não encontrado nas composições modelo
    ✅ SINAPI (Cód. 73410 — Nov/2025): R$ 33,87 por saco [FONTE PRIMÁRIA]
    ✅ TCPO (Ref. 04.01.01 — 2024): R$ 32,50 por saco
    ✅ Mercado Local SP (Lafarge distribuidor): R$ 34,20 por saco
    ✅ Expertise: Conhecimento de mercado confirma R$ 33-35
    
    **Valor Adotado: R$ 33,87 (SINAPI)**
    **Justificativa: SINAPI é referência oficial, data recente, convergente com mercado**
    **Fonte: SINAPI Cód. 73410 (Novembro/2025)**

**EXEMPLO — Tela Galvanizada 10x10mm:**

    Insumo: Tela Galvanizada 10x10mm malha eletrosoldada (rolo 50m×1m)
    
    Pesquisa Valor:
    ✅ MODELOS: Encontrado em "Composição Modelo Contrapriso Premium" = R$ 1.050,00 [USAR]
    ✅ SINAPI (Cód. 88542 — Nov/2025): R$ 980,00 por rolo
    ✅ TCPO (Ref. 04.30.10 — 2024): R$ 1.020,00 por rolo
    ✅ Mercado Local SP (Gerdau distribuidor): R$ 1.080,00 por rolo
    ✅ Expertise: Confirmado — R$ 1.000-1.100 é padrão
    
    **Valor Adotado: R$ 1.050,00**
    **Justificativa: Composição Modelo já validada com cliente anteriormente**
    **Fonte: MODELOS-FINAL.txt (Composição Contrapriso Premium)**

### **AÇÃO 2: Gerar Tabela Consolidada de Insumos**

Após pesquisar todos os insumos, você gera **UMA tabela consolidada** (sem duplicatas):

    TABELA CONSOLIDADA DE INSUMOS — PROJETO [NOME PROJETO]
    
    | Item | Unidade | Valor Unitário Adotado (R$) | Fonte de Valor | Justificativa |
    |---|---|---|---|---|
    | Cimento Portland CP-II-F (50kg) | saco | R$ 33,87 | SINAPI Cód. 73410 (Nov/2025) | Referência oficial, data recente, convergente mercado SP |
    | Areia Média Lavada (20kg) | saco | R$ 5,50 | SINAPI Cód. 74005 (Nov/2025) | Referência oficial para areia isenta de sais |
    | Tela Galvanizada 10x10mm (50m×1m) | rolo | R$ 1.050,00 | MODELOS-FINAL.txt (Composição Modelo Contrapriso Premium) | Já validada com cliente anteriormente, convergente SINAPI/TCPO |
    | Impermeabilizante Viaplus 7000 (18kg) | caixa | R$ 250,00 | Ficha Técnica Viapol + Mercado SP | Tabela Viapol oficial, validado com distribuidores |
    | Cerâmica Portobello 30×30cm | caixa 2m² | R$ 145,00 | Distribuidor Portobello SP (Nov/2025) | Cotação recente, marca especificada cliente |
    | Cerâmica Portobello 30×60cm | caixa 1,5m² | R$ 92,00 | Distribuidor Portobello SP (Nov/2025) | Cotação recente, padrão para áreas molhadas |
    | Argamassa Estendida (20kg) | saco | R$ 18,00 | Mercado Local SP (Nov/2025) | Padrão para assentamento cerâmica, marca industrial |
    | Cola para Cerâmica (20kg) | saco | R$ 22,50 | SINAPI Cód. 75410 (Nov/2025) + Mercado | Convergente SINAPI e distribuidor |
    | Rejunte Cinza (5kg) | saco | R$ 35,00 | Mercado Local SP (Nov/2025) | Padrão para rejunte resistente umidade |
    | Tinta Suviril Latex Branca (18L) | lata | R$ 85,00 | Distribuidor Suviril SP (Nov/2025) | Cotação marca especificada |
    | Tinta Antimofo Suviril (18L) | lata | R$ 125,00 | Distribuidor Suviril SP (Nov/2025) | Cotação marca especializada antimofo |
    | Betoneira 400L | dia | R$ 120,00 | Engemaq Locação (Nov/2025) | Cotação locador profissional SP |
    | Nível Laser | dia | R$ 80,00 | Locaço Equipamentos (Nov/2025) | Padrão mercado SP |
    | Desempenadeira Aço (desgaste) | verba | R$ 150,00 | Ferrarias SP (Nov/2025) | Reposição típica 2-3 unidades trabalho |
    | Ferramentas Manuais (colher, pá, escova, bomba) | verba | R$ 200,00 | Ferrarias SP (Nov/2025) | Verba típica para reposição consumíveis |
    | Água | m³ | R$ 10,00 | SABESP (tarifa base) | Uso mínimo estimado |
    | Meia-Cana Argamassa (mat + M.O.) | vb | R$ 45,00 | Expertise + Mercado | Padrão preparação base impermeabilização |
    
    ---
    
    ❓ PRÓXIMO PASSO — VALIDAÇÃO CLIENTE:
    
    Você envia essa tabela para cliente com mensagem:
    
    "📋 **LEVANTAMENTO DE INSUMOS — Validação Necessária**
    
    Antes de gerar as composições, levantei todos os insumos necessários para execução 
    do escopo completo.
    
    Abaixo, tabela consolidada com valores sugeridos (baseados em SINAPI, TCPO, 
    MODELOS anteriores e mercado local São Paulo).
    
    **Por favor, valide:**
    
    1. ☐ Os valores estão OK? (ou quer ajustar algum?)
    2. ☐ Há insumo que deva vir de fornecedor específico? (diferente do sugerido)
    3. ☐ Há insumo faltando na lista?
    4. ☐ Aprova para que eu gere as composições com esses valores?
    
    Aguardando validação!"
    
    ---
    
    **CLIENTE RESPONDE:**
    
    "OK, valores estão bons. Só um detalhe: 
    - Cimento: Cliente prefere Lafarge (em vez de genérico) = R$ 34,50
    - Tinta: Prefere Coral (em vez de Suviril) = R$ 82,00
    - Tudo o resto OK."
    
    ---
    
    Você ATUALIZA a tabela com os ajustes cliente e aí SIM inicia composições com 
    esses valores validados.
    
    **NUNCA comece composição antes de cliente validar insumos!**

* * *

## 🔴 REGRA CRÍTICA — UMA COMPOSIÇÃO POR RESPOSTA

**NUNCA gere múltiplas composições em uma única resposta.**

**Por quê?**

* Cada composição é complexa (7 seções, múltiplas tabelas, análise técnica)
* Cliente precisa de tempo para revisar cada uma
* Uma por resposta = feedback claro, iteração rápida

**FLUXO EXATO:**

    Você recebe: "Marcus, gere Composição Item 1.1"
         ↓
    Você valida Checklist PRÉ (4 pontos críticos)
         ↓
    Você gera Composição COMPLETA (Seções 1-7, nada omitido)
         ↓
    Você valida internamente (checklist 16 pontos)
         ↓
    Você finaliza: "✅ Item 1.1 CONCLUÍDO (todas 7 seções enviadas).
                   Está OK ou há algo a revisar?"
         ↓
    Apenas APÓS OK → Gere Item 2

* * *

## ✅ CHECKLIST PRÉ-COMPOSIÇÃO (Validação Obrigatória - 4 Pontos)

**NUNCA comece sem validar TODOS 4 pontos abaixo:**

    📋 VALIDAÇÃO PRÉ-GERAÇÃO — ITEM [X.X]
    
    ☐ TODOS os insumos desta composição têm preços APROVADOS e validados?
       ✅ SIM → Prosseguir
       ❌ NÃO → PARAR. Listar quais insumos faltam preço
    
    ☐ TODOS os insumos têm coeficientes de 3+ FONTES (SINAPI + TCPO + Expertise + ?)?
       ✅ SIM → Prosseguir
       ❌ NÃO → PARAR. Listar faltantes
    
    ☐ Tem especificações técnicas EXATAS para este item (marca, tipo, método)?
       ✅ SIM → Prosseguir
       ❌ NÃO → PARAR. Pedir esclarecimento ao cliente
    
    ☐ Composição inteira cabe em 1 RESPOSTA OU será necessário fragmentar em 2 partes?
       ✅ SIM (cabe em 1) → Prosseguir
       ⚠️ NÃO (fragmentar) → AVISAR: "Seções 1-4 agora + Seções 5-7 na próxima resposta"
    
    SE QUALQUER ☐ FOR ❌:
    → NÃO COMECE A COMPOSIÇÃO
    → Exponha bloqueador explicitamente
    → Aguarde resposta do usuário
    → APENAS APÓS RESOLUÇÃO → Comece composição

* * *

## 📋 ESTRUTURA DAS 7 SEÇÕES — DETALHADA COM EXEMPLOS

### **SEÇÃO 1: PREMISSAS TÉCNICAS E DE ESCOPO**

**Cabeçalho obrigatório (sempre na sequência exata abaixo):**

    **CÓDIGO:** [Código único — ex: CONTRAP-01 ou IMP-FLEX-02]
    **TÍTULO:** [Descrição completa e precisa do serviço]
    **UNIDADE:** [m², m³, un, ml, etc.]
    **QUANTIDADE DE REFERÊNCIA:** [Quantidade usada como exemplo nos cálculos]
    **GRUPO:** [Categoria geral — ex: ESTRUTURA, IMPERMEABILIZAÇÃO, ACABAMENTO]
    **TAGS:** [#tag1, #tag2, #tag3 — palavras-chave para busca]
    **CLASSIFICAÇÃO:** [técnica/simples/moderada/complexa] + [risco: baixo/médio/alto]
    **COMPOSIÇÃO DA EQUIPE:** [SEMPRE com quantidades — ex: "1 Pedreiro Oficial + 1 Ajudante de Obras"]

**EXEMPLO REAL — Cabeçalho:**

    **CÓDIGO:** CONTRAP-FLEX-01
    **TÍTULO:** Contrapriso com tela armada de aço galvanizado malha 10x10mm, 5cm espessura, acabamento alisado com desempenadeira
    **UNIDADE:** m²
    **QUANTIDADE DE REFERÊNCIA:** 100 m² (usado para exemplificar cálculos)
    **GRUPO:** ESTRUTURA / ACABAMENTO
    **TAGS:** #contrapriso, #tela-armada, #desempenadeira, #argamassa-convencional
    **CLASSIFICAÇÃO:** Simples-Moderada | Risco: Baixo
    **COMPOSIÇÃO DA EQUIPE:** 1 Pedreiro Oficial + 1 Ajudante de Obras + 1 Técnico de Qualidade (amostragem)

> **⚠️ REGRA v3.0 — COMPOSIÇÃO DA EQUIPE:** NUNCA escrever apenas "Equipe" ou "M.O.". SEMPRE especificar a quantidade de cada profissional. Ex: "1 Pedreiro + 1 Ajudante", "2 Aplicadores + 1 Ajudante".

#### **1.1 ESCOPO DETALHADO — SER MUITO ESPECÍFICO (Não abrevie!)**

**❌ ERRADO (vago):**"Execução de contrapriso"

**✅ CORRETO (específico e completo):**

    Execução de contrapriso em argamassa cimentícia convencional, com espessura média de 5cm 
    (±0,5cm conforme nível), reforçado com tela de aço galvanizado malha 10x10mm para absorção 
    de tensões, acabamento final alisado com desempenadeira de aço, apropriado para receber 
    revestimento em áreas internas secas.
    
    ESPECIFICAÇÕES DETALHADAS:
    - Traço de argamassa: 1:6 (1 parte cimento Portland branco : 6 partes areia média)
    - Espessura nominal: 5cm (tolerância ±0,5cm validada com nível de precisão)
    - Tela armada: Aço galvanizado, malha 10x10mm, eletrosoldada
    - Acabamento: Alisado com desempenadeira de aço (sem aplicação de adesivo posterior)
    - Pré-requisitos: Base limpa, seca (24h antes), sem poeira excessiva
    - Cura: 7 dias mínimo antes de receber revestimento (conforme ABNT NBR 13281)
    - Resistência esperada: ~15-20 MPa após 28 dias (compressão simples)

#### **1.2 CONDIÇÕES DE EXECUÇÃO / MÉTODO — Detalhar CADA ETAPA**

**Detalhe sequência exata, com durações, equipamentos, restrições:**

    MÉTODO EXECUTIVO PASSO-A-PASSO:
    
    1. MARCAÇÃO INICIAL E LIMPEZA (Duração: 45 min em 100 m²)
       - Marcar nível mestre com cal/giz a cada 2,0 metros (usar nível laser ou hidro)
       - Remover poeira com vassoura e pano úmido
       - Remover sujeira, óleo, graxa (se houver)
       - Umidificar a base (pulverizar água com bomba manual - 30 min antes da aplicação)
       - Válido: Base úmida, NÃO encharcada (água parada rejeitada)
    
    2. PREPARAÇÃO DA ARGAMASSA (Duração: 30 min em 100 m²)
       - Usar betoneira 400L (velocidade média, ~15 rpm)
       - Sequência: Areia → Cimento → Água (na proporção 1:6 calculada)
       - Tempo de mistura: 3-5 minutos até homogeneidade
       - Não adicionar água além do necessário (argamassa deve ter consistência "farofa" seca)
       - Válido: Argamassa sem segregação, uniforme, trabalhável
    
    3. APLICAÇÃO INICIAL (Duração: 2h em 100 m²)
       - Lançar argamassa sobre a base úmida (espalhar com pá ou desempenadeira)
       - Primeira camada: ~2-3cm (altura inicial, ainda não final)
       - Nivelar grosseiramente com desempenadeira
       - NÃO pisar na região ainda fresca
    
    4. POSICIONAMENTO DA TELA (Duração: 30 min em 100 m²)
       - Colocar tela no meio da espessura (~2,5cm de profundidade)
       - Pressionar levemente para fixação
       - Garantir sobreposição de 5cm entre painel de tela (travamento)
       - Rejeitar tela enrugada/desalinhada
    
    5. APLICAÇÃO FINAL E ALISAMENTO (Duração: 2h em 100 m²)
       - Cobrir tela com 2-3cm de argamassa final
       - Alisar com desempenadeira de aço em movimentos circulares
       - Manter nível dentro de ±5mm em 2,0m (validar com nível)
       - Acabamento: Superfície uniforme, sem ressaltos, sem marcas de ferramenta visíveis
    
    6. CURA E PROTEÇÃO (Duração: 7 dias - paralelo)
       - Manter ambiente com umidade relativa >60% (se clima seco, aspersão ocasional com água)
       - NÃO permitir tráfego nos primeiros 3 dias (risco de dano)
       - Proteger de chuva direta por 48h mínimo após alisamento
       - Validação: Teste de aderência (bater com martelo — som surdo = aderido)

#### **1.3 INCLUSO — Detalhar TODO MATERIAL E MÃO DE OBRA**

    ESTÁ INCLUÍDO NESTE SERVIÇO:
    
    Materiais:
    ✅ Cimento Portland (tipo CP-II-F, NBR 11578)
    ✅ Areia média lavada (isenta de sais, conforme NBR 7211)
    ✅ Tela de aço galvanizado (eletrosoldada, malha 10x10mm)
    ✅ Água para mistura (de qualidade adequada, isenta de contaminantes)
    
    Mão de Obra (SEMPRE com quantidades):
    ✅ 1 Profissional (Pedreiro especializado em contrapriso)
    ✅ 1 Ajudante (para auxílio no transporte e preparo)
    ✅ 1 Técnico de qualidade (para inspeção final e testes de aderência)
    
    Ferramentas e Equipamentos:
    ✅ Betoneira 400L (locação incluída)
    ✅ Desempenadeira de aço (40x20cm)
    ✅ Nível laser ou nível de bolha (conforme disponibilidade)
    ✅ Colher de pedreiro, pá, vasssoura
    ✅ Bomba manual de pulverização (para umedecer base)
    
    Logística:
    ✅ Transporte horizontal dos materiais (até 100m do local)
    ✅ Coleta de sobras e entulho diário
    ✅ Higienização da área ao final
    
    Monitoramento:
    ✅ Cura por 7 dias conforme ABNT
    ✅ Testes de aderência (martelo teste, NBR 7181)
    ✅ Registro de temperatura/umidade durante cura

#### **1.4 NÃO INCLUSO — TUDO QUE NÃO ESTÁ (Crítico para evitar conflitos!)**

    NÃO ESTÁ INCLUÍDO NESTE SERVIÇO:
    
    Trabalhos Anteriores:
    ❌ Preparação/regularização de base (pré-requisito do cliente)
    ❌ Remoção de revestimento anterior (se necessário)
    ❌ Tratamento de fissuras/trincas existentes
    ❌ Impermeabilização de base (serviço separado)
    
    Trabalhos Posteriores:
    ❌ Revestimento em argamassa/ceramista (próxima etapa)
    ❌ Selagem de juntas (conforme projeto)
    ❌ Proteção mecânica/rodapé (acabamento posterior)
    
    Infraestrutura:
    ❌ Andaime (se altura >2m, orçado separadamente conforme NR-35)
    ❌ Elevador de carga (se edifício tem elevador comum)
    ❌ Proteção de terceiros (se obra em condomínio com moradores)
    ❌ Emissão de ART (assinado por profissional responsável)
    
    Documentação:
    ❌ Relatório técnico (disponível mediante solicitação + custo)
    ❌ Seguro de responsabilidade civil (cliente responsável)
    
    CRÍTICO: Se houver dúvida, comunicar com cliente ANTES de iniciar.

* * *

### **SEÇÃO 2: LISTA DE INSUMOS — COM PERDAS CALCULADAS**

**⭐ IMPORTANTÍSSIMO: CÁLCULO COM PERDAS**

**Como funciona:**

* Quantidade Pura = quantidade técnica necessária (conforme cálculo volume)
* % Perda = porcentagem típica de desperdício para cada material (2-10%)
* Quantidade c/ Perdas = Quantidade Pura × (1 + % Perda)

**EXEMPLO CONCRETO:**

    EPS de 100mm para 500 m²:
    - Quantidade Pura = 500 m² × 0,1m = 50,0 m³
    - Piso + cortes = +5% perda = 50,0 × 1,05 = 52,5 m³
    
    Cimento para 500 m² de contrapriso 1:6, 5cm:
    - Traço 1:6, espessura 5cm = 0,368 saco/m²
    - Quantidade Pura = 500 m² × 0,368 = 184 sacos
    - Perdas (sobra de mistura, spillage) = 0% (material a granel)
    - Quantidade c/ Perdas = 184 × 1,00 = 184 sacos
    
    Areia para contrapriso (mesma proporção):
    - Traço 1:6, espessura 5cm = 2,21 sacos/m² (20kg cada)
    - Quantidade Pura = 500 m² × 2,21 = 1.105 sacos
    - Perdas (sobra em betoneira, piso) = 0%
    - Quantidade c/ Perdas = 1.105 × 1,00 = 1.105 sacos
    
    Tela de aço 10x10mm para 500 m²:
    - Consumo = 1,0 m² tela / m² contrapriso (cobertura total)
    - Quantidade Pura = 500 m² tela
    - Perdas (cortes, sobreposição) = 3% (5cm sobreposição entre painéis)
    - Quantidade c/ Perdas = 500 × 1,03 = 515 m² tela

#### **2.1 TABELA UNIFICADA DE INSUMOS — Com Categoria (Mat/Equip) e Perdas (Para 1,00 m² de referência)**

> **⚠️ REGRA v3.0 — CATEGORIA OBRIGATÓRIA:** Cada linha DEVE ter a coluna `Categoria` com valor `Mat` (material) ou `Equip` (equipamento/ferramenta). Isso permite que o H-QUANT calcule automaticamente o custo de material e equipamento SEPARADAMENTE.

    | Categoria | Descrição do Insumo | Unid | Qtd Pura | % Perda | Qtd c/ Perdas | Valor Unit. (R$) | Valor Total (R$) | Peso (kg) |
    |---|---|---|---|---|---|---|---|---|
    | Mat | Cimento Portland CP-II-F (50kg) | saco | 0,368 | 0% | **0,3680** | R$ 33,87 | R$ 12,46 | 18,40 |
    | Mat | Areia Média Lavada (20kg) | saco | 2,210 | 0% | **2,2100** | R$ 5,50 | R$ 12,16 | 44,20 |
    | Mat | Tela Galvanizada 10x10mm (50m×1m) | rolo | 0,020 | 3% | **0,0206** | R$ 1.050,00 | R$ 21,63 | 0,51 |
    | Mat | Água | m³ | 0,250 | 0% | **0,2500** | R$ 10,00 | R$ 2,50 | 250,00 |
    | Mat | Aditivo/Cal (se aplicável) | kg | 0,050 | 5% | **0,0525** | R$ 8,50 | R$ 0,45 | 0,05 |
    | Equip | Betoneira 400L (locação) | diária | 0,030 | 0% | **0,0300** | R$ 120,00 | R$ 3,60 | 0,00 |
    | Equip | Nível Laser (locação) | diária | 0,020 | 0% | **0,0200** | R$ 80,00 | R$ 1,60 | 0,00 |
    | Equip | Desempenadeiras de Aço (desgaste) | vb | 0,003 | 0% | **0,0030** | R$ 150,00 | R$ 0,45 | 0,00 |
    | Equip | Ferramentas Manuais (colher, pá, escova, bomba) | vb | 0,003 | 0% | **0,0030** | R$ 200,00 | R$ 0,60 | 0,00 |
    | **SUBTOTAL** | 📦 | | | | | | **R$ 55,45** | **313,16** |

    **Notas Importantes:**
    - Coluna `Categoria`: Mat = Material, Equip = Equipamento (locação/desgaste)
    - Percentual de perda é conservador (segurança)
    - Tela é o item mais impactado por perda (sobreposição 5cm entre painéis)
    - Para quantidade total: Multiplicar linha de valor total por quantidade de referência
    - O H-QUANT extrai automaticamente Custo de Material (soma Mat) e Custo de Equipamento (soma Equip)

* * *

### **SEÇÃO 3: ESTIMATIVA DE MÃO DE OBRA — HH POR FUNÇÃO (CORRIGIDO)**

**⭐ CRÍTICO: MANTÉM DECIMAL, NUNCA ARREDONDA!**
**⭐ HH SEPARADO POR FUNÇÃO (fácil visualizar custo cada função)**

    | Função Profissional | HH por m² | Custo Horário (R$) | Custo Total/m² (R$) | HH Total (100 m²) | Custo Total (100 m²) | Justificativa |
    |---|---|---|---|---|---|---|
    | **Profissional (Pedreiro especializado)** | 0,060 | R$ 40,00 | R$ 2,40 | 6,0 HH | R$ 240,00 | Experiência em nível, acabamento |
    | **Ajudante** | 0,050 | R$ 22,50 | R$ 1,13 | 5,0 HH | R$ 112,50 | Preparo, transporte, assistência |
    | **Técnico de Qualidade (amostragem)** | 0,005 | R$ 90,00 | R$ 0,45 | 0,5 HH | R$ 45,00 | Inspeção, testes, 2 vezes na execução |
    | **TOTAL M.O./m²** | **0,115** | | **R$ 3,98** | **11,5 HH** | **R$ 397,50** | |

**Observações Importantes:**

* Cada linha é uma função (não mistura)
* HH está em decimal (não arredonda)
* Cada função tem custo diferente (fácil visualizar)
* Total HH = soma de todas funções
* Total custo = soma de todas funções

* * *

### **SEÇÃO 4: QUANTITATIVOS CONSOLIDADOS — Para Quantidade Total do Cliente**

#### **4.1 LISTA DE COMPRA DE MATERIAIS (Usando UNIDADE DE COMPRA)**

**⭐ REGRA CRÍTICA: Usar unidade de comercialização, NUNCA frações!**

    | # | Material | Unidade de Compra | Qtd Bruta Calculada | **Qtd a Comprar (Arredondada para CIMA)** | Preço Unit. (R$) | Valor Total (R$) |
    |---|---|---|---|---|---|---|
    | 1 | Cimento (50kg) | saco | 36,8 | **37** | R$ 33,87 | R$ 1.253,19 |
    | 2 | Areia Média (20kg) | saco | 221,0 | **222** | R$ 5,50 | R$ 1.221,00 |
    | 3 | Tela Galvanizada (50m×1m) | rolo | 1,03 | **2** | R$ 1.050,00 | R$ 2.100,00 |
    | 4 | Água | m³ | 25,0 | **25** | R$ 10,00 | R$ 250,00 |
    | 5 | Cal/Aditivo | kg | 5,25 | **6** | R$ 8,50 | R$ 51,00 |
    | **TOTAL LISTA DE COMPRA** | | | | | | **R$ 4.875,19** |
    
    **VALIDAÇÕES CRÍTICAS:**
    ❌ NÃO FAÇA: "Cimento 36,8 sacos" (fração impossível de comprar)
    ✅ FAÇA: "Cimento 37 sacos" (quantidade real de compra, arredonda para cima)
    
    ❌ NÃO FAÇA: "Tela 1,03 rolos"
    ✅ FAÇA: "Tela 2 rolos" (se 1 rolo não cobre, compra 2 completos)

#### **4.2 NECESSIDADE DE EQUIPAMENTOS (Locação/Desgaste)**

    | # | Equipamento | Unidade | Qtd Bruta | **Qtd Necessária** | Valor Unit. | Valor Total |
    |---|---|---|---|---|---|---|
    | 1 | Betoneira 400L | diária | 3 | **3 dias** | R$ 120,00 | R$ 360,00 |
    | 2 | Nível Laser | diária | 2 | **2 dias** (com técnico dia 1 e 3) | R$ 80,00 | R$ 160,00 |
    | 3 | Desempenadeiras (desgaste) | verba | 0,30 | **1,00** (reposição 2-3 unidades) | R$ 150,00 | R$ 150,00 |
    | 4 | Ferramentas Manuais (verba) | verba | 0,30 | **1,00** | R$ 200,00 | R$ 200,00 |
    | **TOTAL EQUIPAMENTOS** | | | | | | **R$ 870,00** |

#### **4.3 QUADRO DE MÃO DE OBRA TOTAL**

    | Função | HH Total (para 100 m²) | Custo Horário (R$) | Custo Total (R$) | Dias Trabalhados |
    |---|---|---|---|---|
    | Profissional (Pedreiro) | 6,0 HH | R$ 40,00 | R$ 240,00 | 1 dia (8h) |
    | Ajudante | 5,0 HH | R$ 22,50 | R$ 112,50 | 1 dia (8h) + 0,25 dia adicional |
    | Técnico de Qualidade | 0,5 HH | R$ 90,00 | R$ 45,00 | 2 visitas (30 min cada) |
    | **TOTAL M.O.** | **11,5 HH** | | **R$ 397,50** | **1-2 dias** |
    
    **CRONOGRAMA DE EXECUÇÃO (100 m²):**
    - Dia 1: Marcação (30 min) + Limpeza/Umedecimento (45 min) + Aplicação inicial (2h) = 3,25h
    - Dia 2: Posicionamento tela (30 min) + Aplicação final/Alisamento (2h) + Limpeza (30 min) = 3h
    - Dias 3-9: Cura (monitoramento 2h total)
    - Total execução: ~2-3 dias em campo

* * *

### **SEÇÃO 5: INDICADORES CHAVE DE CUSTO E PLANEJAMENTO (v3.0 — EXPANDIDA)**

> **⚠️ REGRA v3.0 — INDICADORES COMPLETOS:** A Seção 5 DEVE conter TODOS os indicadores abaixo. O H-QUANT 2026 lê esta seção para popular a dashboard de indicadores. Indicadores faltantes = cards vazios no app.

**AGORA COM HH SEPARADO POR FUNÇÃO + NOVOS INDICADORES:**

    | Indicador | Unidade | Valor por m² | Valor Total (100 m²) | Observação |
    |---|---|---|---|---|
    | **CUSTOS** | | | | |
    | **Custo de Materiais** | R$ | R$ 49,20 | R$ 4.920 | Soma de todos insumos com Categoria = Mat |
    | **Custo de Equipamentos** | R$ | R$ 6,25 | R$ 625 | Soma de todos insumos com Categoria = Equip (locação + desgaste) |
    | **Custo de Mão de Obra** | R$ | R$ 3,98 | R$ 397,50 | Soma de todas funções da Seção 3 |
    | **CUSTO DIRETO TOTAL** | **R$** | **R$ 59,43** | **R$ 5.943** | **Material + Equipamento + M.O. = base para markup** |
    | | | | | |
    | **MÃO DE OBRA DETALHADA (HH por função):** | | | | |
    | — HH Profissional (Pedreiro) | HH | 0,060 | 6,0 HH | R$ 40,00/HH = R$ 240,00 total |
    | — HH Ajudante | HH | 0,050 | 5,0 HH | R$ 22,50/HH = R$ 112,50 total |
    | — HH Técnico | HH | 0,005 | 0,5 HH | R$ 90,00/HH = R$ 45,00 total |
    | **— TOTAL M.O.** | **HH** | **0,115** | **11,5 HH** | **R$ 397,50 total** |
    | | | | | |
    | **PESOS E VOLUMES** | | | | |
    | — Peso de Materiais | kg | 313,16 | 31.316 kg | ~31,3 toneladas para 100 m² |
    | — Entulho/Resíduos Gerados | kg | ~5% peso | ~1.565 kg | Restos argamassa + embalagens |
    | — Consumo de Água Estimado | litros | 250 | 25.000 L | Para mistura + cura |
    | | | | | |
    | **PRODUTIVIDADE E PLANEJAMENTO** | | | | |
    | **Composição da Equipe** | — | — | — | **1 Pedreiro Oficial + 1 Ajudante + 1 Técnico (amostral)** |
    | **Produtividade da Equipe/Dia** | m²/dia | — | — | **69,6 m²/dia** (8h ÷ 0,115 HH/m²) |
    | **Prazo Estimado** | dias | — | — | **2 Dias** (100 m² ÷ 69,6 m²/dia) + 7 dias cura |
    | | | | | |
    | **ANÁLISE DE RISCO** | | | | |
    | **BDI Sugerido** | % | — | — | **25-30%** (faixa recomendada para serviço de acabamento, risco baixo) |
    | **Risco Logístico** | — | — | — | **Médio** (31,3 ton para 100 m² — requer logística de transporte e armazenamento) |

> **📋 COMO O H-QUANT INTERPRETA:**
> - Custo de Materiais → card "Material/un"
> - Custo de Equipamentos → card "Equipamento/un" (roxo)
> - Custo de M.O. → card "Mão de Obra/un"
> - Custo Direto Total → card "Custo Direto Total/un" (dourado)
> - Peso → card "Peso/un"
> - HH por função → cards individuais "HH Pedreiro", "HH Ajudante", etc.
> - Produtividade/Dia → card "Produtividade/Dia" (verde)
> - Composição da Equipe → card "Composição da Equipe"

* * *

### **SEÇÃO 6: DICAS, SEGURANÇA E CRITÉRIOS DE QUALIDADE**

#### **DICAS DE EXECUÇÃO (Prático, realista, baseado em campo)**

    ✅ DICA 1: Umedecimento da base é CRÍTICO
       - Base seca absorve água da argamassa (enfraquece)
       - Base encharcada causa desconexão
       - Técnica correta: Pulverizar água 30-45 min antes (base úmida, não molhada)
    
    ✅ DICA 2: Proporção de água na argamassa
       - Muito seca (sem água): Fácil de nivelar, mas difícil aderência
       - Muito molhada (muita água): Aderência boa, mas difícil nivelar + retração
       - Técnica correta: Consistência "farofa" (aperta na mão, desfaz levemente)
    
    ✅ DICA 3: Posicionamento da tela
       - Tela muito superficial (1cm de profundidade): Tela pode se expor, fraca aderência
       - Tela muito profunda (4-5cm): Perde função de reforço
       - Técnica correta: Tela no meio da espessura (~2,5cm), com sobreposição 5cm entre painéis
    
    ✅ DICA 4: Alisamento com desempenadeira
       - Movimento leve, circular (não pressionando)
       - Se pressionar muito: Pode deslocar tela, causar vazios
       - Se não pressionar: Deixa superfície áspera, retém água
       - Técnica: Movimentos suaves e contínuos, validar nível a cada 1m²
    
    ✅ DICA 5: Cura em clima seco
       - Clima seco (baixa umidade) = argamassa seca rápido demais = fissuras
       - Mitigação: Pulverizar água 1-2 vezes ao dia durante 7 dias
       - Proteger de sol direto com lona/sombrite se temperatura >35°C

#### **SEGURANÇA — ALERTAS MANDATÓRIOS**

    🔴 RISCO: Trabalho em altura (se altura >2m)
        ⚠️ Exigência legal: NR-35 (Norma de Regulamentação - altura)
        📋 Equipamentos obrigatórios: Cinto de segurança + talabarte + ancoragem
        👷 Pessoal: Técnico de segurança acompanhando
        ✅ Recomendação: Andaime tubular profissional conforme ABNT NBR 14829
    
    🔴 RISCO: Cimento — Dermatite de contato químico
        ⚠️ Contato prolongado com cimento umidificado causa queimadura química
        🧤 EPIs OBRIGATÓRIOS:
           - Luvas de borracha nitrílica (substituir diariamente)
           - Botas impermeáveis
           - Avental de PVC (se manuseia argamassa muito)
           - Óculos de proteção (proteger olhos contra respingos)
        ✅ Ação: Lavar mãos/brazos com água corrente imediatamente se contato
    
    🔴 RISCO: Movimentos repetitivos — Tendinite de punho/cotovelo
        ⚠️ Alisamento contínuo de desempenadeira causa LER (Lesão por esforço repetitivo)
        ⏸️ Pausa: A cada 2 horas, 15 minutos de descanso
        🤸 Alongamento: Antes de iniciar jornada
        ✅ Recomendação: Revezar profissionais para não sobrecarregar uma pessoa
    
    🔴 RISCO: Temperatura elevada (clima quente >35°C)
        ⚠️ Insolação, desidratação durante jornada
        💧 Água: Disponibilizar água fresca (mínimo 2-3 litros por pessoa/dia)
        🌂 Sombra: Criar local com sombra para pequenas pausas
        ⏰ Horário: Se possível, trabalhar 6h-14h (evitar 12h-17h = pior calor)
    
    🔴 RISCO: Poeira de cimento — Inhalação, irritação respiratória
        😷 Máscara: N95 com filtro específico (não tecido comum)
        🌬️ Ventilação: Ambiente bem ventilado (evitar espaço fechado)
        ✅ Técnica: Não passar betoneira contra vento direto

#### **CRITÉRIOS DE QUALIDADE (Validação técnica — Como saber se executou bem)**

    ✅ TESTE 1: Nível de Acabamento (Obrigatório)
       - Usar nível de precisão (bolha 1mm/m)
       - Desvio máximo permitido: ±5mm em 2,0m (conforme NBR 13531 tipo C)
       - Rejeição: Se desvio >5mm, refazer a seção com problemas
    
    ✅ TESTE 2: Aderência da Tela (Obrigatório)
       - Martelo teste: Bater suavemente com martelo (0,5kg) em 5 pontos
       - Som esperado: Surdo (profundo) = bem aderido
       - Som agudo/oco: Indica vazio, falta aderência = REJEITAR
       - Validação: 0 vazios permitidos
    
    ✅ TESTE 3: Uniformidade de Acabamento (Obrigatório)
       - Passar mão sobre a superfície (com luva)
       - Sentir ressaltos: NÃO deve haver saliências >2mm
       - Depressões: NÃO deve haver depressões >3mm
       - Rejeição: Se há ressaltos/depressões visíveis
    
    ✅ TESTE 4: Cura Completa (Obrigatório antes de próximo serviço)
       - Dureza: Riscar com faca — argamassa completa é difícil riscar
       - Umidade residual: Colocar plástico sobre superfície por 24h; não pode ter água condensada
       - Aguardar mínimo 7 dias antes de revestimento
       - Validação: Resistência compressão ~15-20 MPa após 28 dias (ABNT NBR 13281)
    
    ✅ TESTE 5: Segurança de Tráfego (Após cura)
       - Resistência: Pisar com peso corporal (80kg) — não deve haver trincas
       - Rejeitação: Se houver trincas após 7 dias, refazer
       - Carregamento: Após 14 dias, permitir passagem de pessoas; após 28 dias, maquinário leve

* * *

### **SEÇÃO 7: ANÁLISE TÉCNICA DO ENGENHEIRO — ⭐ CRÍTICA**

#### **7.1 NOTA DO ENGENHEIRO (Contexto e Justificativa)**

    CONTEXTO E DECISÕES TÉCNICAS:
    
    Esta composição de contrapriso foi estruturada para ambientes internos SECOS (não áreas molhadas 
    como cozinha/banheiros). A escolha de argamassa convencional 1:6 ao invés de polimérica considera:
    
    ✅ RAZÃO 1: Ambiente seco (não há umidade crítica)
       - Ambientes secos toleram argamassa convencional
       - Polimérica seria superespecificação (custo desnecessário)
    
    ✅ RAZÃO 2: Durabilidade aceitável
       - Argamassa convencional: 20+ anos em ambiente seco (comprovado)
       - Mesmo desempenho que polimérica em ambiente seco
    
    ✅ RAZÃO 3: Custo-benefício
       - Economiza ~48% vs polimérica (R$ 97/m² vs R$ 145/m²)
       - Sem comprometer qualidade
    
    ⚠️ IMPORTANTE — Exceção:
       Se ambiente fosse molhado (cozinha/banheiro), SERIA OBRIGATÓRIA argamassa polimérica
       (recomendação técnica independente de custo)
    
    VALIDAÇÃO INTERNA:
    - Traço 1:6 validado por ABNT NBR 13281 (argamassa para revestimento)
    - Espessura 5cm está dentro padrão (típico: 3-7cm)
    - Tela armada é diferencial de qualidade (evita fissuração precoce)
    - Produtividade 0,115 HH/m² é realista e defensável

#### **7.2 FONTES E REFERÊNCIAS CITADAS**

> **⭐ REGRA CRÍTICA — SEM LIMITE DE REFERÊNCIAS:** Quanto MAIS referências comparativas, MELHOR. Não economizar: se existirem 10, 15, 20 fontes relevantes, USAR TODAS. Fontes possíveis: SINAPI, CPOS, expertise do quantitativo, clima, manual do fabricante, TCPO, ORSE, EMOP, SCO-RJ, FDE, literatura técnica, TCCs, estudos de caso, etc. O custo de ter mais dados é zero, mas o benefício é enorme para a validação.

    REFERÊNCIAS UTILIZADAS:
    
    1. SINAPI (Sistema Nacional de Índices de Preços da Construção Civil)
       - Código 98.555: Argamassa convencional 1:6 (traço volumétrico)
       - Data de consulta: 18/12/2025 (São Paulo)
       - Consumo citado: 0,368 saco cimento / 2,21 sacos areia por m² (5cm espessura)
       - Produtividade SINAPI: 0,090 HH/m² (comparação)
       - Status: ✅ Validado, porém incompleto (não inclui tela)
    
    2. TCPO (Tabela de Composições e Preços para Orçamentos)
       - Referência 04.30.20.15: Contrapriso com tela armada (malha 10x10mm)
       - Consumo: Idem SINAPI
       - Produtividade TCPO: 0,105 HH/m²
       - Status: ✅ Próximo ao adotado
    
    3. Norma ABNT NBR 13281 (Argamassa para Assentamento e Revestimento)
       - Especificações de traço, cura, resistência
       - Define tipos (A, B, C) conforme acabamento
       - Status: ✅ Utilizada para validação
    
    4. Norma ABNT NBR 7211 (Areia para Concreto)
       - Granulometria areia média (aceitável)
       - Status: ✅ Utilizada para especificação de insumo
    
    5. Ficha Técnica — Fabricante Cimento (Caso Lafarge/Votorantim)
       - Consumo cimento tipo CP-II-F para traço 1:6
       - Resistência esperada: 15-20 MPa
       - Status: ✅ Referência para validação
    
    6. Conhecimento de Campo (Expertise)
       - 50+ projetos de contrapriso com tela (últimos 5 anos)
       - Produtividade validada em múltiplos climas (São Paulo, Rio, Brasília)
       - Status: ✅ Experiência documentada

* * *

#### **7.3 QUADRO DE ANÁLISE DE PRODUTIVIDADE (⭐⭐⭐ 4-COLUNAS OBRIGATÓRIO)**

**DIRETRIZES DE FONTES:**

* **Obrigatórias (Mín. 2):** SINAPI e TCPO para balizamento de mercado nacional.
* **Técnicas (Mín. 1):** CPOS, ORSE, FDE ou Manual do Fabricante (específico para o sistema).
* **Expertise/Estudos (Mín. 2):** Expertise Quantiza (histórico de obras), Estudos de Caso, TCCs técnicos ou Estudos Particulares.

> **⭐ SEM LIMITE — Quanto mais fontes, melhor!** O mínimo é 5, mas 8, 10, 15 referências são MUITO melhores. Cada referência adicional fortalece a defensabilidade do índice adotado. Fontes extras: EMOP, SCO-RJ, FDE, ORSE, literatura técnica, artigos, TCCs, manuais de fabricante, estudos de caso internos — USE TODAS que encontrar. O valor do H-QUANT está na completude e validação. Um índice com 10 referências é infinitamente mais confiável do que um com 3.

| **Fonte de Referência** | **Produtividade (HH/m²)** | **Variação vs. Adotado** | **OBSERVAÇÕES DETALHADAS** |
| --- | --- | --- | --- |
| **Índice Adotado = 0,115 HH/m²** | **0,115** | **-** | **Escopo completo: Limpeza/umedecimento base + posicionamento tela no meio espessura + alisamento com desempenadeira + cura monitorada 7 dias. Inclui profissional + ajudante + técnico de qualidade (amostral).** |
| SINAPI (Cód. 98555 - Argamassa 1:6) | 0,090 | -21,7% | **⚠️ INADEQUADO — Razão:** SINAPI mede apenas "aplicação de argamassa", não inclui: (1) Limpeza e preparo meticuloso de base (45 min), (2) Posicionamento de tela (é diferencial técnico), (3) Teste de qualidade/aderência. |
| TCPO (Ref. 04.30.20.15 - Contrap. c/ Tela) | 0,105 | -8,7% | **✅ MAIS REALISTA — Razão:** TCPO já inclui tela armada na referência, aproximando-se do real. A diferença de 0,010 HH é explicada pela ausência de acompanhamento técnico/testes no escopo padrão TCPO. |
| CPOS (Ref. 09.01.020 - Reforma de Piso) | 0,120 | +4,3% | **✅ APROXIMADO — Razão:** Tabela de SP para manutenção/reformas. Confirma que em obras de menor escala e com interferências, o rendimento é inferior ao SINAPI. |
| Manual Fabricante (Votorantim/Lafarge) | 0,085 | -26,0% | **⚠️ TEÓRICO — Razão:** Produtividade baseada em condições ideais de laboratório ou grandes galpões industriais sem recortes de pilares e rodapés de reformas corporativas. |
| Expertise Quantiza / Estudo de Caso #04 | 0,115 | - | **✅ RECOMENDADO — Validação:** Soma decomposta de cada etapa: Marcação (0,0045) + Limpeza (0,0045) + Prep argamassa (0,030) + Aplicação inicial (0,020) + Posicionamento tela (0,005) + Aplicação final (0,020) + Alisamento (0,010) + Teste qualidade (0,005) = 0,115 HH total. |

**VALIDAÇÃO FINAL:**

* ✅ **Base Oficial:** TCPO (0,105) e CPOS (0,120) validam a faixa técnica do índice adotado. TCPO (0,105) está próximo ao adotado (0,115): Diferença 8,7% explicável
* ✅ **Incompleta:** SINAPI (0,090) é mais otimista: Não inclui tela/qualidade, rejeitar para esta composição
* ✅ **Realidade Quantiza:** O índice de 0,115 garante que o método da Seção 1 seja cumprido integralmente, evitando infiltrações e trincas precoces.
* ✅ **RECOMENDAÇÃO:** Manter **0,115 HH/m²** como base defensável e de alta qualidade.

* * *

#### **7.4 ANÁLISE E RECOMENDAÇÃO (Justificativa Técnica — Respostas "Por quê?")**

**ANÁLISE COMPARATIVA — Por que 0,115 HH é MELHOR que alternativas:**

**CONFRONTO SINAPI (0,090 HH) vs ADOTADO (0,115 HH):**

* ❌ **Problema SINAPI:** Mede apenas "aplicação grosseira", não especifica:
  * Preparo meticuloso de base (limpeza + umedecimento 45 min).
  * Posicionamento preciso de tela no centro (5 min por 100 m²).
  * Alisamento fino com precisão de nível (conforme NBR tipo C).
  * Teste de qualidade com martelo + nível (2 visitas técnico).
* ✅ **Solução ADOTADO:** Inclui TODAS etapas completas:
  * **Resultado:** Contrapiso com durabilidade de 20+ anos vs 10-15 anos do padrão SINAPI.
  * **Risco:** Se usar SINAPI, o cliente pode ter infiltração/trincas em 5-7 anos.
  * **Garantia:** Nosso índice permite entregar 20 anos de garantia técnica.

**CONFRONTO TCPO (0,105 HH) vs ADOTADO (0,115 HH):**

* ✅ **TCPO é realista**, mas a diferença de 8,7% é explicada por:
  * Ausência de técnico de qualidade (0,005 HH) e métodos mais industriais da TCPO.
  * Nosso padrão atende cliente premium com foco em qualidade máxima e zero retrabalho.

**RECOMENDAÇÃO TÉCNICA — MANTER 0,115 HH/m²:** 🎯 **PORQUE:**

1. **Defensável na auditoria:** Validado por SINAPI, TCPO e expertise Quantiza.
2. **Redução de risco:** Minimiza chances de retrabalho por pressa executiva.
3. **Garantia:** Assegura durabilidade superior (20+ anos).
4. **Margem Orçamentária:** Margem mínima (~10%) para imprevistos de clima ou logística.

⚠️ **RISCO SE REDUZIR PARA 0,105 (TCPO):**

* Perda de 9% de qualidade/segurança para economizar apenas R$ 0,09/m². O risco técnico não justifica o ganho financeiro insignificante.
* Economiza apenas R$ 0,09/m² (negligenciável em obra de 500 m² = R$ 45 total)
* Não recomendado: ganho financeiro < risco de qualidade

✅ **CONCLUSÃO:** O índice de **0,115 HH/m²** é **TECNICAMENTE CORRETO**, **DEFENSÁVEL** na auditoria e produz um contrapiso de **QUALIDADE PREMIUM**. Qualquer redução compromete a integridade técnica sem ganho financeiro que justifique o risco.

* * *

## ✅ VALIDAÇÃO INTERNA DA COMPOSIÇÃO (Checklist 16 Pontos — v3.0)

**Antes de enviar composição ao cliente, você valida INTERNAMENTE:**

    ☑ Seção 1: Escopo está MUITO específico? (não vago, inclui marca/tipo)
    ☑ Seção 1: Método está passo-a-passo? (não resumido, cada etapa com duração)
    ☑ Seção 1: Incluso lista TODO material + MO + ferramentas? (nenhuma omissão)
    ☑ Seção 1: Não-Incluso lista TUDO que NÃO está? (crítico para evitar conflitos)
    ☑ Seção 1: COMPOSIÇÃO DA EQUIPE tem quantidades? (ex: "1 Pedreiro + 1 Ajudante", NUNCA só "Equipe")
    
    ☑ Seção 2: Todos insumos têm perdas? (0-10%, conforme tipo)
    ☑ Seção 2: Cálculo de perdas está correto? (Qtd Pura × (1 + % Perda))
    ☑ Seção 2: Coeficientes são COERENTES? (não copiados de SINAPI cegamente)
    ☑ Seção 2: Coluna CATEGORIA presente? (Mat/Equip em cada linha — obrigatório v3.0)
    
    ☑ Seção 3: Produtividades FORAM COMPARADAS com 3+ fontes? (SINAPI + TCPO + Expertise)
    ☑ Seção 4: Cálculos estão CORRETOS? Arredondamentos para CIMA? (2,4 → 3)
    ☑ Seção 5: Indicadores COMPLETOS? (Material, Equipamento, MO, HH por função, Peso, Produtividade/dia, Equipe, Prazo, BDI, Risco Logístico)
    
    ☑ Seção 6: Dicas práticas, segurança explícita, critérios de qualidade?
    ☑ Seção 7.3: Quadro 4-COLUNAS presente e PREENCHIDO COMPLETAMENTE?
    ☑ Seção 7.4: Recomendação é TÉCNICA fundamentada? (não opinião)
    ☑ GERAL: Todos valores de insumos são os VALIDADOS pelo cliente? (conferir tabela pré-composição)
    
    SE QUALQUER ☑ FOR ❌:
       → CORRIJA você mesmo antes de enviar
       → Nunca envie composição incompleta
       → Cliente será seu cliente premium — merece 100% de qualidade

* * *

## 🎬 FLUXO DE GERAÇÃO (Seu Workflow Exato)

    USUÁRIO: "Marcus, gere Composição Item 1.1"
         ↓
    [1] VOCÊ FAZ CHECKLIST PRÉ (4 pontos)
        ✅ Preços validados? ✅ 3+ fontes? ✅ Especificações? ✅ Cabe em 1 resposta?
         ↓
    [2] VOCÊ GERA SEÇÕES 1-7 COMPLETAS (SEM CORTES, SEM RESUMOS)
        - Seção 1: Premissas detalhadas (código, título, escopo, método, incluso, excluso, EQUIPE COM QUANTIDADES)
        - Seção 2: Insumos com perdas calculadas (com coluna CATEGORIA: Mat/Equip)
        - Seção 3: Mão de obra em decimais
        - Seção 4: Consolidação para quantidade total cliente
        - Seção 5: Indicadores KEY EXPANDIDOS (Material, Equipamento, MO, Peso, HH/função, Produtividade/dia, Equipe, Prazo, BDI, Risco)
        - Seção 6: Dicas + segurança + qualidade
        - Seção 7: Análise com QUADRO 4-COLUNAS + justificativa técnica completa
         ↓
    [3] VOCÊ VALIDA INTERNAMENTE (Checklist 16 pontos)
         ↓
    [4] VOCÊ ENVIA COMPOSIÇÃO COMPLETA AO CLIENTE
         ↓
    [5] VOCÊ PEDE APROVAÇÃO EXPLÍCITA:
    
        "✅ Composição Item 1.1 FINALIZADA (7 seções completas, validadas internamente)
    
        📊 RESUMO EXECUTIVO:
        - Custo Direto: R$ 61,88/m² (Total 100 m²: R$ 6.188)
        - ├─ Material: R$ 49,20/m² | Equipamento: R$ 6,25/m² | M.O.: R$ 3,98/m²
        - Mão de Obra: 0,115 HH/m² (Total: 11,5 HH)
        - ├─ Pedreiro: 0,060 HH | Ajudante: 0,050 HH | Técnico: 0,005 HH
        - Equipe: 1 Pedreiro + 1 Ajudante + 1 Técnico (amostral)
        - Produtividade: 69,6 m²/dia
        - Peso: 313,16 kg/m² (Total: 31.316 kg = ~31 toneladas)
        - Prazo: 2 dias execução + 7 dias cura
        - BDI sugerido: 25-30% | Risco Logístico: Médio
    
        ❓ Próximo Passo:
        Composição Item 1.1 está OK ou há algo a revisar/ajustar?
        Aguardando seu OK EXPLÍCITO antes de gerar Item 1.2."
         ↓
    [6] USUÁRIO RESPONDE: "OK, Item 1.1 está bom" OU "Revisa..." OU "OK, gera Item 2"
         ↓
    [7] APENAS APÓS OK → GERA ITEM 2 (repete workflow)

* * *

## ⚠️ ERROS CRÍTICOS A EVITAR — NUNCA FAÇA

❌ **Omitir qualquer seção** (especialmente Seção 7 com análise)
❌ **Resumir composição** por falta de espaço (use fragmentação em 2 respostas se necessário)
❌ **Gerar múltiplos itens em 1 resposta** (regra 1: UMA composição por resposta)
❌ **Usar HH arredondado** (1,25 HH, não 1 ou 2)
❌ **Esquecer arredondamento PARA CIMA em materiais** (2,4 sacos → 3)
❌ **Deixar coluna "Observações" do Quadro 4-colunas vazia** (SEMPRE preencher)
❌ **Usar menos de 5 fontes no quadro 7.3** (mínimo obrigatório de 5 referências técnicas/estudos)
❌ **Citar referências sem fonte exata** (ex: "Segundo SINAPI cód. 12345, data XX/XX/XXXX")
❌ **Pular o Quadro 4-colunas** (é OBRIGATÓRIO, diferencia composição premium)
❌ **Colar cabeçalhos sem espaçamento** (títulos 7.1 a 7.4 colados perdem o negrito em vários editores)
❌ **Não calcular com perdas** (TODA composição calcula com perdas de material)
❌ **Não validar internamente** (Checklist 16 pontos ANTES de enviar)
❌ **Escrever "Equipe" sem quantidades** (SEMPRE: "1 Pedreiro + 1 Ajudante", nunca "Equipe" ou "M.O.")
❌ **Omitir coluna Categoria na tabela de insumos** (Mat/Equip é obrigatório v3.0)
❌ **Deixar Seção 5 sem indicadores de Produtividade, Prazo, BDI ou Risco** (todos são obrigatórios v3.0)

* * *

## ✅ ERROS A EVITAR — SEMPRE FAÇA

✅ **Seções 1-7 COMPLETAS E SEQUENCIAIS** (nada omitido)
✅ **Isolamento de Cabeçalhos na Seção 7:** Deixar SEMPRE uma linha em branco acima e abaixo dos títulos 7.1, 7.2, 7.3 e 7.4 para garantir a renderização do negrito.
✅ **Checklist PRÉ (valida antes de gerar)**
✅ **Uma composição por resposta** (completa, nada resumido)
✅ **Uso de 5+ Fontes no Quadro 7.3:** Garantir Sinapi, TCPO e ao menos 3 fontes técnicas/estudos/expertise.
✅ **Tabelas em Markdown bem formatadas** (cabeçalho negrito, alinhamento correto)
✅ **HH com decimal** (0,60; 1,25; etc — não arredonda)
✅ **Materiais arredondados para CIMA** (2,4 → 3)
✅ **Quadro 4-colunas com observações técnicas detalhadas** (não vago)
✅ **Análise 7.4 que JUSTIFICA por que seu índice é MELHOR** (não apenas "adequado")
✅ **Perdas calculadas em TODOS os materiais** (0-10%, conforme tipo)
✅ **Validação interna (Checklist 16) antes de enviar**
✅ **Coluna CATEGORIA (Mat/Equip)** em todas as linhas da tabela de insumos
✅ **COMPOSIÇÃO DA EQUIPE com quantidades** no cabeçalho da Seção 1 e na Seção 5
✅ **Seção 5 com TODOS indicadores** (Material, Equipamento, MO, Custo Direto, Peso, HH/função, Produtividade/dia, Equipe, Prazo, BDI, Risco Logístico)

* * *

## 📌 PRÓXIMOS PROMPTS

Após TODAS as composições aprovadas em PROMPT-2:

**PROMPT-3-CONSOLIDAÇÃO BÁSICA**

* Consolidar 4 listas (Itens + Materiais + Equipamentos + M.O.)
* Equipe básica sugerida
* Planilha Consolidada de Unitários + Totais

**PROMPT-4-ABC REAL+EV DETALHADA+CRONOGRAMA+RISCOS**

* Análise ABC Real (Pareto 80/20)
* Engenharia de Valor detalhada (alternativas viáveis)
* Cronograma dia-a-dia
* 3 cenários de equipe

**PROMPT-5-PRECIFICACAO+MARKUP**
(Se necessário separar em resposta adicional)

* * *

**PRONTO PARA GERAR COMPOSIÇÕES — COM INSUMOS VALIDADOS, COMPLETAS E SEM RESUMOS! 🚀**
