// src/store/authStore.ts - ATUALIZADO
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

// ==================== TIPOS ====================
type UserDataCliente = {
    loginType: 'cliente';
    isAdmin: boolean;
    codCliente: string | null;
    codRecurso: string | null;
    nomeRecurso: string | null;
};

type UserDataConsultor = {
    loginType: 'consultor';
    isAdmin: boolean;
    codUsuario: number;
    nomeUsuario: string;
    idUsuario: string;
    tipoUsuario: 'USU' | 'ADM';
    codRecurso: string | null; // ✅ NOVO: Código do recurso do consultor
    permissoes: {
        permtar: boolean;
        perproj1: boolean;
        perproj2: boolean;
    };
};

type UserData = UserDataCliente | UserDataConsultor;

type AuthState = {
    // Estado de autenticação
    isLoggedIn: boolean;
    isLoading: boolean;
    error: string | null;

    // Dados do usuário
    user: UserData | null;

    // Computed values (derivados)
    isAdmin: boolean;
    loginType: 'cliente' | 'consultor' | null;

    // Dados de Cliente (null se for consultor)
    codCliente: string | null;

    // ✅ MODIFICADO: codRecurso agora é compartilhado entre cliente e consultor
    codRecurso: string | null;
    nomeRecurso: string | null;

    // Dados de Consultor (null se for cliente)
    codUsuario: number | null;
    nomeUsuario: string | null;
    idUsuario: string | null;
    tipoUsuario: 'USU' | 'ADM' | null;
    permissoes: {
        permtar: boolean;
        perproj1: boolean;
        perproj2: boolean;
    } | null;
};

type AuthActions = {
    // Ações
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    setError: (error: string | null) => void;
    clearError: () => void;

    // Helpers
    isConsultor: () => boolean;
    isCliente: () => boolean;
    getUserName: () => string | null;
    hasPermission: (permission: 'permtar' | 'perproj1' | 'perproj2') => boolean;
};

type AuthStore = AuthState & AuthActions;

// ==================== HELPERS ====================
function computeStateFromUser(user: UserData | null): Partial<AuthState> {
    if (!user) {
        return {
            isAdmin: false,
            loginType: null,
            codCliente: null,
            codRecurso: null,
            nomeRecurso: null,
            codUsuario: null,
            nomeUsuario: null,
            idUsuario: null,
            tipoUsuario: null,
            permissoes: null,
        };
    }

    if (user.loginType === 'consultor') {
        return {
            isAdmin: user.isAdmin,
            loginType: 'consultor',
            codCliente: null,
            codRecurso: user.codRecurso, // ✅ NOVO: Pega do consultor
            nomeRecurso: user.nomeUsuario, // Usa o nome do usuário como nome do recurso
            codUsuario: user.codUsuario,
            nomeUsuario: user.nomeUsuario,
            idUsuario: user.idUsuario,
            tipoUsuario: user.tipoUsuario,
            permissoes: user.permissoes,
        };
    } else {
        return {
            isAdmin: user.isAdmin,
            loginType: 'cliente',
            codCliente: user.codCliente,
            codRecurso: user.codRecurso,
            nomeRecurso: user.nomeRecurso,
            codUsuario: null,
            nomeUsuario: null,
            idUsuario: null,
            tipoUsuario: null,
            permissoes: null,
        };
    }
}

// ==================== API DE LOGIN ====================
async function loginApi(email: string, password: string): Promise<UserData> {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginType: 'auto' }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Falha ao fazer login');
    }

    if (data.loginType === 'consultor') {
        return {
            loginType: 'consultor',
            isAdmin: data.isAdmin ?? false,
            codUsuario: data.codUsuario,
            nomeUsuario: data.nomeUsuario,
            idUsuario: data.idUsuario,
            tipoUsuario: data.tipoUsuario,
            codRecurso: data.codRecurso ?? null, // ✅ NOVO: Pega codRecurso da API
            permissoes: data.permissoes,
        };
    } else {
        return {
            loginType: 'cliente',
            isAdmin: data.isAdmin ?? false,
            codCliente: data.codCliente ?? null,
            codRecurso: data.codRecOS ?? null,
            nomeRecurso: data.nomeRecurso ?? null,
        };
    }
}

// ==================== STORE ====================
export const useAuthStore = create<AuthStore>()(
    devtools(
        persist(
            (set, get) => ({
                // Estado inicial
                isLoggedIn: false,
                isLoading: false,
                error: null,
                user: null,
                isAdmin: false,
                loginType: null,
                codCliente: null,
                codRecurso: null,
                nomeRecurso: null,
                codUsuario: null,
                nomeUsuario: null,
                idUsuario: null,
                tipoUsuario: null,
                permissoes: null,

                // ==================== AÇÕES ====================
                login: async (email: string, password: string) => {
                    set({ isLoading: true, error: null });

                    try {
                        const userData = await loginApi(email, password);
                        const computedState = computeStateFromUser(userData);

                        set({
                            isLoggedIn: true,
                            isLoading: false,
                            user: userData,
                            error: null,
                            ...computedState,
                        });

                        return true;
                    } catch (error) {
                        const errorMessage =
                            error instanceof Error ? error.message : 'Erro ao fazer login';

                        set({
                            isLoading: false,
                            error: errorMessage,
                        });

                        console.error('[AuthStore] Erro no login:', error);
                        return false;
                    }
                },

                logout: () => {
                    set({
                        isLoggedIn: false,
                        isLoading: false,
                        error: null,
                        user: null,
                        isAdmin: false,
                        loginType: null,
                        codCliente: null,
                        codRecurso: null,
                        nomeRecurso: null,
                        codUsuario: null,
                        nomeUsuario: null,
                        idUsuario: null,
                        tipoUsuario: null,
                        permissoes: null,
                    });
                },

                setError: (error: string | null) => {
                    set({ error });
                },

                clearError: () => {
                    set({ error: null });
                },

                // ==================== HELPERS ====================
                isConsultor: () => {
                    return get().loginType === 'consultor';
                },

                isCliente: () => {
                    return get().loginType === 'cliente';
                },

                getUserName: () => {
                    const state = get();
                    if (state.loginType === 'consultor') {
                        return state.nomeUsuario;
                    } else if (state.loginType === 'cliente') {
                        return state.nomeRecurso;
                    }
                    return null;
                },

                hasPermission: (permission: 'permtar' | 'perproj1' | 'perproj2') => {
                    const state = get();
                    if (state.loginType !== 'consultor' || !state.permissoes) {
                        return false;
                    }
                    return state.permissoes[permission];
                },
            }),
            {
                name: 'auth-storage',
                storage: createJSONStorage(() => localStorage),
                partialize: (state) => ({
                    isLoggedIn: state.isLoggedIn,
                    user: state.user,
                }),
                onRehydrateStorage: () => (state) => {
                    if (state && state.user) {
                        const computed = computeStateFromUser(state.user);
                        Object.assign(state, computed);
                    }
                },
            }
        ),
        {
            name: 'AuthStore',
            enabled: process.env.NODE_ENV === 'development',
        }
    )
);

// ==================== HOOKS ESPECÍFICOS ====================
export const useIsLoggedIn = () => useAuthStore((state) => state.isLoggedIn);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsAdmin = () => useAuthStore((state) => state.isAdmin);
export const useLoginType = () => useAuthStore((state) => state.loginType);

// ✅ NOVO: Hook para pegar codRecurso (funciona para cliente e consultor)
export const useCodRecurso = () => useAuthStore((state) => state.codRecurso);

// Cliente - usando useShallow
export const useClienteData = () =>
    useAuthStore(
        useShallow((state) => ({
            codCliente: state.codCliente,
            codRecurso: state.codRecurso,
            nomeRecurso: state.nomeRecurso,
            isAdmin: state.isAdmin,
        }))
    );

// Consultor - usando useShallow
export const useConsultorData = () =>
    useAuthStore(
        useShallow((state) => ({
            codUsuario: state.codUsuario,
            nomeUsuario: state.nomeUsuario,
            idUsuario: state.idUsuario,
            tipoUsuario: state.tipoUsuario,
            codRecurso: state.codRecurso, // ✅ NOVO
            permissoes: state.permissoes,
            isAdmin: state.isAdmin,
        }))
    );

// Ações
export const useLogin = () => useAuthStore((state) => state.login);
export const useLogout = () => useAuthStore((state) => state.logout);

// Helpers
export const useIsConsultor = () => useAuthStore((state) => state.isConsultor());
export const useIsCliente = () => useAuthStore((state) => state.isCliente());
export const useUserName = () => useAuthStore((state) => state.getUserName());
export const useHasPermission = () => useAuthStore((state) => state.hasPermission);

// ==================== HOOK COMPLETO ====================
export const useAuth = () => {
    const store = useAuthStore();

    return {
        // Estado
        isLoggedIn: store.isLoggedIn,
        isLoading: store.isLoading,
        error: store.error,
        isAdmin: store.isAdmin,
        loginType: store.loginType,

        // Dados
        codCliente: store.codCliente,
        codRecurso: store.codRecurso,
        nomeRecurso: store.nomeRecurso,
        codUsuario: store.codUsuario,
        nomeUsuario: store.nomeUsuario,
        idUsuario: store.idUsuario,
        tipoUsuario: store.tipoUsuario,
        permissoes: store.permissoes,

        // Ações
        login: store.login,
        logout: store.logout,
        setError: store.setError,
        clearError: store.clearError,

        // Helpers
        isConsultor: store.isConsultor,
        isCliente: store.isCliente,
        getUserName: store.getUserName,
        hasPermission: store.hasPermission,
    };
};
