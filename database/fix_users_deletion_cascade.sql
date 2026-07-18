-- ============================================================
-- AJUSTE DE INTEGRIDADE REFERENCIAL PARA EXCLUSÃO DE USUÁRIOS
-- ============================================================

-- 1. semester_closures (executed_by -> ON DELETE SET NULL)
ALTER TABLE semester_closures 
    DROP CONSTRAINT IF EXISTS semester_closures_executed_by_fkey;
ALTER TABLE semester_closures 
    ADD CONSTRAINT semester_closures_executed_by_fkey 
    FOREIGN KEY (executed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 2. contract_signatures (user_id -> ON DELETE CASCADE)
-- (Tenta dropar possíveis nomes de restrição e recriar com CASCADE)
ALTER TABLE contract_signatures 
    DROP CONSTRAINT IF EXISTS contract_signatures_user_id_fkey;
ALTER TABLE contract_signatures 
    ADD CONSTRAINT contract_signatures_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. support_requests (user_id -> ON DELETE CASCADE se a coluna existir)
-- (Como support_requests em algumas versões usa user_id, garantimos o CASCADE)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='support_requests' AND column_name='user_id'
    ) THEN
        ALTER TABLE support_requests DROP CONSTRAINT IF EXISTS support_requests_user_id_fkey;
        ALTER TABLE support_requests ADD CONSTRAINT support_requests_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. document_checklists (checked_by -> ON DELETE SET NULL se a coluna existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='document_checklists' AND column_name='checked_by'
    ) THEN
        ALTER TABLE document_checklists DROP CONSTRAINT IF EXISTS document_checklists_checked_by_fkey;
        ALTER TABLE document_checklists ADD CONSTRAINT document_checklists_checked_by_fkey 
            FOREIGN KEY (checked_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;
