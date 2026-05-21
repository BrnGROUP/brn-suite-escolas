import React, { useState, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar';
import { useAuth } from '../../context/AuthContext';

const AppLayout: React.FC = () => {
    const { currentUser, logout, needsSignature } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Determina a página ativa com base no path para passar para Sidebar e Topbar
    const getActivePageKey = () => {
        const path = location.pathname.substring(1); // Remove barra inicial
        return path || 'dashboard';
    };

    const activePage = getActivePageKey();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display relative">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar
                user={currentUser}
                onLogout={handleLogout}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isMobileOpen={isMobileMenuOpen}
                onMobileClose={() => setIsMobileMenuOpen(false)}
            />

            <div className={`flex flex-col flex-1 min-w-0 transition-all duration-500`}>
                <Topbar
                    user={currentUser!}
                    activePageName={needsSignature ? 'waiting' : activePage}
                    onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <Suspense fallback={
                        <div className="h-full w-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
                        </div>
                    }>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
