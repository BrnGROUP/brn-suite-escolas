
export enum UserRole {
    ADMIN = 'Administrador',
    OPERADOR = 'Operador',
    DIRETOR = 'Diretor',
    TECNICO_GEE = 'Técnico GEE',
    CLIENTE = 'Cliente'
}

export enum TransactionStatus {
    PENDENTE = 'Pendente',
    PAGO = 'Pago',
    RECEBIDO = 'Recebido',
    AGENDADO = 'Agendado',
    ESTORNADO = 'Estornado',
    CONCILIADO = 'Conciliado',
    CONSOLIDADO = 'Consolidado'
}

export enum TransactionNature {
    CUSTEIO = 'Custeio',
    CAPITAL = 'Capital'
}

export interface User {
    id: string;
    name: string;
    email: string | null;
    role: UserRole;
    schoolId?: string;
    assignedSchools?: string[];
    active?: boolean; // Status do usuário (ativo/inativo)
    gee?: string; // GEE do técnico (apenas para Técnico GEE)
    avatar_url?: string; // URL da foto do usuário
}

export interface AuditLog {
    id: string;
    entry_id: string;
    user_name: string;
    action: string;
    changes: any;
    timestamp: string;
}

export interface Attachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size?: number;
    category?: 'Nota Fiscal' | 'Espelho da Nota' | 'Comprovante' | 'Extrato Bancário' | 'CNPJ' | 'Certidões' | 'FGTS' | 'Trabalhista' | 'Outros';
}

export interface Supplier {
    id: string;
    name: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    cep?: string;
    address?: string;
    city?: string;
    uf?: string;
    bank_info?: {
        bank: string;
        agency: string;
        account: string;
    };
    stamp_url?: string;
    rep_name?: string;
    rep_cpf?: string;
    rep_rg?: string;
    rep_address?: string;
}

export interface FinancialEntry {
    id: string;
    school_id: string;
    school: string; // Display name
    date: string;
    description: string;
    value: number;
    status: TransactionStatus;
    type: 'Entrada' | 'Saída';
    program_id: string;
    program: string; // Display name
    rubric_id?: string;
    rubric: string; // Display name
    supplier_id?: string;
    supplier?: string; // Display name
    nature: TransactionNature;
    category?: string;
    batch_id?: string;
    invoice_date?: string;
    document_number?: string; // Número da Nota
    payment_date?: string;
    auth_number?: string; // Número do Pagamento/Doc
    attachment_url?: string;
    attachments?: Attachment[];
    bank_account_id?: string;
    bank_account?: string; // Display name
    payment_method_id?: string;
    payment_method?: string; // Display name
    contract_id?: string;
    is_reconciled?: boolean;
    reconciled_at?: string;
    bank_transaction_ref?: string;
    logs?: any[];
    is_locked?: boolean;
    locked_by_closure_id?: string;
}

export interface Alert {
    id: string;
    title: string;
    description: string;
    severity: 'Crítico' | 'Médio' | 'Atenção' | 'Informativo';
    timestamp?: string;
    school_id?: string;
    school_name?: string;
}

export interface School {
    id: string;
    name: string;
    inep?: string;
    seec?: string;
    conselho_escolar?: string;
    cnpj?: string;
    phone?: string;
    director?: string;
    secretary?: string;
    address?: string;
    city?: string;
    uf?: string;
    cep?: string;
    image_url?: string;
    gee?: string; // Gerência Executiva de Educação
    gee_id?: string;
    plan_id?: string; // ID do plano contratado
    custom_price?: string; // Preço personalizado para a escola
    custom_title?: string; // Título personalizado do plano para a escola
    discount_value?: number; // Valor do desconto em reais
    director_cpf?: string;
    director_rg?: string;
    director_address?: string;
    custom_description?: string;
    active?: boolean;
    notes?: string;
    teaching_modality?: string;
    ata_conselho_url?: string;
    cardapio_url?: string;
    ficha_tecnica_url?: string;
}

export interface Program {
    id: string;
    name: string;
    description?: string;
}

export interface Rubric {
    id: string;
    program_id: string;
    name: string;
    default_nature?: TransactionNature;
    school_id?: string;
}

export interface BankAccount {
    id: string;
    school_id?: string;
    program_id?: string;
    name: string;
    bank_name: string;
    agency?: string;
    account_number?: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
}

export interface AccountabilityProcess {
    id: string;
    financial_entry_id: string;
    school_id: string;
    status: 'Em Andamento' | 'Concluído';
    description?: string;
    is_contract_based?: boolean;
    contract_id?: string;
    discount?: number;
    checklist?: { id: string, label: string, checked: boolean }[];
    attachments?: Attachment[];
    created_at: string;
    updated_at: string;
    financial_entry?: FinancialEntry;
    items?: AccountabilityItem[];
    quotes?: AccountabilityQuote[];
}

export interface AccountabilityItem {
    id: string;
    process_id: string;
    description: string;
    quantity: number;
    unit: string;
    winner_unit_price: number;
}

export interface AccountabilityQuote {
    id: string;
    process_id: string;
    supplier_id?: string;
    supplier_name: string;
    supplier_cnpj?: string;
    is_winner: boolean;
    total_value: number;
    items?: AccountabilityQuoteItem[];
}

export interface AccountabilityQuoteItem {
    id: string;
    quote_id: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    is_read: boolean;
    link?: string;
    created_at: string;
}

export interface RolePermission {
    id: string;
    role: UserRole;
    resource: 'entries' | 'schools' | 'reports' | 'settings' | 'users';
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

export interface Permission {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export interface ReprogrammedBalance {
    id: string;
    school_id: string;
    program_id: string;
    rubric_id?: string;
    nature: TransactionNature;
    period: string; // e.g. '2025'
    value: number;
}

export interface SupplierContract {
    id: string;
    school_id: string;
    supplier_id: string;
    program_id: string;
    rubric_id?: string;
    description: string;
    monthly_value: number;
    total_value?: number;
    start_date: string;
    end_date: string;
    category?: 'INTERNET' | 'GÁS' | 'OUTROS';
    status: 'Ativo' | 'Encerrado' | 'Suspenso';
    contract_number?: string;
    signing_date?: string;
    terms_json?: {
        index_type?: string;
        sla_hours?: string;
        internet_speed?: string;
        witness_1_name?: string;
        witness_1_cpf?: string;
        witness_1_rg?: string;
        witness_2_name?: string;
        witness_2_cpf?: string;
        witness_2_rg?: string;
        [key: string]: any;
    };
    created_at?: string;
}

export interface ContractSignature {
    id: string;
    user_id: string;
    signed_at: string;
    contract_version: string;
    ip_address?: string;
    status: string;
}

export interface PlatformBilling {
    id: string;
    school_id: string;
    reference_month: string;
    amount: number;
    status: 'Pendente' | 'Pago' | 'Cancelado' | 'Atrasado';
    payment_method?: string;
    payment_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    schools?: School;
    paid_amount?: number;
    description?: string;
}


export interface StatementUpload {
    id: string;
    school_id: string;
    bank_account_id: string;
    month: number;
    year: number;
    account_type: 'Conta Corrente' | 'Conta Investimento';
    file_url: string;
    file_name: string;
    pdf_url?: string;
    pdf_name?: string;
    no_movement?: boolean;
    no_movement_reason?: string;
    no_movement_confirmed_by?: string;
    no_movement_confirmed_at?: string;
    reported_revenue?: number;
    reported_taxes?: number;
    reported_balance?: number;
    uploaded_by?: string;
    created_at: string;
}

export interface BankTransaction {
    id: string;
    date: string;
    description: string;
    value: number;
    type: 'C' | 'D'; // Credit or Debit
    fitid: string;  // Bank unique transaction ID
    matched_entry_id?: string;
    status: 'pending' | 'matched' | 'new' | 'reconciled' | 'ignored';
    extract_type: 'Conta Corrente' | 'Conta Investimento';
}

export type SemesterClosureStatus = 'Em Andamento' | 'Concluído' | 'Reaberto';

export interface SemesterClosure {
    id: string;
    school_id: string;
    semester: string;
    year: number;
    semester_number: 1 | 2;
    status: SemesterClosureStatus;
    summary_snapshot?: any;
    executed_by?: string;
    executed_at?: string;
    created_at: string;
    updated_at: string;
    schools?: School;
    users?: { name: string };
    semester_closure_lines?: SemesterClosureLine[];
    semester_closure_documents?: SemesterClosureDocument[];
}

export interface SemesterClosureLine {
    id: string;
    closure_id: string;
    program_id: string;
    rubric_id?: string;
    bank_account_id?: string;
    nature: TransactionNature;
    total_income: number;
    total_expense: number;
    balance: number;
    reprogrammed_value: number;
    programs?: Program;
    rubrics?: Rubric;
    bank_accounts?: BankAccount;
}

export interface SemesterClosureDocument {
    id: string;
    closure_id: string;
    document_type: 'demonstrativo' | 'relacao_bens' | 'conciliacao' | 'termo_doacao';
    file_url?: string;
    file_name?: string;
    generated_at: string;
}
