'use client';

import { formatarNumeros } from '@/formatters/formatar-numeros';
import { corrigirTextoCorrompido } from '@/formatters/formatar-texto-corrompido';
import React, { useState } from 'react';
import { FiCheck, FiCopy, FiFileText, FiX } from 'react-icons/fi';

interface ModalObservacaoOSProps {
  isOpen: boolean;
  onClose: () => void;
  observacao: string;
  numOS: number;
  dataOS?: string;
  consultor?: string;
}

export function ModalObservacaoOS({
  isOpen,
  onClose,
  observacao,
  numOS,
  dataOS,
  consultor,
}: ModalObservacaoOSProps) {
  const [copied, setCopied] = useState(false);

  const obsCorrigida = corrigirTextoCorrompido(observacao);

  const handleCopy = () => {
    navigator.clipboard.writeText(obsCorrigida);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="animate-in fade-in fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal Container */}
      <div className="animate-in slide-in-from-bottom-4 relative z-10 w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-teal-600 bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-2">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <FiFileText className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white tracking-wide">
                Observação Completa
              </h2>
              <p className="text-sm text-teal-100 font-semibold tracking-wide">
                OS #{formatarNumeros(numOS)}
                {dataOS && ` • ${dataOS}`}
                {consultor && ` • ${consultor}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/20 p-2 text-white transition-all hover:bg-red-500 hover:scale-110 active:scale-95"
            title="Fechar"
          >
            <FiX size={20} />
          </button>
        </header>

        {/* Body */}
        <div className="p-6">
          {/* Área de texto com scroll */}
          <div className="mb-4 max-h-[60vh] overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-6 scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-teal-500">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
              {obsCorrigida}
            </p>
          </div>

          {/* Footer com estatísticas e ações */}
          <div className="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-semibold">
                📝 {obsCorrigida.length} caracteres
              </span>
              <span className="font-semibold">
                📄 {obsCorrigida.split(/\n/).length} linhas
              </span>
              <span className="font-semibold">
                🔤 {obsCorrigida.split(/\s+/).filter(Boolean).length} palavras
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Botão Copiar */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition-all hover:bg-teal-700 hover:scale-105 active:scale-95"
              >
                {copied ? (
                  <>
                    <FiCheck size={16} />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <FiCopy size={16} />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              {/* Botão Fechar */}
              <button
                onClick={onClose}
                className="rounded-lg bg-gray-300 px-4 py-2 font-semibold text-gray-700 transition-all hover:bg-gray-400 active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
