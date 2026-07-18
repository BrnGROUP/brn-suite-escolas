import React, { lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { UserRole } from './types';
import { useAuth } from './context/AuthContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const FinancialEntries = lazy(() => import('./pages/FinancialEntries'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Help = lazy(() => import('./pages/Help'));
const Schools = lazy(() => import('./pages/Schools'));
const Users = lazy(() => import('./pages/Users'));
const Notifications = lazy(() => import('./pages/Notifications'));
const DocumentSafe = lazy(() => import('./pages/DocumentSafe'));
const BankReconciliation = lazy(() => import('./pages/BankReconciliation'));
const WaitingPage = lazy(() => import('./pages/WaitingPage'));
const GEEPage = lazy(() => import('./pages/GEE'));
const ProgramsGuide = lazy(() => import('./pages/ProgramsGuide'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Contract = lazy(() => import('./pages/Contract'));
const ValidateReport = lazy(() => import('./pages/ValidateReport'));
const SemesterClosure = lazy(() => import('./pages/SemesterClosure'));

const AppRoutes: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={
                <LandingPage 
                    onLoginClick={() => navigate('/login')} 
                    onGuideClick={() => navigate('/guide')} 
                />
            } />
            <Route path="/login" element={
                <Login 
                    onLogin={() => navigate('/dashboard')} 
                    onBack={() => navigate('/')} 
                />
            } />
            <Route path="/guide" element={
                <ProgramsGuide onBack={() => navigate('/')} />
            } />
            <Route path="/validate" element={
                <ValidateReport />
            } />

            {/* Private Routes (AppLayout + ProtectedRoute) */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard user={currentUser!} />} />
                <Route path="/entries" element={<FinancialEntries user={currentUser!} />} />
                <Route path="/reports" element={<Reports user={currentUser!} />} />
                <Route path="/notifications" element={<Notifications user={currentUser!} />} />
                <Route path="/settings" element={<Settings user={currentUser!} />} />
                <Route path="/help" element={<Help user={currentUser!} />} />
                
                {/* Role Protected Private Routes */}
                <Route path="/reconciliation" element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OPERADOR, UserRole.TECNICO_GEE]}>
                        <BankReconciliation user={currentUser!} />
                    </ProtectedRoute>
                } />
                <Route path="/vault" element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OPERADOR, UserRole.TECNICO_GEE]}>
                        <DocumentSafe user={currentUser!} />
                    </ProtectedRoute>
                } />
                <Route path="/schools" element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OPERADOR, UserRole.TECNICO_GEE]}>
                        <Schools user={currentUser!} />
                    </ProtectedRoute>
                } />
                <Route path="/gee" element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OPERADOR]}>
                        <GEEPage user={currentUser!} />
                    </ProtectedRoute>
                } />
                <Route path="/users" element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <Users user={currentUser!} />
                    </ProtectedRoute>
                } />
                <Route path="/fechamento" element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OPERADOR]}>
                        <SemesterClosure user={currentUser!} />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Special Waiting / Contract pages */}
            <Route path="/waiting" element={
                <ProtectedRoute>
                    <WaitingPage user={currentUser!} />
                </ProtectedRoute>
            } />
            <Route path="/contract" element={
                <ProtectedRoute>
                    <Contract user={currentUser!} onSigned={() => navigate('/dashboard')} />
                </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
