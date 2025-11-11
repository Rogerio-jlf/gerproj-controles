'use client';

import { createContext, useContext, useState } from 'react';

// Define a interface para o estado dos filtros
interface FiltersState {
  ano: number;
  mes: number;
  cliente: string;
  recurso: string;
  status: string;
}

// Define a interface para o contexto dos filtros
interface FiltersContextType {
  filters: FiltersState;
  setFilters: (filters: FiltersState) => void;
  clearFilters: () => void;
}

// Cria o contexto dos filtros, inicialmente indefinido
const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

// Função auxiliar para obter o estado inicial dos filtros (ano e mês atuais)
const getInitialFilters = (): FiltersState => {
  const hoje = new Date();
  return {
    ano: hoje.getFullYear(),
    mes: hoje.getMonth() + 1,
    cliente: '',
    recurso: '',
    status: '',
  };
};

// Componente provedor do contexto dos filtros
export function FiltersProvider({ children }: { children: React.ReactNode }) {
  // Estado dos filtros e função para atualizá-lo
  const [filters, setFilters] = useState<FiltersState>(getInitialFilters());

  // Função para limpar os filtros (voltar ao estado inicial)
  const clearFilters = () => setFilters(getInitialFilters());

  // Retorna o provedor do contexto, disponibilizando os valores e funções
  return (
    <FiltersContext.Provider value={{ filters, setFilters, clearFilters }}>
      {' '}
      {children}
    </FiltersContext.Provider>
  );
}

// Hook customizado para acessar o contexto dos filtros
export function useFilters() {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
}
