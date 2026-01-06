// src/components/chamados/Modal_Mudar_Status_Chamado.tsx
'use client';

import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { IoClose, IoSave } from 'react-icons/io5';
import { MdWarning } from 'react-icons/md';

// ==================== TIPOS ====================
interface ModalMudarStatusChamadoProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    codChamado: number;
    statusAtual: string;
    novoStatus: string;
}

interface MudarStatusPayload {
    codChamado: number;
    novoStatus: string;
    descricao: string;
    hrInicio: string;
    hrFim: string;
    data: string;
}

// ==================== FUNÇÃO DE MUDANÇA DE STATUS ====================
const mudarStatusChamado = async (payload: MudarStatusPayload): Promise<void> => {
    const response = await fetch('/api/chamados/mudar-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao mudar status do chamado');
    }

    return response.json();
};

// ==================== COMPONENTE PRINCIPAL ====================
export function ModalMudarStatusChamado({
    isOpen,
    onClose,
    onSave,
    codChamado,
    statusAtual,
    novoStatus,
}: ModalMudarStatusChamadoProps) {
    const [descricao, setDescricao] = useState('');
    const [hrInicio, setHrInicio] = useState('');
    const [hrFim, setHrFim] = useState('');
    const [data, setData] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const hoje = new Date().toISOString().split('T')[0];

    // Resetar campos quando o modal abre
    useEffect(() => {
        if (isOpen) {
            setDescricao('');
            setHrInicio('');
            setHrFim('');
            setData(hoje);
            setErrors({});
        }
    }, [isOpen, hoje]);

    const mutation = useMutation({
        mutationFn: mudarStatusChamado,
        onSuccess: () => {
            onSave();
            onClose();
        },
        onError: (error: Error) => {
            setErrors({ submit: error.message });
        },
    });

    // ==================== VALIDAÇÕES ====================
    const validarCampos = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!descricao.trim()) {
            newErrors.descricao = 'Descrição é obrigatória';
        }

        if (!hrInicio.trim()) {
            newErrors.hrInicio = 'Hora de início é obrigatória';
        } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hrInicio)) {
            newErrors.hrInicio = 'Formato inválido (HH:MM)';
        }

        if (!hrFim.trim()) {
            newErrors.hrFim = 'Hora de fim é obrigatória';
        } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hrFim)) {
            newErrors.hrFim = 'Formato inválido (HH:MM)';
        }

        // Validar que hrFim é maior que hrInicio
        if (hrInicio && hrFim && hrInicio >= hrFim) {
            newErrors.hrFim = 'Hora de fim deve ser maior que hora de início';
        }

        if (!data) {
            newErrors.data = 'Data é obrigatória';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ==================== HANDLERS ====================
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validarCampos()) {
            return;
        }

        mutation.mutate({
            codChamado,
            novoStatus,
            descricao,
            hrInicio,
            hrFim,
            data,
        });
    };

    const handleClose = () => {
        if (!mutation.isPending) {
            onClose();
        }
    };

    const handleHrInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length >= 2) {
            value = value.slice(0, 2) + ':' + value.slice(2, 4);
        }

        setHrInicio(value);
    };

    const handleHrFimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length >= 2) {
            value = value.slice(0, 2) + ':' + value.slice(2, 4);
        }

        setHrFim(value);
    };

    // ==================== RENDER ====================
    if (!isOpen) return null;

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'STANDBY':
                return 'text-orange-600';
            case 'AGUARDANDO VALIDACAO':
                return 'text-yellow-600';
            case 'FINALIZADO':
                return 'text-green-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-300 bg-purple-900 p-6">
                    <div className="flex items-center gap-3">
                        <MdWarning className="text-yellow-400" size={32} />
                        <h2 className="text-2xl font-extrabold tracking-widest text-white select-none">
                            MUDAR STATUS DO CHAMADO
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={mutation.isPending}
                        className="group cursor-pointer rounded-full bg-red-600 p-2 text-white transition-all hover:scale-110 hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Fechar"
                    >
                        <IoClose size={24} className="transition-all group-hover:scale-110" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Informações do Chamado */}
                    <div className="mb-6 rounded-lg bg-gray-100 p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm font-semibold text-gray-600">
                                    Chamado:
                                </span>
                                <span className="ml-2 text-base font-bold text-black">
                                    #{codChamado}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-600">
                                    Status Atual:
                                </span>
                                <span className="ml-2 text-base font-bold text-blue-600">
                                    {statusAtual}
                                </span>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-sm font-semibold text-gray-600">
                                Novo Status:
                            </span>
                            <span
                                className={`ml-2 text-base font-bold ${getStatusColor(novoStatus)}`}
                            >
                                {novoStatus}
                            </span>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-bold text-gray-700">
                            Descrição <span className="text-red-600">*</span>
                        </label>
                        <textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            disabled={mutation.isPending}
                            className={`w-full rounded-md border p-3 text-base font-semibold shadow-sm focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${
                                errors.descricao ? 'border-red-500' : 'border-gray-300'
                            }`}
                            rows={4}
                            placeholder="Descreva o motivo da mudança de status..."
                        />
                        {errors.descricao && (
                            <p className="mt-1 text-sm text-red-600">{errors.descricao}</p>
                        )}
                    </div>

                    {/* Grid de Hora Início, Hora Fim e Data */}
                    <div className="mb-6 grid grid-cols-3 gap-4">
                        {/* HR Início */}
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                HR Início <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={hrInicio}
                                onChange={handleHrInicioChange}
                                disabled={mutation.isPending}
                                className={`w-full rounded-md border p-3 text-base font-semibold shadow-sm focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${
                                    errors.hrInicio ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="HH:MM"
                                maxLength={5}
                            />
                            {errors.hrInicio && (
                                <p className="mt-1 text-sm text-red-600">{errors.hrInicio}</p>
                            )}
                        </div>

                        {/* HR Fim */}
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                HR Fim <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={hrFim}
                                onChange={handleHrFimChange}
                                disabled={mutation.isPending}
                                className={`w-full rounded-md border p-3 text-base font-semibold shadow-sm focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${
                                    errors.hrFim ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="HH:MM"
                                maxLength={5}
                            />
                            {errors.hrFim && (
                                <p className="mt-1 text-sm text-red-600">{errors.hrFim}</p>
                            )}
                        </div>

                        {/* Data */}
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                Data <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="date"
                                value={data}
                                onChange={(e) => setData(e.target.value)}
                                disabled={mutation.isPending}
                                max={hoje}
                                className={`w-full rounded-md border p-3 text-base font-semibold shadow-sm focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${
                                    errors.data ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.data && (
                                <p className="mt-1 text-sm text-red-600">{errors.data}</p>
                            )}
                        </div>
                    </div>

                    {/* Erro de Submit */}
                    {errors.submit && (
                        <div className="mb-4 rounded-md bg-red-100 p-3 text-sm font-semibold text-red-700">
                            {errors.submit}
                        </div>
                    )}

                    {/* Botões */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={mutation.isPending}
                            className="cursor-pointer rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-bold tracking-widest text-gray-700 shadow-md shadow-black transition-all hover:scale-105 hover:bg-gray-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex cursor-pointer items-center gap-2 rounded-md bg-green-600 px-6 py-3 text-base font-bold tracking-widest text-white shadow-md shadow-black transition-all hover:scale-105 hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {mutation.isPending ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <IoSave size={20} />
                                    Enviar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
