import { describe, it, expect } from 'vitest';
import { supabase } from './supabaseClient';

describe('Supabase Security Guard (Vitest Setup)', () => {
    it('deve permitir operacoes de leitura (SELECT) normalmente', async () => {
        // Criamos a query de leitura. 
        // Ela nao deve disparar o erro do guarda de seguranca.
        expect(() => {
            supabase.from('schools').select('id, name');
        }).not.toThrow();
    });

    it('deve bloquear RIGOROSAMENTE operacoes de gravação (INSERT)', async () => {
        expect(() => {
            supabase.from('schools').insert({ name: 'Escola Teste Invasiva' });
        }).toThrow(/🚫 \[Security Guard\] Write operation \(INSERT\) is strictly forbidden/);
    });

    it('deve bloquear RIGOROSAMENTE operacoes de modificacao (UPDATE)', async () => {
        expect(() => {
            supabase.from('schools').update({ name: 'Escola Modificada' });
        }).toThrow(/🚫 \[Security Guard\] Write operation \(UPDATE\) is strictly forbidden/);
    });

    it('deve bloquear RIGOROSAMENTE operacoes de exclusao (DELETE)', async () => {
        expect(() => {
            supabase.from('schools').delete();
        }).toThrow(/🚫 \[Security Guard\] Write operation \(DELETE\) is strictly forbidden/);
    });

    it('deve bloquear RIGOROSAMENTE operacoes de salvamento misto (UPSERT)', async () => {
        expect(() => {
            supabase.from('schools').upsert({ id: '1', name: 'Escola Upsert' });
        }).toThrow(/🚫 \[Security Guard\] Write operation \(UPSERT\) is strictly forbidden/);
    });
});
