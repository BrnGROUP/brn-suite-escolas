-- FUNÇÃO RPC PARA VINCULAR PERFIL PRÉ-CRIADO AO NOVO LOGIN
-- Resolve o problema onde o RLS impedia a deleção do perfil antigo durante o cadastro.

CREATE OR REPLACE FUNCTION public.claim_profile_by_email()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com privilégios de superusuário para ignorar RLS na deleção/troca
SET search_path = public -- Segurança
AS $$
DECLARE
    current_user_id UUID;
    user_email TEXT;
    legacy_user RECORD;
    affected_rows INT;
BEGIN
    -- Obter ID do usuário autenticado atual
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Obter o email diretamente da tabela auth.users para evitar problemas com JWT
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = current_user_id;

    IF user_email IS NULL THEN
        RAISE EXCEPTION 'Email do usuário não encontrado';
    END IF;

    -- Buscar se existe um perfil "órfão" (criado pelo admin) com este email, mas ID diferente
    SELECT * INTO legacy_user 
    FROM public.users 
    WHERE email = user_email 
    AND id != current_user_id
    LIMIT 1;

    IF FOUND THEN
        -- 1. Remover o perfil antigo (que tem o ID errado gerado no Users.tsx)
        DELETE FROM public.users WHERE id = legacy_user.id;
        
        -- 2. Verificar se já existe um perfil com o ID correto (pode ter sido criado parcialmente)
        PERFORM 1 FROM public.users WHERE id = current_user_id;
        
        IF FOUND THEN
             -- Se já existe (ex: criado pelo self-healing mas sem dados), ATUALIZA com os dados do legado
            UPDATE public.users 
            SET 
                role = legacy_user.role,
                school_id = legacy_user.school_id,
                assigned_schools = legacy_user.assigned_schools,
                gee = legacy_user.gee,
                active = true
            WHERE id = current_user_id;
        ELSE
            -- 3. Se não existe, CRIA o novo perfil com o ID de autenticação correto e os dados do legado
            INSERT INTO public.users (
                id, 
                name, 
                email, 
                role, 
                school_id, 
                assigned_schools, 
                gee, 
                active, 
                avatar_url
            ) VALUES (
                current_user_id,
                legacy_user.name, -- Usa o nome que o admin definiu
                user_email,
                legacy_user.role,
                legacy_user.school_id,
                legacy_user.assigned_schools,
                legacy_user.gee,
                true,
                legacy_user.avatar_url
            );
        END IF;

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Permissão de execução para usuários logados
GRANT EXECUTE ON FUNCTION public.claim_profile_by_email() TO authenticated;
