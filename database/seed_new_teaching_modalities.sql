-- Limpa as modalidades de ensino antigas e insere as novas solicitadas pelo usuário
TRUNCATE TABLE teaching_modalities CASCADE;

INSERT INTO teaching_modalities (name) VALUES 
('Integral 7 horas - Manhã'),
('Integral 7 horas - Tarde'),
('Integral 9 horas'),
('Educação Básica - Ensino Médio'),
('Educação Básica - Ensino Fundamental'),
('Educação de Jovens e Adultos')
ON CONFLICT (name) DO NOTHING;
