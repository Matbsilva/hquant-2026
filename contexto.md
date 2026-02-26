# H-QUANT 2026: Documento Mestre e Diário de Bordo (Contexto)

## Preâmbulo: A Fonte Canônica da Verdade
Este documento (`contexto.md`) é a ata definitiva e a fonte única da verdade técnica e de produto para o aplicativo **H-QUANT 2026**. Ele contém as decisões de produto, a arquitetura do sistema e o histórico (versionamento de raciocínio) do desenvolvimento, e deve ser preservado e atualizado rigorosamente com 100% de fidelidade a cada nova alteração do sistema.

---

## 1. Nossas Regras de Engajamento

### 1.1. Diretiva Primordial: Ler e Atualizar OBRIGATORIAMENTE
Toda nova interação com um Assistente IA sênior deve começar pela leitura deste arquivo (para obtenção de contexto histórico) e SEMPRE, SEM EXCEÇÃO, ser finalizada com a criação de uma nova entrada no "Diário de Bordo" neste próprio documento. Regra Restrita: A IA deve atualizar o Diário de Bordo autonomamente e sem precisar pedir permissão ou aguardar o comando do Mat, garantindo o versionamento contínuo de pensamento e alterações técnicas logo após qualquer commit de código.

### 1.2. Papéis (Personas)
*   **Mat (Product/Business Owner & Executor):** Detentor da visão do produto, define requisitos técnicos e estéticos da construtora/orçamento, realiza curadoria humana e executa comandos locais de controle, push e deploy em produção.
*   **IA (Arquiteto de Software & Engenheiro Sênior):** Concebe ideias eficientes, desenvolve novas ferramentas, manipula lógicas avançadas de código (React, Node, Regex, Parsing), planeja integrações nativas e garante a execução otimizada da estética premium UI/UX.

### 1.3. Regra de Ouro: Textos Ditados
*   **Contexto:** O Mat (usuário) frequentemente utiliza **digitação por voz (ditado)** para se comunicar e enviar requisições.
*   **Ação da IA:** A IA deve **sempre** interpretar o texto com tolerância hiper-elevada a erros de digitação, pontuação, troca de palavras por fonemas parecidos e falhas de concordância. Se a intenção do usuário ficar dúbia devido ao ditado, a IA deve **perguntar/confirmar** antes de agir, assumindo sempre a interpretação técnica mais coerente com o contexto de engenharia de custos.

---

## 2. Visão do Produto e Funcionalidades Core

### 2.1. O que é o H-QUANT 2026?
O H-QUANT é um **ERP moderno e minimalista de Engenharia de Custos**, focado exclusivamente no gerenciamento automatizado e visualização de alta fidelidade de **Composições de Serviços**. 

A plataforma foi desenhada para acabar com as velhas planilhas complexas, transformando composições geradas em linguagem natural ou IA no padrão V4 ("Prompt V4") em visualizações modulares e ultra limpas, de fácil consumo para engenheiros e empreiteiros através de Markdown e Parses super rigorosos.

### 2.2. Super Funcionalidades (Superpowers) do Sistema
1.  **AI Parser (Motor de Extração):** Não é preciso preencher dezenas de campos. O usuário cola o texto puro em Markdown gerado pela IA (Google Gemini/ChatGPT) e um robusto motor de Regex destrincha `Código`, `Equipe`, `Custo Unitário` e `Produtividade` magicamente.
2.  **Lote de Importação Expressa:** Permite subir dezenas de arquivos `.md` simultaneamente do sistema operacional para o navegador via HTML5 File Reader, concatenando tudo de forma instantânea para importação em batch de composições.
3.  **Visualização Markdown Nativa:** O Frontend possui um renderizador Custom (`<Md />`) construído do zero que varre as variáveis marcadas do texto e as traduz em um Layout UI/UX limpo com quebras, tags dinâmicas de cores (`#A`, `#BD`) e tabelas CSS, sem quebrar ou exibir lixo residual, limpando asteriscos "grudados" nos metadados diretamente no banco.
4.  **Sistema "Gold & Slate" Elevado (Tema):** Visual super premium, unificando a escuridão do Slate Gray de instituições arrojadas com acentos Dourados que traduzem valor agregado da H-QUANT.

---

## 3. Arquitetura e Tech Stack (A Engenharia por trás)

### 3.1. Frontend
*   **Framework:** Next.js (App Router ou Pages via `app/` directory estático).
*   **Biblioteca Base:** React (`14.x`).
*   **Estilização:** CSS-in-JS (Inline Objects de Alta Performance, usando constantes temáticas via Javascript). Dispensa uso de classes sujas do Tailwind para priorizar controle algorítmico do visual no `page.js`.

### 3.2. Backend & Database
*   **Baas:** Supabase.
*   **Cliente:** `@supabase/supabase-js`.
*   **Esquema:** Tabelas simples para armazenamento de `Projetos` nativos e armazenamento relacional atrelado ao `Projeto_id` na tabela de `Composicoes`. Todos os cálculos e displays robustos ficam no Fronend extraídos do campo de string puro `conteudo_completo`.

### 3.3. Deploy e versionamento
*   **Git local** -> **GitHub (main)**.
*   **Nuage/Hospedagem:** **Vercel** com CI/CD.
*   **Homologação:** Features arriscadas ou testes visuais (como o redesign Dourado) são primeiramente commitados em sub-branches (por exemplo: `theme-gold-slate`) e analisadas nas URLs automáticas de preview da Vercel antes de ir à "Main".

---

## 4. Diário de Bordo (Histórico e Log de Alterações)

### O Padrão de Entrada
Toda nova feature, deploy ou bugfix crítico desenvolvido colaborativamente entre Mat & IA deverá constar aqui.

```
[DATA] - [TÍTULO DA TAREFA/SESSÃO]
- Objetivo/Motivo: Por que essa alteração foi iniciada?
- Alterações Arquiteturais ou UI: O que mudou em infra ou código profundo?
- Status: Concluído (Merge, Deploy) / Testes etc.
```

---

### [24 de Fevereiro de 2026] - Implementação do Tema Corporate (Gold & Slate) e Logo H-QUANT
- **Objetivo/Motivo:** Elevar a percepção de valor e profissionalismo do software H-QUANT. Transitar da paleta original "Dev/Tech" (Preto Escuro e Laranja Cyber) para a identidade visual oficial sugerida pela logo projetada pela empresa.
- **Alterações Arquiteturais ou UI:**
    - Substituição completa das Constantes globais do Sistema UI (localizadas em `app/page.js` da linha 290 em diante). 
    - Fundo transitou de Cyber Black (`#0A0908`) para Slate Navy Profundo (`#0F172A`).
    - Destaques transicionaram de Laranja Ambar (`#F59E0B`) para Dourado H-Quant (`#D4AF37`), alinhando acentos, botões de salvar, modais, linhas das tabelas estruturais Custom Markdown e fontes.
    - O quadrado "H" na Sidebar Esquerda foi removido, cedendo espaço para a chamada oficial `<img src="/logo.png" />` contendo a Logo Institucional importada pelo dono do projeto, injetada através do diretório estático público `public/`.
    - **Estratégia de Risco Zero:** Toda essa manobra visual grandiosa foi operada debaixo do capô utilizando branch management via Git. Uma nova Branch chamada `theme-gold-slate` foi gerada e enviada como push remoto para construir um link Beta de aprovação vivo na nuvem da Vercel antes de consolidar por cima do motor principal (Main).
- **Status:** Entregue (Branch `theme-gold-slate` no ar aguardando Feedback/Merge do admin).

---

### [24 de Fevereiro de 2026] - Ajustes Finos UI/UX (Contraste, Parser e Responsividade)
- **Objetivo/Motivo:** Corrigir bugs visuais mapeados após a aplicação do novo tema Gold & Slate e resolver problemas de renderização e acessibilidade relatados pelo dono do produto.
- **Alterações Arquiteturais ou UI:**
    - **Fix no Parser de Tabelas Markdown:** Alteração crítica no `flushT()` do componente renderizador `<Md />`. Substituição de um corte de array estático (`.slice(2)`) que estava engolindo a primeira linha de conteúdo das tabelas por uma filtragem inteligente lógica (`.filter(...)`) que varre e ignora corretamente a linha divisória do markdown (`|---|---|`), garantindo renderização completa de todas as linhas de Material, Equipamento, etc.
    - **Destaque Visual nos Indicadores (Contraste):** Os "Cards" de Indicadores na visualização da composição perderam impacto com o novo Fundo Azul. O código JSX foi atualizado injetando uma propriedade flexível `highlight` que aplica um "tint" de transparência (8-10%) da cor nativa do indicador acompanhado de uma borda destacada superior. Os blocos de `Mão de Obra`, `Equipamento`, `HH` e `Produtividade` agora saltam visualmente com identidades únicas (Azul, Dourado, Verde) como dashboards modernos corporativos.
    - **Menu Lateral Responsivo (Mobile-first ready):** Injeção de React States (`isMobile` e `sbOpen`) atrelados a um listener do tamanho da tela (`window.innerWidth`). Em celulares ou telas pequenas, o menu esquerdo recolhe por completo escondendo seus 210px fora da tela (Off-canvas) e um discreto botão Menu "Hambúrguer" passa a controlá-lo, liberando o precioso espaço para os cálculos orçamentários vitais.
- **Status:** Entregue na branch ativa (`theme-gold-slate`).

---

### [25 de Fevereiro de 2026] - Melhorias Visuais (Rich Text) e Tema Oficial
- **Objetivo/Motivo:** Finalizar a Fase 1 do Roadmap: Restaurar o tema escuro oficial da empresa (Black & Amber) e melhorar a legibilidade da Seção 5 (Análise do Engenheiro).
- **Alterações Arquiteturais ou UI:**
    - Restaurado `page.js` e `layout.js` para o fundo `#0A0908` e destaque `#F59E0B`.
    - Componente `<Md />` ganhou a função `formatRich` que detecta e colore dinamicamente palavras-chave como `DRIVER PRINCIPAL`, `CRÍTICO`, `Economia` e `Trade-off`.
    - Atualizados `GEM-PARSER-V4.md` e o sistema de inteligência da API `route.js` para obrigarem a IA a gerar essas palavras em caixa alta.
    - Adicionada a regra de "Digitação por Voz" no contexto.
- **Status:** Concluído e em Produção (Main).

---

### [26 de Fevereiro de 2026] - Atualização da Diretiva Primordial
- **Objetivo/Motivo:** Reforçar a obrigatoriedade de registrar autonomamente as informações no Diário de Bordo e ler obrigatoriamente as diretrizes ao iniciar novas interações.
- **Alterações Arquiteturais ou UI:** Nenhuma alteração de código. Atualização apenas na Seção 1.1 do `contexto.md` inserindo a regra estrita de autonomia da IA em relação ao Diário de Bordo.
- **Status:** Concluído.

---

### [26 de Fevereiro de 2026] - Fix Rich Text/Pills Seção 5.1 + Prompt V5
- **Objetivo/Motivo:** Corrigir quebra de layout nas pills coloridas (DRIVER PRINCIPAL, SEGUNDO DRIVER, ECONOMIA) na sub-seção 5.1 (Análise de Custo) e melhorar o prompt de geração de composições.
- **Alterações Arquiteturais ou UI:**
    - **`app/page.js` (Renderizador `<Md />`):** Adicionado `whiteSpace: nowrap` + `display: inline-block` nas pills de keywords para impedir quebra mid-word. Criado novo bloco de renderização estruturada para linhas de custo (Material/Equipamentos/M.O./TOTAL) com grid label+valor+percentual+seta. O indicador `←` agora renderiza como pill separada azul. Melhorada detecção do header `5.1 ANÁLISE DE CUSTO` (mais flexível).
    - **`PROMPT-COMPOSICAO-V5.md` (NOVO):** Versão 5.0 do prompt de composições com regras explícitas de formatação visual para Seção 5.1: proibição de blocos indentados com 4 espaços, linhas de custo sem indentação, keywords em bullets `▸` próprios, tabela comparativa rente à margem.
    - **`GEM-PARSER-V4.md`:** Adicionada regra de formatação v5.0 para Seção 5.1.
- **Status:** Concluído (Build 0 errors).

---

## 5. Próximos Passos (Pronto para Iniciar)

Quando um novo assistente assumir, ele deve iniciar IMEDIATAMENTE a **Fase 2: Refatoração Arquitetural**. O arquivo `page.js` possui +800 linhas e precisa ser modularizado **antes** da criação de novas features.

**Fase 2: Refatoração (`app/page.js` -> Componentes)**
- Extrair `parsers.js` (Regex e limpeza) para `lib/`
- Extrair `<Md />` para `components/Md.js`
- Extrair Sidebar, Modais e Views (`HomeView`, `ProjectView`, `CompDetailView`) para `components/`
- *Regra:* Não alterar regras de negócio durante a refatoração. Apenas separar em arquivos e garantir que o build (`npm run build`) continua passando.

**Fase 3: Features Rápidas (Quick Wins)**
- #16: Favoritos (Adicionar estrela ⭐ e filtro na Sidebar).
- #11: Busca Full-text (Buscar dentro do conteúdo completo, não só no título).
- #3: Exportação Excel (Botão de download na tela de Detalhes da Composição usando `SheetJS`).
