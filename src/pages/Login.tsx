import React from 'react';
import { User } from '../types';
import { useLoginFlow } from '../hooks/useLoginFlow';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const {
    isRegistering,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    loading,
    errorMsg,
    successMsg,
    handleAuth,
    handleResetState,
  } = useLoginFlow({ onLogin });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-display relative">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 md:top-8 md:left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors group"
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-sm font-medium">Voltar ao início</span>
        </button>
      )}

      <div className="w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-10 group">
          <div className="inline-flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <img
              src="/assets/logo/logo-circle.png"
              alt="BRN GROUP"
              className="w-24 h-24 rounded-full border-2 border-white/10 shadow-2xl relative z-10 animate-in zoom-in duration-700"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">BRN Suite Escolas</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Gestão financeira profissional para educação.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2 duration-300">
            <span className="material-symbols-outlined text-xl">error</span>
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm animate-in slide-in-from-top-2 duration-300">
            <span className="material-symbols-outlined text-xl">check_circle</span>
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {isRegistering && !successMsg && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-xl">rocket_launch</span>
              <div>
                <p className="font-bold mb-1 uppercase tracking-wider text-[10px]">Bem-vindo à Jornada!</p>
                <p className="text-slate-300 leading-relaxed">
                  Crie sua conta agora para conhecer todas as vantagens e funcionalidades do sistema.
                  O acesso aos dados da sua escola será liberado após a validação do Administrador.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          {isRegistering && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">person</span>
                <input
                  type="text"
                  required
                  className="bg-[#0f172a] border border-[#334155] text-white text-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block w-full pl-11 p-3 transition-all outline-none"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">mail</span>
              <input
                type="email"
                required
                className="bg-[#0f172a] border border-[#334155] text-white text-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block w-full pl-11 p-3 transition-all outline-none"
                placeholder="exemplo@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">lock</span>
              <input
                type="password"
                required
                minLength={6}
                className="bg-[#0f172a] border border-[#334155] text-white text-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block w-full pl-11 p-3 transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 text-white bg-primary hover:bg-primary-hover active:scale-[0.98] focus:ring-4 focus:outline-none focus:ring-primary/30 font-bold rounded-xl text-sm px-5 py-4 text-center transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Processando...
              </>
            ) : (
              <>{isRegistering ? 'Criar minha conta' : 'Acessar Sistema'}</>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#334155] text-center">
          <button
            onClick={handleResetState}
            className="text-sm text-slate-400 hover:text-primary font-medium transition-all group"
          >
            {isRegistering ? (
              <span className="flex items-center gap-1 justify-center">
                Já tem uma conta? <strong className="text-primary group-hover:underline">Faça login</strong>
              </span>
            ) : (
              <span className="flex items-center gap-1 justify-center">
                Não tem conta? <strong className="text-primary group-hover:underline">Cadastre-se aqui</strong>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
