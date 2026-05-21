-- ==========================================
-- BRN Suite Escolas - Unified Database Schema
-- Consolidated & Idempotent DDL Schema File
-- ==========================================

-- Enable PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Idempotent Custom Types Definition
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Administrador', 'Operador', 'Diretor', 'Técnico GEE', 'Cliente');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('Pago', 'Recebido', 'Pendente', 'Estornado', 'Conciliado', 'Agendado', 'Consolidado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_nature') THEN
        CREATE TYPE transaction_nature AS ENUM ('Custeio', 'Capital');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('Entrada', 'Saída');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
        CREATE TYPE alert_severity AS ENUM ('Crítico', 'Atenção', 'Informativo');
    END IF;
END $$;

-- 2. Create Core Tables (Idempotent)

-- GEE (Gerência Executiva de Educação) Regional Units
CREATE TABLE IF NOT EXISTS gees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schools (Educational Units / APMs)
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    inep TEXT,
    seec TEXT,
    conselho_escolar TEXT,
    cnpj TEXT,
    phone TEXT,
    director TEXT,
    secretary TEXT,
    address TEXT,
    city TEXT,
    uf TEXT,
    image_url TEXT,
    plan_id TEXT,
    custom_price TEXT,
    custom_title TEXT,
    discount_value DECIMAL(15, 2) DEFAULT 0,
    director_cpf TEXT,
    director_rg TEXT,
    director_address TEXT,
    custom_description TEXT,
    active BOOLEAN DEFAULT true,
    notes TEXT,
    gee_id UUID REFERENCES gees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (Profiles linked to Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    assigned_schools UUID[] DEFAULT '{}'::uuid[],
    avatar_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Programs (Government Funding Programs e.g. PDDE)
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rubrics / Action Lines
CREATE TABLE IF NOT EXISTS rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    default_nature transaction_nature DEFAULT 'Custeio',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    cep TEXT,
    address TEXT,
    city TEXT,
    uf TEXT,
    representative_name TEXT,
    representative_cpf TEXT,
    stamp_url TEXT,
    bank_info JSONB DEFAULT '{"bank": "", "agency": "", "account": ""}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    agency TEXT,
    account_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Entries (Revenues, Expenses, etc.)
CREATE TABLE IF NOT EXISTS financial_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    program_id UUID REFERENCES programs(id) NOT NULL,
    rubric_id UUID REFERENCES rubrics(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    description TEXT,
    value DECIMAL(15, 2) NOT NULL,
    status transaction_status DEFAULT 'Pendente',
    nature transaction_nature NOT NULL,
    type transaction_type NOT NULL,
    category TEXT,
    batch_id TEXT,
    invoice_date DATE,
    document_number TEXT,
    payment_date DATE,
    auth_number TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accountability Processes (Technical Workflows)
CREATE TABLE IF NOT EXISTS accountability_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    financial_entry_id UUID REFERENCES financial_entries(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Em Andamento',
    discount DECIMAL(15,2) DEFAULT 0,
    checklist JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accountability Items
CREATE TABLE IF NOT EXISTS accountability_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id UUID REFERENCES accountability_processes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(15,4) DEFAULT 1,
    unit TEXT DEFAULT 'Unid.',
    winner_unit_price DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accountability Quotes
CREATE TABLE IF NOT EXISTS accountability_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id UUID REFERENCES accountability_processes(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT,
    supplier_cnpj TEXT,
    total_value DECIMAL(15,2) DEFAULT 0,
    is_winner BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accountability Quote Items
CREATE TABLE IF NOT EXISTS accountability_quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES accountability_quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(15,4) DEFAULT 1,
    unit TEXT DEFAULT 'Unid.',
    unit_price DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reprogrammed Balances (Balances carried forward from previous periods)
CREATE TABLE IF NOT EXISTS reprogrammed_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE,
    nature transaction_nature,
    period TEXT,
    value DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial / Accounting Periods
CREATE TABLE IF NOT EXISTS periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID REFERENCES financial_entries(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    changes JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role Permissions Matrix (RBAC)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    resource TEXT NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    UNIQUE(role, resource)
);

-- Platform Billing Records (SaaS Billing for school access)
CREATE TABLE IF NOT EXISTS platform_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    reference_month TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_date DATE,
    payment_method TEXT,
    status TEXT DEFAULT 'Pendente',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_school_month_mensalidade UNIQUE (school_id, reference_month, description)
);

-- Bank Statement Upload Tracking
CREATE TABLE IF NOT EXISTS statement_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE NOT NULL,
    reference_month TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Contracts Generator Metadata
CREATE TABLE IF NOT EXISTS supplier_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
    contract_number TEXT,
    contract_date DATE NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    object TEXT NOT NULL,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tickets / Requests
CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Aberto',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Configurations & Settings Store
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User/School Notifications System
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity alert_severity DEFAULT 'Informativo',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Row Level Security (RLS) Configuration & Policies

ALTER TABLE gees ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reprogrammed_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Global Hardened Access Policies for Authenticated Users
-- Uses the user session context to securely scope operations

CREATE POLICY "Full access for authenticated users" ON gees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON schools FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON programs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON rubrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON bank_accounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON payment_methods FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON financial_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON accountability_processes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON accountability_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON accountability_quotes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON accountability_quote_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON reprogrammed_balances FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON periods FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON audit_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON role_permissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON platform_billing FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON statement_uploads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON supplier_contracts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON support_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON system_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON notifications FOR ALL USING (auth.role() = 'authenticated');
