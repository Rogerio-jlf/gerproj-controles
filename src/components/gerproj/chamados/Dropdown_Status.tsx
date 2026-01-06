// src/components/chamados/Dropdown_Status.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MdExpandMore } from 'react-icons/md';

// ==================== TIPOS ====================
interface DropdownStatusProps {
    statusAtual: string;
    onChangeStatus: (novoStatus: string) => void;
    disabled?: boolean;
}

const STATUS_OPTIONS = [
    { value: 'STANDBY', label: 'STANDBY', color: 'bg-orange-500 hover:bg-orange-600' },
    {
        value: 'EM ATENDIMENTO',
        label: 'EM ATENDIMENTO',
        color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
        value: 'AGUARDANDO VALIDACAO',
        label: 'AGUARDANDO VALIDAÇÃO',
        color: 'bg-yellow-500 hover:bg-yellow-600',
    },
    { value: 'FINALIZADO', label: 'FINALIZADO', color: 'bg-green-600 hover:bg-green-700' },
] as const;

// Função para obter as classes de estilo com base no status
const getStatusStyles = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'NAO FINALIZADO':
            return 'bg-red-600 border-red-800';
        case 'EM ATENDIMENTO':
            return 'bg-blue-600 border-blue-800';
        case 'FINALIZADO':
            return 'bg-green-600 border-green-800';
        case 'NAO INICIADO':
            return 'bg-red-500 border-red-700';
        case 'STANDBY':
            return 'bg-orange-500 border-orange-700';
        case 'ATRIBUIDO':
            return 'bg-cyan-500 border-cyan-700';
        case 'AGUARDANDO VALIDACAO':
            return 'bg-yellow-500 border-yellow-700';
        default:
            return 'bg-gray-600 border-gray-800';
    }
};

// ==================== COMPONENTE PRINCIPAL ====================
export function DropdownStatus({
    statusAtual,
    onChangeStatus,
    disabled = false,
}: DropdownStatusProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleSelect = (e: React.MouseEvent, novoStatus: string) => {
        e.stopPropagation();

        // Se o status for diferente do atual, chama o callback
        if (novoStatus !== statusAtual) {
            onChangeStatus(novoStatus);
        }

        setIsOpen(false);
    };

    // ✅ NOVO: Filtra opções baseado no status atual
    const getFilteredOptions = () => {
        // Se status for ATRIBUIDO, mostra apenas EM ATENDIMENTO
        if (statusAtual.toUpperCase() === 'ATRIBUIDO') {
            return STATUS_OPTIONS.filter((opt) => opt.value === 'EM ATENDIMENTO');
        }
        // Caso contrário, mostra todas as opções
        return STATUS_OPTIONS;
    };

    const filteredOptions = getFilteredOptions();

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Botão Principal */}
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`group relative w-full rounded-md border px-3 py-1 text-sm font-bold tracking-widest text-white shadow-sm shadow-black transition-all ${getStatusStyles(
                    statusAtual
                )} ${
                    disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:scale-[1.02] active:scale-95'
                }`}
            >
                <div className="flex items-center justify-between gap-2">
                    <span className="flex-1 text-center">{statusAtual.toUpperCase()}</span>
                    <MdExpandMore
                        size={20}
                        className={`flex-shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-gray-300 bg-white shadow-xl shadow-black">
                    {filteredOptions.map((option) => {
                        const isCurrentStatus = option.value === statusAtual;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={(e) => handleSelect(e, option.value)}
                                disabled={isCurrentStatus}
                                className={`w-full border-b border-gray-200 bg-white px-4 py-3 text-left text-sm font-bold tracking-widest text-black transition-all last:border-b-0 ${
                                    isCurrentStatus
                                        ? 'cursor-not-allowed opacity-60'
                                        : 'cursor-pointer hover:scale-[1.02] hover:bg-gray-100'
                                }`}
                            >
                                {option.label}
                                {isCurrentStatus && (
                                    <span className="ml-2 text-xs font-semibold text-gray-600">
                                        (atual)
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
