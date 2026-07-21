-- 1. Executa a limpeza e padronização na tabela de escolas
DO $$
DECLARE
    school_rec RECORD;
    mod_array TEXT[];
    cleaned_array TEXT[];
    item TEXT;
    new_item TEXT;
    final_str TEXT;
BEGIN
    FOR school_rec IN SELECT id, teaching_modality FROM schools WHERE teaching_modality IS NOT NULL AND teaching_modality <> '' LOOP
        mod_array := string_to_array(school_rec.teaching_modality, ',');
        cleaned_array := '{}';
        
        FOREACH item IN ARRAY mod_array LOOP
            -- Remove espaços nas pontas e padroniza
            item := trim(item);
            
            -- Mapeia os nomes antigos/duplicados para a versão nova padrão
            IF upper(item) IN ('INTEGRAL 9H', 'INTEGRAL 9 HORAS') THEN
                new_item := 'Integral 9 horas';
            ELSIF upper(item) IN ('INTEGRAL 7H', 'INTEGRAL 7 HORAS') THEN
                new_item := 'Integral 7 horas - Manhã'; -- Mapeamento padrão seguro
            ELSIF upper(item) = 'EJA' THEN
                new_item := 'Educação de Jovens e Adultos';
            ELSE
                new_item := item; -- Mantém outras caso existam
            END IF;
            
            -- Adiciona apenas se não for duplicado e não for vazio
            IF new_item <> '' AND NOT (new_item = ANY(cleaned_array)) THEN
                cleaned_array := array_append(cleaned_array, new_item);
            END IF;
        END LOOP;
        
        -- Junta de volta com vírgula e espaço
        final_str := array_to_string(cleaned_array, ', ');
        
        UPDATE schools SET teaching_modality = final_str WHERE id = school_rec.id;
    END LOOP;
END $$;
