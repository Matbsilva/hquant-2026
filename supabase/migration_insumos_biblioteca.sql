-- ============================================
-- BIBLIOTECA DE INSUMOS — Schema Supabase
-- H-QUANT 2026 v4.0
-- ============================================

-- Tabela principal: Biblioteca de Insumos
CREATE TABLE IF NOT EXISTS insumos_biblioteca (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  categoria TEXT NOT NULL CHECK (categoria IN ('MO', 'Mat', 'Equip')),
  subcategoria TEXT,
  unidade TEXT NOT NULL,
  preco DECIMAL(12,2) NOT NULL,
  fonte TEXT NOT NULL,
  url_fonte TEXT,
  confiabilidade TEXT DEFAULT 'media' CHECK (confiabilidade IN ('alta', 'media', 'baixa')),
  data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
  composicao_origem TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_insumos_nome ON insumos_biblioteca (nome);
CREATE INDEX IF NOT EXISTS idx_insumos_categoria ON insumos_biblioteca (categoria);
CREATE INDEX IF NOT EXISTS idx_insumos_data ON insumos_biblioteca (data_referencia DESC);

-- Adicionar campos de versionamento à tabela composicoes (se existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'composicoes' AND column_name = 'versao'
  ) THEN
    ALTER TABLE composicoes ADD COLUMN versao INTEGER DEFAULT 1;
    ALTER TABLE composicoes ADD COLUMN versao_anterior_id UUID REFERENCES composicoes(id);
  END IF;
END $$;

-- RLS (Row Level Security) — habilitar
ALTER TABLE insumos_biblioteca ENABLE ROW LEVEL SECURITY;

-- Política: qualquer pessoa autenticada pode ler e escrever
CREATE POLICY "Allow all for authenticated" ON insumos_biblioteca
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA — 30 Insumos Base
-- ============================================

INSERT INTO insumos_biblioteca (nome, categoria, subcategoria, unidade, preco, fonte, confiabilidade, data_referencia) VALUES
-- MÃO DE OBRA (4 itens)
('Profissional (Pedreiro/Oficial/Carpinteiro)', 'MO', NULL, 'HH', 40.00, 'Padronizado', 'alta', '2026-02-23'),
('Ajudante (Servente)', 'MO', NULL, 'HH', 22.50, 'Padronizado', 'alta', '2026-02-23'),
('Impermeabilizador (Oficial)', 'MO', NULL, 'HH', 40.00, 'Padronizado', 'alta', '2026-02-23'),
('Técnico / Engenheiro para Teste', 'MO', NULL, 'HH', 90.00, 'Padronizado', 'alta', '2026-02-23'),

-- MATERIAIS (22 itens)
('Cimento Portland CP-II (50kg)', 'Mat', 'Aglomerantes', 'saco', 34.00, 'Modelo / Manual', 'alta', '2026-02-23'),
('Areia Média (20kg)', 'Mat', 'Agregados', 'saco', 5.50, 'Modelo / Manual', 'alta', '2026-02-23'),
('Areia Fina (20kg)', 'Mat', 'Agregados', 'saco', 6.00, 'Modelo / Manual', 'alta', '2026-02-23'),
('Brita 0 / Pedrisco (20kg)', 'Mat', 'Agregados', 'saco', 6.00, 'Ajuste', 'media', '2026-02-23'),
('Argamassa Autonivelante (20kg)', 'Mat', 'Argamassas', 'saco', 95.00, 'Manual', 'alta', '2026-02-23'),
('Argamassa Colante AC-III', 'Mat', 'Argamassas', 'kg', 1.90, 'Manual', 'alta', '2026-02-23'),
('Argamassa Pronta Matrix 4201 (40kg)', 'Mat', 'Argamassas', 'saco', 28.00, 'Manual', 'alta', '2026-02-23'),
('Impermeabilizante Viaplus 7000 (18kg)', 'Mat', 'Impermeabilização', 'cx', 250.00, 'Modelo Referência', 'alta', '2026-02-23'),
('Manta Asfáltica 4mm Tipo II', 'Mat', 'Impermeabilização', 'm²', 35.67, 'Manual', 'alta', '2026-02-23'),
('Tela de Poliéster (Rolo 50m)', 'Mat', 'Impermeabilização', 'rolo', 190.00, 'Modelo Referência', 'alta', '2026-02-23'),
('Primer Asfáltico', 'Mat', 'Impermeabilização', 'L', 20.67, 'Manual', 'media', '2026-02-23'),
('EPS Isolamento Térmico T1F', 'Mat', 'Pisos/Enchimento', 'm²', 39.00, 'Manual', 'media', '2026-02-23'),
('EPS Reciclado (100mm)', 'Mat', 'Pisos/Enchimento', 'm²', 24.00, 'Manual', 'media', '2026-02-23'),
('Tela Soldada Q92', 'Mat', 'Pisos/Enchimento', 'm²', 25.00, 'Manual', 'alta', '2026-02-23'),
('Tela Soldada Q61', 'Mat', 'Pisos/Enchimento', 'painel', 88.33, 'Manual', 'alta', '2026-02-23'),
('Placa Drywall RU (Umidade)', 'Mat', 'Vedações', 'un', 42.67, 'Manual', 'media', '2026-02-23'),
('Lã de Rocha (144 kg/m³)', 'Mat', 'Vedações', 'm²', 130.00, 'Manual', 'media', '2026-02-23'),
('Bloco Canaleta 14x19x39cm', 'Mat', 'Vedações', 'un', 5.00, 'Ajuste', 'media', '2026-02-23'),
('Tijolo Maciço Comum', 'Mat', 'Vedações', 'un', 2.20, 'Ajuste', 'media', '2026-02-23'),
('Vergalhão CA-50 8.0mm', 'Mat', 'Aço/Fixação', 'barra', 38.00, 'Ajuste', 'media', '2026-02-23'),
('Adesivo Estrutural Epóxi (Kit)', 'Mat', 'Aço/Fixação', 'kit', 103.50, 'Manual', 'alta', '2026-02-23'),
('Rodapé Poliestireno Santa Luzia', 'Mat', 'Acabamentos', 'ml', 37.00, 'Manual', 'alta', '2026-02-23'),
('Super Adesivo Santa Luzia', 'Mat', 'Acabamentos', 'tubo', 48.00, 'Manual', 'alta', '2026-02-23'),

-- EQUIPAMENTOS (4 itens)
('Martelete Médio (10-15kg)', 'Equip', NULL, 'diária', 136.67, 'Modelo / Manual', 'alta', '2026-02-23'),
('Betoneira 400L', 'Equip', NULL, 'diária', 120.00, 'Manual', 'alta', '2026-02-23'),
('Maçarico de alta potência', 'Equip', NULL, 'diária', 80.00, 'Manual', 'media', '2026-02-23'),
('Cortador Porcelanato Grande', 'Equip', NULL, 'diária', 90.00, 'Manual', 'alta', '2026-02-23')
ON CONFLICT DO NOTHING;
