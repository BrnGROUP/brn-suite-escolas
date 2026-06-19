-- SOLUÇÃO COMPLETA: FIX RLS + RPC VINCULO
-- Execute este script para garantir que todas as peças estejam no lugar.

-- 1. CORREÇÃO DE RLS (VISIBILIDADE E PERMISSÕES)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas/conflitantes
DROP POLICY IF EXISTS "users_read_safe" ON users;
DROP POLICY IF EXISTS "users_update_own_safe" ON users;
DROP POLICY IF EXISTS "users_admin_manage_safe" ON users;
DROP POLICY IF EXISTS "users_view_all_authenticated" ON users;
DROP POLICY IF EXISTS "users_read_profile" ON users;

-- Função auxiliar segura para verificar admin (sem recursão)
CREATE OR REPLACE FUNCTION public.is_admin_safe() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Administrador');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Políticas Definitivas
-- A) Leitura: Todos autenticados veem todos (necessário para listas e vínculo)
CREATE POLICY "users_read_allow_all" ON users FOR SELECT TO authenticated USING (true);

-- B) Update: O próprio usuário edita seu perfil
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- C) Admin: Controle total
CREATE POLICY "users_admin_full" ON users FOR ALL TO authenticated USING (public.is_admin_safe());

-- 2. FUNÇÃO R.P.C. PARA VINCULAR CONTA (CLAIM PROFILE)
-- Esta função é CRÍTICA para quem foi pré-cadastrado pelo Admin.
CREATE OR REPLACE FUNCTION public.claim_profile_by_email()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Ignora RLS
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    user_email TEXT;
    legacy_user RECORD;
BEGIN
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Obter o email diretamente da tabela auth.users para evitar problemas com JWT
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = current_user_id;

    IF user_email IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Busca perfil órfão (email igual, id diferente)
    SELECT * INTO legacy_user 
    FROM public.users 
    WHERE email = user_email 
    AND id != current_user_id
    LIMIT 1;

    IF FOUND THEN
        -- Verifica se o perfil atual já existe (self-healing parcial)
        PERFORM 1 FROM public.users WHERE id = current_user_id;
        
        IF FOUND THEN
             -- Se já existe cadastro com ID novo, atualiza com dados do legado
            UPDATE public.users 
            SET role = legacy_user.role,
                school_id = legacy_user.school_id,
                assigned_schools = legacy_user.assigned_schools,
                gee = legacy_user.gee,
                active = true
            WHERE id = current_user_id;
        ELSE
            -- Se não existe, cria com ID novo e dados do legado
            INSERT INTO public.users (id, name, email, role, school_id, assigned_schools, gee, active, avatar_url)
            VALUES (current_user_id, legacy_user.name, user_email, legacy_user.role, legacy_user.school_id, legacy_user.assigned_schools, legacy_user.gee, true, legacy_user.avatar_url);
        END IF;

        -- Remove o perfil órfão antigo para limpar
        DELETE FROM public.users WHERE id = legacy_user.id;
        
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_profile_by_email() TO authenticated;
