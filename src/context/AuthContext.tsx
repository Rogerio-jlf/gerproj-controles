'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

type UserData = {
  isAdmin: boolean;
  codCliente: string | null;
  codRecurso: string | null;
  nomeRecurso: string | null;
};

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  codCliente: string | null;
  codRecurso: string | null;
  nomeRecurso: string | null;
  login: (email: string, password: string) => Promise<UserData | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [codCliente, setCodCliente] = useState<string | null>(null);
  const [codRecurso, setCodRecurso] = useState<string | null>(null);
  const [nomeRecurso, setNomeRecurso] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      const storedCodCliente = localStorage.getItem('codCliente');
      const storedCodRecurso = localStorage.getItem('codRecOS');
      const storedNomeRecurso = localStorage.getItem('nomeRecurso');

      setIsLoggedIn(storedLoggedIn);
      setIsAdmin(storedIsAdmin);
      setCodCliente(storedCodCliente || null);
      setCodRecurso(storedCodRecurso || null);
      setNomeRecurso(storedNomeRecurso || null);
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<UserData | null> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userData: UserData = {
          isAdmin: data.isAdmin ?? false,
          codCliente: data.codCliente ?? null,
          codRecurso: data.codRecOS ?? null,
          nomeRecurso: data.nomeRecurso ?? null,
        };

        setIsLoggedIn(true);
        setIsAdmin(userData.isAdmin);
        setCodCliente(userData.codCliente);
        setCodRecurso(userData.codRecurso);
        setNomeRecurso(userData.nomeRecurso);

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isAdmin', String(userData.isAdmin));
        localStorage.setItem('codCliente', userData.codCliente ?? '');
        localStorage.setItem('codRecOS', userData.codRecurso ?? '');
        localStorage.setItem('nomeRecurso', userData.nomeRecurso ?? '');

        return userData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return null;
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCodCliente(null);
    setCodRecurso(null);
    setNomeRecurso(null);

    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('codCliente');
    localStorage.removeItem('codRecOS');
    localStorage.removeItem('nomeRecurso');
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        isAdmin,
        codCliente,
        codRecurso,
        nomeRecurso,
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
