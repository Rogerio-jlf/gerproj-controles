// src/store/filtersStore.ts
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

// ==================== TIPOS ====================
interface FiltersState {
    ano: number;
    mes: number;
    cliente: string;
    recurso: string;
    status: string;
}

interface FiltersActions {
    setFilters: (filters: FiltersState) => void;
    clearFilters: () => void;

    // Setters individuais (opcional, para mais granularidade)
    setAno: (ano: number) => void;
    setMes: (mes: number) => void;
    setCliente: (cliente: string) => void;
    setRecurso: (recurso: string) => void;
    setStatus: (status: string) => void;
}

type FiltersStore = FiltersState & FiltersActions;

// ==================== HELPER ====================
const getDefaultFilters = (): FiltersState => {
    const hoje = new Date();
    return {
        ano: hoje.getFullYear(),
        mes: hoje.getMonth() + 1,
        cliente: '',
        recurso: '',
        status: '',
    };
};

// ==================== STORE ====================
export const useFiltersStore = create<FiltersStore>()(
    devtools(
        persist(
            (set) => ({
                // Estado inicial
                ...getDefaultFilters(),

                // ==================== AÇÕES ====================
                setFilters: (filters: FiltersState) => {
                    set(filters, false, 'setFilters');
                },

                clearFilters: () => {
                    set(getDefaultFilters(), false, 'clearFilters');
                },

                // Setters individuais (opcional)
                setAno: (ano: number) => {
                    set({ ano }, false, 'setAno');
                },

                setMes: (mes: number) => {
                    set({ mes }, false, 'setMes');
                },

                setCliente: (cliente: string) => {
                    set({ cliente }, false, 'setCliente');
                },

                setRecurso: (recurso: string) => {
                    set({ recurso }, false, 'setRecurso');
                },

                setStatus: (status: string) => {
                    set({ status }, false, 'setStatus');
                },
            }),
            {
                name: 'gerproj_filters', // Mesma chave do localStorage
                storage: createJSONStorage(() => localStorage),
            }
        ),
        {
            name: 'FiltersStore',
            enabled: process.env.NODE_ENV === 'development',
        }
    )
);

// ==================== HOOKS ESPECÍFICOS ====================
// Estes hooks permitem que componentes se inscrevam apenas nos dados que precisam

export const useAno = () => useFiltersStore((state) => state.ano);
export const useMes = () => useFiltersStore((state) => state.mes);
export const useCliente = () => useFiltersStore((state) => state.cliente);
export const useRecurso = () => useFiltersStore((state) => state.recurso);
export const useStatus = () => useFiltersStore((state) => state.status);

// Hooks de ações
export const useSetFilters = () => useFiltersStore((state) => state.setFilters);
export const useClearFilters = () => useFiltersStore((state) => state.clearFilters);
export const useSetAno = () => useFiltersStore((state) => state.setAno);
export const useSetMes = () => useFiltersStore((state) => state.setMes);
export const useSetCliente = () => useFiltersStore((state) => state.setCliente);
export const useSetRecurso = () => useFiltersStore((state) => state.setRecurso);
export const useSetStatus = () => useFiltersStore((state) => state.setStatus);

// ==================== HOOK COMPLETO (compatibilidade com o Context) ====================
// Este hook mantém a mesma interface do useFilters() original
export const useFilters = () => {
    const store = useFiltersStore();

    return {
        filters: {
            ano: store.ano,
            mes: store.mes,
            cliente: store.cliente,
            recurso: store.recurso,
            status: store.status,
        },
        setFilters: store.setFilters,
        clearFilters: store.clearFilters,
    };
};
