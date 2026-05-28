import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    needsSignature: boolean;
    setNeedsSignature: (needs: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsSignature, setNeedsSignature] = useState(false);

    const checkContractSignature = async (userId: string, role: UserRole) => {
        if (role !== UserRole.DIRETOR) {
            setNeedsSignature(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('contract_signatures')
                .select('id')
                .eq('user_id', userId)
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Error checking contract signature:', error);
                setNeedsSignature(true); // Secure by default
                return;
            }

            setNeedsSignature(!data);
        } catch (err) {
            console.error('Error checking contract signature:', err);
            setNeedsSignature(true); // Secure by default
        }
    };

    const fetchProfile = async (userId: string) => {
        try {
            let { data, error } = await supabase
                .from('users')
                .select('id, name, email, role, school_id, assigned_schools, active, gee, avatar_url')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching user profile:', error);
            }

            if (!data && !error) {
                const { data: claimed, error: rpcError } = await supabase.rpc('claim_profile_by_email');

                if (rpcError) {
                    console.error('Error running claim_profile_by_email:', rpcError);
                }

                if (claimed) {
                    const { data: refreshed, error: refreshError } = await supabase
                        .from('users')
                        .select('id, name, email, role, school_id, assigned_schools, active, gee, avatar_url')
                        .eq('id', userId)
                        .single();
                    
                    if (refreshError) {
                        console.error('Error fetching claimed profile:', refreshError);
                    } else {
                        data = refreshed;
                    }
                }
            }

            if (data) {
                const userObj: User = {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    role: data.role as UserRole,
                    schoolId: data.school_id,
                    assignedSchools: data.assigned_schools,
                    active: data.active,
                    gee: data.gee,
                    avatar_url: data.avatar_url
                };
                setCurrentUser(userObj);
                await checkContractSignature(userObj.id, userObj.role);
            } else {
                setCurrentUser(null);
            }
        } catch (err) {
            console.error('Error in fetchProfile:', err);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
            await fetchProfile(data.session.user.id);
        }
    };

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setCurrentUser(null);
                setNeedsSignature(false);
                setLoading(false);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setNeedsSignature(false);
    };

    return (
        <AuthContext.Provider value={{ currentUser, loading, logout, refreshProfile, needsSignature, setNeedsSignature }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
