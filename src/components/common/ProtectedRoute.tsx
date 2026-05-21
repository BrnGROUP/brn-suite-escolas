import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { currentUser, loading, needsSignature } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#0f172a] text-white">
                <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
                    <span className="text-sm font-medium text-slate-400">Carregando permissões...</span>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        // Redireciona para a raiz pública se não estiver logado
        return <Navigate to="/" replace />;
    }

    // Validações de autorização / ativação
    const isStaff = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OPERADOR;
    const hasAssignedSchools = currentUser.assignedSchools && currentUser.assignedSchools.length > 0;
    const isAuthorized = isStaff || !!currentUser.schoolId || !!hasAssignedSchools;
    const isWaiting = currentUser.active === false || !isAuthorized;

    if (isWaiting) {
        if (location.pathname !== '/waiting') {
            return <Navigate to="/waiting" replace />;
        }
        return <>{children}</>;
    }

    // Se já estiver liberado, não deve ficar em /waiting
    if (location.pathname === '/waiting') {
        return <Navigate to="/dashboard" replace />;
    }

    if (needsSignature) {
        if (location.pathname !== '/contract') {
            return <Navigate to="/contract" replace />;
        }
        return <>{children}</>;
    }

    // Se já assinou, não deve ficar em /contract
    if (location.pathname === '/contract') {
        return <Navigate to="/dashboard" replace />;
    }

    // Controle de papéis (RBAC): redireciona para a home privada se já estiver logado
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
