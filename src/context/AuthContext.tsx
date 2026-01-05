// src/context/AuthContext.tsx
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

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
    permissoes: {
        permtar: boolean;
        perproj1: boolean;
        perproj2: boolean;
    };
};

type UserData = UserDataCliente | UserDataConsultor;

type AuthContextType = {
    isLoggedIn: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    loginType: 'cliente' | 'consultor' | null;

    // Dados de Cliente
    codCliente: string | null;
    codRecurso: string | null;
    nomeRecurso: string | null;

    // Dados de Consultor
    codUsuario: number | null;
    nomeUsuario: string | null;
    idUsuario: string | null;
    tipoUsuario: 'USU' | 'ADM' | null;
    permissoes: {
        permtar: boolean;
        perproj1: boolean;
        perproj2: boolean;
    } | null;

    login: (email: string, password: string) => Promise<UserData | null>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para buscar dados do localStorage
const getStoredAuthData = (): (UserData & { isLoggedIn: boolean }) | { isLoggedIn: false } => {
    if (typeof window === 'undefined') {
        return { isLoggedIn: false };
    }

    try {
        const storedLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!storedLoggedIn) {
            return { isLoggedIn: false };
        }

        const loginType = localStorage.getItem('loginType') as 'cliente' | 'consultor' | null;

        if (loginType === 'consultor') {
            const codUsuario = localStorage.getItem('codUsuario');
            const nomeUsuario = localStorage.getItem('nomeUsuario');
            const idUsuario = localStorage.getItem('idUsuario');
            const tipoUsuario = localStorage.getItem('tipoUsuario') as 'USU' | 'ADM';
            const permtar = localStorage.getItem('permtar') === 'true';
            const perproj1 = localStorage.getItem('perproj1') === 'true';
            const perproj2 = localStorage.getItem('perproj2') === 'true';

            return {
                isLoggedIn: true,
                loginType: 'consultor',
                isAdmin: tipoUsuario === 'ADM',
                codUsuario: codUsuario ? parseInt(codUsuario) : 0,
                nomeUsuario: nomeUsuario || '',
                idUsuario: idUsuario || '',
                tipoUsuario: tipoUsuario,
                permissoes: {
                    permtar,
                    perproj1,
                    perproj2,
                },
            };
        } else {
            // Cliente
            const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
            const storedCodCliente = localStorage.getItem('codCliente');
            const storedCodRecurso = localStorage.getItem('codRecOS');
            const storedNomeRecurso = localStorage.getItem('nomeRecurso');

            return {
                isLoggedIn: true,
                loginType: 'cliente',
                isAdmin: storedIsAdmin,
                codCliente: storedCodCliente || null,
                codRecurso: storedCodRecurso || null,
                nomeRecurso: storedNomeRecurso || null,
            };
        }
    } catch (error) {
        console.error('Erro ao carregar dados do localStorage:', error);
        return { isLoggedIn: false };
    }
};

// Função para fazer login na API
const loginApi = async ({
    email,
    password,
}: {
    email: string;
    password: string;
}): Promise<UserData> => {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginType: 'auto' }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Falha ao fazer login');
    }

    // Salvar no localStorage baseado no tipo de login
    if (data.loginType === 'consultor') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginType', 'consultor');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('codUsuario', String(data.codUsuario));
        localStorage.setItem('nomeUsuario', data.nomeUsuario);
        localStorage.setItem('idUsuario', data.idUsuario);
        localStorage.setItem('tipoUsuario', data.tipoUsuario);
        localStorage.setItem('permtar', String(data.permissoes.permtar));
        localStorage.setItem('perproj1', String(data.permissoes.perproj1));
        localStorage.setItem('perproj2', String(data.permissoes.perproj2));

        return {
            loginType: 'consultor',
            isAdmin: data.isAdmin ?? false,
            codUsuario: data.codUsuario,
            nomeUsuario: data.nomeUsuario,
            idUsuario: data.idUsuario,
            tipoUsuario: data.tipoUsuario,
            permissoes: data.permissoes,
        };
    } else {
        // Cliente
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginType', 'cliente');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isAdmin', String(data.isAdmin ?? false));
        localStorage.setItem('codCliente', data.codCliente ?? '');
        localStorage.setItem('codRecOS', data.codRecOS ?? '');
        localStorage.setItem('nomeRecurso', data.nomeRecurso ?? '');

        return {
            loginType: 'cliente',
            isAdmin: data.isAdmin ?? false,
            codCliente: data.codCliente ?? null,
            codRecurso: data.codRecOS ?? null,
            nomeRecurso: data.nomeRecurso ?? null,
        };
    }
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const [isHydrated, setIsHydrated] = useState(false);

    // Estados locais
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loginType, setLoginType] = useState<'cliente' | 'consultor' | null>(null);

    // Estados de Cliente
    const [codCliente, setCodCliente] = useState<string | null>(null);
    const [codRecurso, setCodRecurso] = useState<string | null>(null);
    const [nomeRecurso, setNomeRecurso] = useState<string | null>(null);

    // Estados de Consultor
    const [codUsuario, setCodUsuario] = useState<number | null>(null);
    const [nomeUsuario, setNomeUsuario] = useState<string | null>(null);
    const [idUsuario, setIdUsuario] = useState<string | null>(null);
    const [tipoUsuario, setTipoUsuario] = useState<'USU' | 'ADM' | null>(null);
    const [permissoes, setPermissoes] = useState<{
        permtar: boolean;
        perproj1: boolean;
        perproj2: boolean;
    } | null>(null);

    // Carrega dados do localStorage
    useEffect(() => {
        const storedData = getStoredAuthData();

        if ('isLoggedIn' in storedData && storedData.isLoggedIn) {
            setIsLoggedIn(true);

            if (storedData.loginType === 'consultor') {
                setLoginType('consultor');
                setIsAdmin(storedData.isAdmin);
                setCodUsuario(storedData.codUsuario);
                setNomeUsuario(storedData.nomeUsuario);
                setIdUsuario(storedData.idUsuario);
                setTipoUsuario(storedData.tipoUsuario);
                setPermissoes(storedData.permissoes);
            } else {
                setLoginType('cliente');
                setIsAdmin(storedData.isAdmin);
                setCodCliente(storedData.codCliente);
                setCodRecurso(storedData.codRecurso);
                setNomeRecurso(storedData.nomeRecurso);
            }
        }

        setIsHydrated(true);
    }, []);

    // Query para manter dados em cache
    const { isLoading } = useQuery({
        queryKey: ['auth', 'stored'],
        queryFn: getStoredAuthData,
        enabled: isHydrated,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    // Mutation para login
    const loginMutation = useMutation({
        mutationFn: loginApi,
        onSuccess: (userData) => {
            queryClient.setQueryData(['auth', 'stored'], {
                isLoggedIn: true,
                ...userData,
            });

            setIsLoggedIn(true);
            setLoginType(userData.loginType);
            setIsAdmin(userData.isAdmin);

            if (userData.loginType === 'consultor') {
                setCodUsuario(userData.codUsuario);
                setNomeUsuario(userData.nomeUsuario);
                setIdUsuario(userData.idUsuario);
                setTipoUsuario(userData.tipoUsuario);
                setPermissoes(userData.permissoes);
            } else {
                setCodCliente(userData.codCliente);
                setCodRecurso(userData.codRecurso);
                setNomeRecurso(userData.nomeRecurso);
            }
        },
        onError: (error) => {
            console.error('Erro ao fazer login:', error);
        },
    });

    const login = async (email: string, password: string): Promise<UserData | null> => {
        try {
            const userData = await loginMutation.mutateAsync({ email, password });
            return userData;
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return null;
        }
    };

    const logout = () => {
        // Limpar estados
        setIsLoggedIn(false);
        setIsAdmin(false);
        setLoginType(null);
        setCodCliente(null);
        setCodRecurso(null);
        setNomeRecurso(null);
        setCodUsuario(null);
        setNomeUsuario(null);
        setIdUsuario(null);
        setTipoUsuario(null);
        setPermissoes(null);

        // Limpar localStorage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loginType');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('codCliente');
        localStorage.removeItem('codRecOS');
        localStorage.removeItem('nomeRecurso');
        localStorage.removeItem('codUsuario');
        localStorage.removeItem('nomeUsuario');
        localStorage.removeItem('idUsuario');
        localStorage.removeItem('tipoUsuario');
        localStorage.removeItem('permtar');
        localStorage.removeItem('perproj1');
        localStorage.removeItem('perproj2');

        queryClient.setQueryData(['auth', 'stored'], { isLoggedIn: false });
        queryClient.invalidateQueries({ queryKey: ['auth'] });
    };

    return (
        <AuthContext.Provider
            value={{
                isLoggedIn,
                isLoading: !isHydrated || isLoading,
                isAdmin,
                loginType,
                codCliente,
                codRecurso,
                nomeRecurso,
                codUsuario,
                nomeUsuario,
                idUsuario,
                tipoUsuario,
                permissoes,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}
