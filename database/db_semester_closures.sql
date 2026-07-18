-- ============================================
-- FECHAMENTO SEMESTRAL DE PRESTAÇÃO DE CONTAS
-- ============================================

-- 1. Tabela principal de fechamentos
CREATE TABLE IF NOT EXISTS semester_closures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id),
    semester TEXT NOT NULL,
    year INT NOT NULL,
    semester_number INT NOT NULL CHECK (semester_number IN (1, 2)),
    status TEXT NOT NULL DEFAULT 'Em Andamento' CHECK (status IN ('Em Andamento', 'Concluído', 'Reaberto')),
    summary_snapshot JSONB,
    executed_by UUID REFERENCES users(id),
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, semester)
);

-- 2. Linhas detalhadas do fechamento
CREATE TABLE IF NOT EXISTS semester_closure_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    closure_id UUID NOT NULL REFERENCES semester_closures(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id),
    rubric_id UUID REFERENCES rubrics(id),
    bank_account_id UUID REFERENCES bank_accounts(id),
    nature TEXT NOT NULL CHECK (nature IN ('Custeio', 'Capital')),
    total_income NUMERIC(15,2) DEFAULT 0,
    total_expense NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    reprogrammed_value NUMERIC(15,2) DEFAULT 0
);

-- 3. Documentos gerados no fechamento
CREATE TABLE IF NOT EXISTS semester_closure_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    closure_id UUID NOT NULL REFERENCES semester_closures(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Campos de travamento em financial_entries
ALTER TABLE financial_entries
    ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE financial_entries
    ADD COLUMN IF NOT EXISTS locked_by_closure_id UUID REFERENCES semester_closures(id);

-- 5. Indexes para performance
CREATE INDEX IF NOT EXISTS idx_closure_school_semester ON semester_closures(school_id, semester);
CREATE INDEX IF NOT EXISTS idx_closure_lines_closure ON semester_closure_lines(closure_id);
CREATE INDEX IF NOT EXISTS idx_entries_locked ON financial_entries(is_locked) WHERE is_locked = true;

-- 6. RLS
ALTER TABLE semester_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_closure_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_closure_documents ENABLE ROW LEVEL SECURITY;

-- Policies para semester_closures
CREATE POLICY "Authenticated users can view closures"
ON semester_closures FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert closures"
ON semester_closures FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update closures"
ON semester_closures FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete closures"
ON semester_closures FOR DELETE TO authenticated USING (true);

-- Policies para semester_closure_lines
CREATE POLICY "Authenticated users can view closure lines"
ON semester_closure_lines FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert closure lines"
ON semester_closure_lines FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete closure lines"
ON semester_closure_lines FOR DELETE TO authenticated USING (true);

-- Policies para semester_closure_documents
CREATE POLICY "Authenticated users can view closure documents"
ON semester_closure_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert closure documents"
ON semester_closure_documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete closure documents"
ON semester_closure_documents FOR DELETE TO authenticated USING (true);
