-- Adicionar coluna cep na tabela schools
ALTER TABLE schools ADD COLUMN IF NOT EXISTS cep TEXT;

-- Comentários explicativos
COMMENT ON COLUMN schools.cep IS 'CEP (Código de Endereçamento Postal) do endereço da escola';

-- Adicionar coluna description na tabela accountability_processes
ALTER TABLE accountability_processes ADD COLUMN IF NOT EXISTS description TEXT;

-- Comentários explicativos
COMMENT ON COLUMN accountability_processes.description IS 'Descrição do processo de prestação de contas';
