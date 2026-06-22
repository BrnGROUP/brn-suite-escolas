-- Alter table schools to add CEP, phone, teaching modality and attachment fields
-- Note: cep and phone may already exist in some environments, so we use ADD COLUMN IF NOT EXISTS

ALTER TABLE schools ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS teaching_modality TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS ata_conselho_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS cardapio_url TEXT;

COMMENT ON COLUMN schools.teaching_modality IS 'Modalidades de ensino atendidas pela escola (ex: Integral 9h, Integral 7h, Parcial, EJA)';
COMMENT ON COLUMN schools.ata_conselho_url IS 'URL do arquivo da ata do conselho escolar anexada';
COMMENT ON COLUMN schools.cardapio_url IS 'URL do arquivo do cardápio escolar anexado';
