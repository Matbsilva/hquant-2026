# H-QUANT 2026: Documento Mestre e Diário de Bordo (Contexto)

## Preâmbulo: A Fonte Canônica da Verdade
Este documento (`contexto.md`) é a ata definitiva e a fonte única da verdade técnica e de produto para o aplicativo **H-QUANT 2026**. Ele contém as decisões de produto, a arquitetura do sistema e o histórico (versionamento de raciocínio) do desenvolvimento, e deve ser preservado e atualizado rigorosamente com 100% de fidelidade a cada nova alteração do sistema.

---

## 1. Nossas Regras de Engajamento

### 1.1. Diretiva Primordial: Ler e Atualizar
Toda nova interação com um Assistente IA sênior deve começar pela leitura deste arquivo (para obtenção de contexto histórico) e **sempre** ser finalizada com a criação de uma nova entrada no "Diário de Bordo" neste próprio documento, garantindo o versionamento do pensamento.

### 1.2. Papéis (Personas)
*   **Mat (Product/Business Owner & Executor):** Detentor da visão do produto, define requisitos técnicos e estéticos da construtora/orçamento, realiza curadoria humana e executa comandos locais de controle, push e deploy em produção.
*   **IA (Arquiteto de Software & Engenheiro Sênior):** Concebe ideias eficientes, desenvolve novas ferramentas, manipula lógicas avançadas de código (React, Node, Regex, Parsing), planeja integrações nativas e garante a execução otimizada da estética premium UI/UX.

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
