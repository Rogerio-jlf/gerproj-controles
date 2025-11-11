'use client';

import { debounce } from 'lodash';
import { useMemo, useState, useCallback, useEffect, useRef, memo } from 'react';
import { IoClose } from 'react-icons/io5';
import { IoIosArrowDown } from 'react-icons/io';

// ================================================================================
// INTERFACES
// ================================================================================
interface InputFilterProps {
  value: string;
  onChange: (value: string) => void;
  columnId?: string;
}

interface DropdownValidacaoProps {
  value: string;
  onChange: (value: string) => void;
}

// ================================================================================
// CONSTANTES
// ================================================================================
const DEBOUNCE_DELAY = 600;

// Limites de caracteres por coluna
const COLUMN_MAX_LENGTH: Record<string, number> = {
  chamado_os: 5,
  cod_os: 5,
  dtini_os: 2,
  nome_cliente: 20,
  status_chamado: 20,
  nome_recurso: 20,
  hrini_os: 2,
  hrfim_os: 2,
  total_horas: 2,
  obs: 20,
};

// Colunas de data
const DATE_COLUMNS = new Set(['dtini_os']);

// ================================================================================
// FUNÇÕES AUXILIARES
// ================================================================================

/**
 * Formata uma string de números para o formato DD/MM/YYYY
 */
function formatDateString(input: string): string {
  const numbersOnly = input.replace(/\D/g, '');

  if (numbersOnly.length === 0) return '';
  if (numbersOnly.length <= 2) return numbersOnly;
  if (numbersOnly.length <= 4) {
    return `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2)}`;
  }
  if (numbersOnly.length <= 8) {
    return `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2, 4)}/${numbersOnly.slice(4)}`;
  }

  return `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2, 4)}/${numbersOnly.slice(4, 8)}`;
}

/**
 * Normaliza uma data para comparação
 */
function normalizeDateForComparison(dateStr: string | null): string {
  if (!dateStr) return '';

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // Se falhar, continua
  }

  const datePart = dateStr.split(/[\sT]/)[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  }

  return datePart;
}

// ================================================================================
// COMPONENTE DROPDOWN VALIDAÇÃO
// ================================================================================
const DropdownValidacao = memo(({ value, onChange }: DropdownValidacaoProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { name: 'Aprovado', code: 'SIM' },
    { name: 'Recusado', code: 'NAO' },
  ];

  const selectedOption = options.find(opt => opt.code === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex w-full cursor-pointer items-center justify-between rounded-md py-2 pr-3 pl-3 text-sm font-bold tracking-widest italic shadow-sm shadow-black transition-all hover:shadow-lg hover:shadow-black focus:ring-2 focus:ring-pink-600 focus:outline-none active:scale-95 ${
          value
            ? 'bg-white text-black ring-2 ring-pink-600'
            : 'border border-teal-950 bg-teal-900 text-white'
        }`}
      >
        <span className={`truncate ${!value ? 'opacity-50' : ''}`}>
          {selectedOption ? selectedOption.name : 'Filtrar...'}
        </span>

        <div className="flex items-center gap-1 ml-2">
          {value && (
            <span
              onClick={handleClear}
              className="bg-slate-300 p-1 rounded-full hover:bg-red-500 cursor-pointer shadow-sm shadow-black"
              title="Limpar Filtro"
            >
            <IoClose size={18} className="text-black group-hover:text-white group-hover:rotate-180 transition-all" />
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
        <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-md bg-white shadow-lg shadow-black">
          {options.map(option => (
            <button
              key={option.code}
              onClick={() => handleSelect(option.code)}
              className={`w-full px-3 py-2 text-left text-sm font-semibold tracking-widest italic transition-all ${
                value === option.code
                  ? 'bg-blue-600 text-white'
                  : 'text-black hover:bg-black hover:text-white'
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

DropdownValidacao.displayName = 'DropdownValidacao';

// ================================================================================
// COMPONENTE INPUT FILTRO COM DEBOUNCE
// ================================================================================
const InputFilterWithDebounce = memo(({ value, onChange, columnId }: InputFilterProps) => {
  const [localValue, setLocalValue] = useState(value);
  const isUserTyping = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxLength = useMemo(
    () => (columnId ? COLUMN_MAX_LENGTH[columnId] : undefined),
    [columnId]
  );

  const isDateColumn = useMemo(
    () => (columnId ? DATE_COLUMNS.has(columnId) : false),
    [columnId]
  );

  useEffect(() => {
    if (!isUserTyping.current) {
      setLocalValue(value);
    }
  }, [value]);

  const debouncedOnChange = useMemo(
    () =>
      debounce((newValue: string) => {
        onChange(newValue.trim());
        requestAnimationFrame(() => {
          isUserTyping.current = false;
        });
      }, DEBOUNCE_DELAY),
    [onChange]
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      isUserTyping.current = true;
      const inputValue = e.target.value;

      if (maxLength && inputValue.length > maxLength) return;

      let processedValue = inputValue;

      if (isDateColumn) {
        const numbersOnly = inputValue.replace(/[^\d]/g, '');
        processedValue = formatDateString(numbersOnly).slice(0, 10);
      }

      setLocalValue(processedValue);
      debouncedOnChange(processedValue);
    },
    [debouncedOnChange, maxLength, isDateColumn]
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
      if (e.key === 'Escape' && localValue) {
        e.preventDefault();
        handleClear();
      }
    },
    [localValue, handleClear]
  );

  return (
    <div className="group relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        placeholder="Filtrar..."
        className={`hover:bg-opacity-90 w-full rounded-md px-3 py-2 text-sm font-bold shadow-sm shadow-black transition-all select-none focus:ring-2 focus:ring-purple-500 focus:outline-none active:scale-95 ${
          localValue
            ? 'bg-white text-black ring-2 ring-purple-500'
            : 'border border-teal-950 bg-teal-900 text-white placeholder-white/50 hover:shadow-lg hover:shadow-black'
        }`}
      />

      {localValue && (
        <button
          onClick={handleClear}
          aria-label="Limpar filtro"
          title="Limpar Filtro"
          className="absolute top-1/2 right-3 -translate-y-1/2 bg-slate-300 p-1 rounded-full hover:bg-red-500 cursor-pointer shadow-sm shadow-black"
          type="button"
        >
            <IoClose size={18} className="text-black group-hover:text-white group-hover:rotate-180 transition-all" />
        </button>
      )}
    </div>
  );
});

InputFilterWithDebounce.displayName = 'InputFilterWithDebounce';

// ================================================================================
// COMPONENTE PRINCIPAL - WRAPPER
// ================================================================================
export const FiltroHeaderChamados = memo(({ value, onChange, columnId }: InputFilterProps) => {
  if (columnId === 'valcli_os') {
    return <DropdownValidacao value={value} onChange={onChange} />;
  }

  return <InputFilterWithDebounce value={value} onChange={onChange} columnId={columnId} />;
});

FiltroHeaderChamados.displayName = 'FiltroHeaderChamados';

// ================================================================================
// HOOK PERSONALIZADO PARA FUNÇÕES DE FILTRO
// ================================================================================
export const useFiltrosChamados = () => {
  const columnFilterFn = useCallback((row: any, columnId: string, filterValue: string) => {
    if (!filterValue) return true;

    const cellValue = String(row.getValue(columnId) || '');
    const filterTrimmed = String(filterValue).trim();

    if (!filterTrimmed) return true;

    // Tratamento especial para validação
    if (columnId === 'valcli_os') {
      const cellUpper = cellValue.toUpperCase().trim();
      const filterUpper = filterTrimmed.toUpperCase();
      return cellUpper === filterUpper;
    }

    // Tratamento especial para campos de data
    if (DATE_COLUMNS.has(columnId)) {
      const normalizedDate = normalizeDateForComparison(cellValue);
      const filterLower = filterTrimmed.toLowerCase();
      return normalizedDate.toLowerCase().includes(filterLower);
    }

    // Tratamento padrão para texto
    const cellLower = cellValue.toLowerCase();
    const filterLower = filterTrimmed.toLowerCase();
    return cellLower.includes(filterLower);
  }, []);

  return { columnFilterFn };
};