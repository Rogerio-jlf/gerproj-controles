'use client';

import { useFilters } from '@/context/FiltersContext';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { IoIosArrowDown } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';

// ================================================================================
// INTERFACES
// ================================================================================
interface DropdownFilterProps {
  value: string;
  onChange: (value: string) => void;
  columnId: 'NOME_CLIENTE' | 'NOME_RECURSO' | 'STATUS_CHAMADO';
}

interface OptionItem {
  cod: string;
  nome: string;
}

// ================================================================================
// FUNÇÕES DE FETCH
// ================================================================================
const createAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'x-is-logged-in': localStorage.getItem('isLoggedIn') || 'false',
  'x-is-admin': localStorage.getItem('isAdmin') || 'false',
  'x-user-email': localStorage.getItem('userEmail') || '',
  'x-cod-cliente': localStorage.getItem('codCliente') || '',
});

async function fetchClientes(params: {
  ano: number;
  mes: number;
  isAdmin: boolean;
  codCliente?: string;
}): Promise<OptionItem[]> {
  const queryParams = new URLSearchParams({
    ano: String(params.ano),
    mes: String(params.mes),
    isAdmin: String(params.isAdmin),
  });

  if (!params.isAdmin && params.codCliente) {
    queryParams.append('codCliente', params.codCliente);
  }

  const response = await fetch(
    `/api/clientes/chamados?${queryParams.toString()}`,
    {
      headers: createAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error('Erro ao carregar clientes');
  }

  return response.json();
}

async function fetchRecursos(params: {
  ano: number;
  mes: number;
  isAdmin: boolean;
  codCliente?: string;
  cliente?: string;
}): Promise<OptionItem[]> {
  const queryParams = new URLSearchParams({
    ano: String(params.ano),
    mes: String(params.mes),
    isAdmin: String(params.isAdmin),
  });

  if (!params.isAdmin && params.codCliente) {
    queryParams.append('codCliente', params.codCliente);
  }

  if (params.cliente) {
    queryParams.append('cliente', params.cliente);
  }

  const response = await fetch(
    `/api/recursos/chamados?${queryParams.toString()}`,
    {
      headers: createAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error('Erro ao carregar recursos');
  }

  return response.json();
}

async function fetchStatus(params: {
  ano: number;
  mes: number;
  isAdmin: boolean;
  codCliente?: string;
  cliente?: string;
}): Promise<OptionItem[]> {
  const queryParams = new URLSearchParams({
    ano: String(params.ano),
    mes: String(params.mes),
    isAdmin: String(params.isAdmin),
  });

  if (!params.isAdmin && params.codCliente) {
    queryParams.append('codCliente', params.codCliente);
  }

  if (params.cliente) {
    queryParams.append('cliente', params.cliente);
  }

  const response = await fetch(
    `/api/status/chamados?${queryParams.toString()}`,
    {
      headers: createAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error('Erro ao carregar status');
  }

  return response.json();
}

// ================================================================================
// FUNÇÕES AUXILIARES
// ================================================================================
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// ================================================================================
// COMPONENTE DROPDOWN COM FILTRO
// ================================================================================
const DropdownWithFilter = memo(
  ({ value, onChange, columnId }: DropdownFilterProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { filters } = useFilters();
    const { ano, mes, cliente } = filters;

    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const codCliente = localStorage.getItem('codCliente') || undefined;

    // Query para buscar dados APENAS DO PERÍODO FILTRADO
    const { data: options = [], isLoading } = useQuery({
      queryKey: [
        columnId === 'NOME_CLIENTE'
          ? 'clientes-periodo'
          : columnId === 'NOME_RECURSO'
            ? 'recursos-periodo'
            : 'status-periodo',
        ano,
        mes,
        isAdmin,
        codCliente,
        columnId === 'NOME_RECURSO' || columnId === 'STATUS_CHAMADO'
          ? cliente
          : undefined,
      ],
      queryFn: () => {
        // Só busca se tiver ano e mês definidos
        if (!ano || !mes) {
          return [];
        }

        if (columnId === 'NOME_CLIENTE') {
          return fetchClientes({
            ano,
            mes,
            isAdmin,
            codCliente,
          });
        } else if (columnId === 'NOME_RECURSO') {
          return fetchRecursos({
            ano,
            mes,
            isAdmin,
            codCliente,
            cliente: cliente ?? undefined,
          });
        } else {
          return fetchStatus({
            ano,
            mes,
            isAdmin,
            codCliente,
            cliente: cliente ?? undefined,
          });
        }
      },
      enabled: !!ano && !!mes, // Só busca quando tem período definido
      staleTime: 1000 * 60 * 5,
      refetchOnMount: true, // Recarrega ao montar se dados estiverem stale
    });

    // Filtrar opções baseado no termo de busca
    const filteredOptions = useMemo(() => {
      if (!searchTerm.trim()) {
        return options;
      }

      const normalizedSearch = normalizeText(searchTerm);
      return options.filter((option) =>
        normalizeText(option.nome).includes(normalizedSearch),
      );
    }, [options, searchTerm]);

    // Opção selecionada
    const selectedOption = useMemo(() => {
      return options.find((opt) => opt.nome === value);
    }, [options, value]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchTerm('');
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focar no input de busca quando abrir
    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }, [isOpen]);

    const handleSelect = useCallback(
      (nome: string) => {
        onChange(nome);
        setIsOpen(false);
        setSearchTerm('');
      },
      [onChange],
    );

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
        setSearchTerm('');
      },
      [onChange],
    );

    const handleToggle = useCallback(() => {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }, [isOpen]);

    const placeholder =
      columnId === 'NOME_CLIENTE'
        ? 'Todos'
        : columnId === 'NOME_RECURSO'
          ? 'Todos'
          : 'Todos';
    const emptyMessage =
      columnId === 'NOME_CLIENTE'
        ? 'Nenhum cliente encontrado'
        : columnId === 'NOME_RECURSO'
          ? 'Nenhum recurso encontrado'
          : 'Nenhum status encontrado';

    return (
      <div ref={dropdownRef} className="relative w-full">
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`group relative flex w-full cursor-pointer items-center justify-between rounded-md py-2 pr-3 pl-3 text-sm font-bold tracking-widest italic shadow-sm shadow-black transition-all hover:shadow-lg hover:shadow-black focus:ring-2 focus:ring-pink-600 focus:outline-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            value
              ? 'bg-white text-black ring-2 ring-pink-600'
              : 'border border-teal-950 bg-teal-900 text-white'
          }`}
        >
          <span className={`truncate ${!value ? 'opacity-50' : ''}`}>
            {isLoading ? 'Carregando...' : selectedOption?.nome || placeholder}
          </span>

          <div className="flex items-center gap-1 ml-2">
            {value && !isLoading && (
              <span
                onClick={handleClear}
                className="bg-slate-300 p-0.5 rounded-full hover:bg-red-500 cursor-pointer shadow-sm shadow-black"
                title="Limpar Filtro"
              >
                <IoClose
                  size={16}
                  className="text-black group-hover:text-white group-hover:rotate-180 transition-all"
                />
              </span>
            )}
            <span
              className={`transition-all ${isOpen ? 'rotate-180' : ''} ${
                value ? 'text-black' : 'text-white'
              }`}
            >
              <IoIosArrowDown size={18} />
            </span>
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-md bg-white shadow-lg shadow-black ring-1 ring-black">
            {/* Campo de busca interno */}
            <div className="p-2 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Lista de opções */}
            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300">
              {/* Opção "Todos" */}
              <button
                onClick={() => handleSelect('')}
                className={`w-full px-3 py-2 text-left text-sm font-semibold tracking-widest italic transition-all ${
                  value === ''
                    ? 'bg-blue-600 text-white'
                    : 'text-black hover:bg-black hover:text-white'
                }`}
              >
                {placeholder}
              </button>

              {/* Opções filtradas */}
              {isLoading ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500 italic">
                  Carregando opções...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500 italic">
                  {searchTerm ? 'Nenhum resultado encontrado' : emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.cod}
                    onClick={() => handleSelect(option.nome)}
                    className={`w-full px-3 py-2 text-left text-sm font-semibold tracking-widest italic transition-all ${
                      value === option.nome
                        ? 'bg-blue-600 text-white'
                        : 'text-black hover:bg-black hover:text-white'
                    }`}
                    title={option.nome}
                  >
                    <div className="truncate">{option.nome}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

DropdownWithFilter.displayName = 'DropdownWithFilter';

// ================================================================================
// COMPONENTE PRINCIPAL - WRAPPER ATUALIZADO
// ================================================================================
interface InputFilterProps {
  value: string;
  onChange: (value: string) => void;
  columnId?: string;
}

// Constante fora do componente para evitar recriação
const COLUMN_MAX_LENGTH: Record<string, number> = {
  COD_CHAMADO: 6,
  DATA_CHAMADO: 10,
  HORA_CHAMADO: 5,
  NOME_CLIENTE: 15,
  STATUS_CHAMADO: 15,
  NOME_RECURSO: 15,
  ASSUNTO_CHAMADO: 30,
  SOLICITACAO_CHAMADO: 40,
};

const InputFilterWithDebounce = memo(
  ({ value, onChange, columnId }: InputFilterProps) => {
    const [localValue, setLocalValue] = useState(value);
    const isUserTyping = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const maxLength = useMemo(
      () => (columnId ? COLUMN_MAX_LENGTH[columnId] : undefined),
      [columnId],
    );

    useEffect(() => {
      if (!isUserTyping.current && value !== localValue) {
        setLocalValue(value);
      }
    }, [value, localValue]);

    const debouncedOnChange = useMemo(
      () =>
        debounce((newValue: string) => {
          onChange(newValue);
          isUserTyping.current = false;
        }, 600),
      [onChange],
    );

    useEffect(() => {
      return () => {
        debouncedOnChange.cancel();
      };
    }, [debouncedOnChange]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        isUserTyping.current = true;
        let processedValue = e.target.value;

        if (maxLength && processedValue.length > maxLength) {
          processedValue = processedValue.slice(0, maxLength);
        }

        setLocalValue(processedValue);
        debouncedOnChange(processedValue);
      },
      [debouncedOnChange, maxLength],
    );

    const handleClear = useCallback(() => {
      isUserTyping.current = false;
      setLocalValue('');
      onChange('');
      debouncedOnChange.cancel();

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }, [onChange, debouncedOnChange]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClear();
        } else if (e.key === 'Enter') {
          debouncedOnChange.flush();
        }
      },
      [handleClear, debouncedOnChange],
    );

    return (
      <div className="group relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Filtrar..."
          className={`hover:bg-opacity-90 w-full rounded-md px-3 py-2 text-sm font-bold shadow-sm shadow-black transition-all select-none focus:ring-2 focus:ring-indigo-500 focus:outline-none active:scale-95 ${
            localValue
              ? 'bg-white text-black ring-2 ring-indigo-500'
              : 'border border-teal-950 bg-teal-900 text-white placeholder-white/50 hover:shadow-lg hover:shadow-black'
          }`}
        />

        {localValue && (
          <button
            onClick={handleClear}
            aria-label="Limpar filtro"
            title="Limpar Filtro"
            className="absolute top-1/2 right-3 -translate-y-1/2 bg-slate-300 p-0.5 rounded-full hover:bg-red-500 cursor-pointer shadow-sm shadow-black transition-all"
            type="button"
          >
            <IoClose
              size={16}
              className="text-black group-hover:text-white group-hover:rotate-180 transition-all"
            />
          </button>
        )}
      </div>
    );
  },
);

InputFilterWithDebounce.displayName = 'InputFilterWithDebounce';

export const FiltroHeaderChamados = memo(
  ({ value, onChange, columnId }: InputFilterProps) => {
    // Status, Cliente e Recurso usam dropdown com busca e API
    if (
      columnId === 'STATUS_CHAMADO' ||
      columnId === 'NOME_CLIENTE' ||
      columnId === 'NOME_RECURSO'
    ) {
      return (
        <DropdownWithFilter
          value={value}
          onChange={onChange}
          columnId={
            columnId as 'NOME_CLIENTE' | 'NOME_RECURSO' | 'STATUS_CHAMADO'
          }
        />
      );
    }

    // Outros campos usam input com debounce
    return (
      <InputFilterWithDebounce
        value={value}
        onChange={onChange}
        columnId={columnId}
      />
    );
  },
);

FiltroHeaderChamados.displayName = 'FiltroHeaderChamados';

// ================================================================================
// HOOK PERSONALIZADO PARA FUNÇÕES DE FILTRO
// ================================================================================

// Constantes fora do hook para evitar recriação
const DATE_COLUMNS = new Set(['DATA_CHAMADO']);
const NUMERIC_COLUMNS = new Set(['COD_CHAMADO']);
const TIME_COLUMNS = new Set(['HORA_CHAMADO']);

function normalizeTextForFilter(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const useFiltrosChamados = () => {
  const columnFilterFn = useCallback(
    (row: any, columnId: string, filterValue: string) => {
      if (!filterValue || filterValue.trim() === '') {
        return true;
      }

      const cellValue = row.getValue(columnId);
      const filterTrimmed = filterValue.trim();

      if (cellValue == null || cellValue === '') {
        return false;
      }

      const cellString = String(cellValue).trim();

      // Tratamento especial para status
      if (columnId === 'STATUS_CHAMADO') {
        const cellUpper = cellString.toUpperCase();
        const filterUpper = filterTrimmed.toUpperCase();
        return cellUpper === filterUpper;
      }

      // Tratamento especial para Cliente e Recurso (match exato)
      if (columnId === 'NOME_CLIENTE' || columnId === 'NOME_RECURSO') {
        return cellString === filterTrimmed;
      }

      // Tratamento especial para campos de data
      if (DATE_COLUMNS.has(columnId)) {
        const normalizedCell = cellString.replace(/\D/g, '');
        const normalizedFilter = filterTrimmed.replace(/\D/g, '');
        return normalizedCell.startsWith(normalizedFilter);
      }

      // Tratamento para campos numéricos
      if (NUMERIC_COLUMNS.has(columnId)) {
        const cellNumbers = cellString.replace(/\D/g, '');
        const filterNumbers = filterTrimmed.replace(/\D/g, '');
        return cellNumbers.includes(filterNumbers);
      }

      // Tratamento para campos de hora
      if (TIME_COLUMNS.has(columnId)) {
        const cellTime = cellString.replace(/:/g, '');
        const filterTime = filterTrimmed.replace(/:/g, '');
        return cellTime.includes(filterTime);
      }

      // Tratamento padrão para texto
      const normalizedCell = normalizeTextForFilter(cellString);
      const normalizedFilter = normalizeTextForFilter(filterTrimmed);

      return normalizedCell.includes(normalizedFilter);
    },
    [],
  );

  return { columnFilterFn };
};
