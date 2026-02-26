export const metadata = {
  title: 'H-QUANT 2026 — Banco de Composições',
  description: 'Armazenamento e consulta de composições de engenharia de custos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0F172A' }}>{children}</body>
    </html>
  );
}
