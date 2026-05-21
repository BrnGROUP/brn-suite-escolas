import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEntryForm } from './useEntryForm';
import { TransactionStatus, TransactionNature, User, UserRole } from '../types';

// Mock ToastContext
vi.mock('../context/ToastContext', () => ({
    useToast: () => ({
        addToast: vi.fn()
    })
}));

// Mock useFileUpload hook
vi.mock('./useFileUpload', () => ({
    useFileUpload: () => ({
        uploadFile: vi.fn().mockResolvedValue({ publicUrl: 'https://test.com/file.pdf' }),
        isUploading: false
    })
}));

// Mock Supabase
const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: [{ id: '123' }], error: null }),
    update: vi.fn().mockResolvedValue({ data: { id: '123' }, error: null }),
    delete: vi.fn().mockResolvedValue({ error: null }),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((onFulfilled) => {
        return Promise.resolve({ data: [], error: null }).then(onFulfilled);
    })
};

vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        from: vi.fn().mockImplementation(() => mockQueryBuilder),
        storage: {
            from: vi.fn().mockImplementation(() => ({
                upload: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url' } })
            }))
        }
    }
}));

describe('useEntryForm', () => {
    const mockUser: User = {
        id: 'u1',
        name: 'Diretor Teste',
        email: 'diretor@escola.com',
        role: UserRole.DIRETOR,
        schoolId: 'esc1'
    };

    const mockAuxData = {
        programs: [{ id: 'p1', name: 'Programa FNDE' }],
        rubrics: [
            { id: 'r1', name: 'Rubrica Alimentação', program_id: 'p1', default_nature: TransactionNature.CUSTEIO },
            { id: 'r2', name: 'Rubrica Infraestrutura', program_id: 'p1', default_nature: TransactionNature.CAPITAL }
        ],
        suppliers: [{ id: 's1', name: 'Fornecedor A', cnpj: '12.345.678/0001-90' }],
        bankAccounts: [{ id: 'b1', name: 'Conta Caixa', program_id: 'p1', school_id: 'esc1', account_number: '12345' }],
        paymentMethods: [{ id: 'pm1', name: 'Pix' }]
    };

    const mockAccessibleSchools = [{ id: 'esc1', name: 'Escola Modelo' }];
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        user: mockUser,
        editingId: null,
        editingBatchId: null,
        auxData: mockAuxData,
        accessibleSchools: mockAccessibleSchools,
        onSave: mockOnSave
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve inicializar com estados corretos de novo lançamento', () => {
        const { result } = renderHook(() => useEntryForm(defaultProps));

        expect(result.current.type).toBe('Saída');
        expect(result.current.category).toBe('Compra de Produtos');
        expect(result.current.selectedSchoolId).toBe('esc1');
        expect(result.current.status).toBe(TransactionStatus.PENDENTE);
        expect(result.current.isSplitMode).toBe(false);
        expect(result.current.splitItems).toEqual([]);
        expect(result.current.activeTab).toBe('dados');
    });

    it('deve calcular corretamente se é simplificado ou operação bancária', () => {
        const { result } = renderHook((props) => useEntryForm(props), {
            initialProps: defaultProps
        });

        // "Compra de Produtos" não é simplificado nem bancário
        expect(result.current.isSimplified).toBe(false);
        expect(result.current.isBankOp).toBe(false);

        // Mudar para "Tarifa Bancária"
        act(() => {
            result.current.setCategory('Tarifa Bancária');
        });

        expect(result.current.isSimplified).toBe(true);
        expect(result.current.isBankOp).toBe(true);

        // Mudar para "Impostos / Tributos"
        act(() => {
            result.current.setCategory('Impostos / Tributos');
        });

        expect(result.current.isSimplified).toBe(true);
        expect(result.current.isBankOp).toBe(false);
    });

    it('deve alternar a categoria se o tipo mudar e a categoria atual for inválida para o novo tipo', () => {
        const { result } = renderHook(() => useEntryForm(defaultProps));

        // Categoria de Saída inicial
        expect(result.current.category).toBe('Compra de Produtos');

        // Mudar para Entrada
        act(() => {
            result.current.setType('Entrada');
        });

        // Deve forçar categoria válida de Entrada (que é a primeira do ENTRY_CATEGORIES no constants)
        expect(result.current.category).not.toBe('Compra de Produtos');
    });

    it('deve permitir adicionar e remover anexos', () => {
        const { result } = renderHook(() => useEntryForm(defaultProps));

        expect(result.current.attachments).toEqual([]);

        // Simular upload de arquivo
        const file = new File(['dummy content'], 'nota.pdf', { type: 'application/pdf' });
        const event = {
            target: {
                files: [file]
            }
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        act(() => {
            result.current.handleFileUpload(event, 'Nota Fiscal');
        });

        // Adicionar anexo mock
        act(() => {
            result.current.removeAttachment('non-existent');
        });

        expect(result.current.attachments.length).toBe(0);
    });

    it('deve calcular filteredRubrics com base no programa selecionado', () => {
        const { result } = renderHook(() => useEntryForm(defaultProps));

        expect(result.current.filteredRubrics).toEqual([]);

        act(() => {
            result.current.setSelectedProgramId('p1');
        });

        expect(result.current.filteredRubrics.length).toBe(2);
        expect(result.current.filteredRubrics[0].id).toBe('r1');
    });
});
