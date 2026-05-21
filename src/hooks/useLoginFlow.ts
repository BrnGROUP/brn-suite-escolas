import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';

interface UseLoginFlowProps {
  onLogin: (user: User) => void;
}

export const useLoginFlow = ({ onLogin }: UseLoginFlowProps) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isRegistering) {
        // --- REGISTER FLOW ---
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // Create profile with Cliente role by default, no school assigned yet
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: email,
              name: fullName,
              role: UserRole.CLIENTE, // Role padrão: Cliente (apenas visualização)
              school_id: null, // Sem escola vinculada inicialmente
              active: true // Permitir login para ver a página de espera
            });

          if (profileError) {
            // Lógica de "Claim Profile": Se o perfil já foi criado pelo Admin (pré-cadastro)
            if (profileError.code === '23505') { // Unique violation (email duplication)
              // Perfil pré-existente detectado. Executando vínculo seguro...
              const { data: claimSuccess, error: claimError } = await supabase.rpc('claim_profile_by_email');

              if (claimSuccess && !claimError) {
                setSuccessMsg('Conta vinculada com sucesso! Seu perfil pré-aprovado foi ativado.');
                setIsRegistering(false);
                setEmail('');
                setPassword('');
                setFullName('');
                return;
              } else {
                setErrorMsg(`Erro ao vincular perfil: ${claimError?.message || 'Erro Desconhecido ao tentar vincular conta pré-existente.'}`);
              }
            } else {
              setErrorMsg(`Erro ao salvar perfil: ${profileError.message}`);
            }
          } else {
            setSuccessMsg('Conta criada com sucesso! Agora você pode fazer login.');
            setIsRegistering(false);
            // Limpar campos
            setEmail('');
            setPassword('');
            setFullName('');
          }
        }
      } else {
        // --- LOGIN FLOW ---
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // Check if profile exists
          let { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          // Self-Healing & Vínculo RPC no Login
          if (!profile) {
            // Perfil não encontrado via ID. Tentando vincular via RPC (Login Flow)...
            const { data: claimed } = await supabase.rpc('claim_profile_by_email');

            if (claimed) {
              const { data: refreshed } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();
              profile = refreshed;
            } else {
              // Self-Healing Básico
              const newProfile = {
                id: authData.user.id,
                email: authData.user.email!,
                name: fullName || 'Usuário',
                role: UserRole.CLIENTE,
                school_id: null,
                active: true
              };

              const { error: insertError } = await supabase.from('users').insert(newProfile);

              if (insertError) {
                if (insertError.code === '23505') {
                  setErrorMsg('Erro de conflito. Seu email existe no cadastro administrativo mas o vínculo falhou. Contate o suporte.');
                  return;
                }
                throw insertError;
              }
              profile = newProfile as any;
            }
          }

          if (profile) {
            onLogin({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as UserRole,
              schoolId: profile.school_id,
              assignedSchools: profile.assigned_schools,
              active: profile.active,
              gee: profile.gee,
              avatar_url: profile.avatar_url
            });
          }
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetState = () => {
    setIsRegistering(!isRegistering);
    setErrorMsg('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setFullName('');
  };

  return {
    isRegistering,
    setIsRegistering,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    handleAuth,
    handleResetState
  };
};
