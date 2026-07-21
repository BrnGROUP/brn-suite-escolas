-- Adiciona coluna ficha_tecnica_url na tabela schools se não existir
ALTER TABLE schools ADD COLUMN IF NOT EXISTS ficha_tecnica_url TEXT;
