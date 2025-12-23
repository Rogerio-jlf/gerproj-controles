'use client';

import { corrigirTextoCorrompido } from '@/formatters/formatar-texto-corrompido';
import React, { useEffect, useRef, useState } from 'react';
import { FiCheck, FiCopy, FiEye, FiMaximize2, FiX } from 'react-icons/fi';

interface PopoverObservacaoProps {
  observacao: string;
  numOS: number;
  onOpenModal?: () => void;
}

export function PopoverObservacaoOS({
  observacao,
  numOS,
  onOpenModal,
}: PopoverObservacaoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const obsCorrigida = corrigirTextoCorrompido(observacao);
  const isLongText = obsCorrigida.length > 500;

  // Fecha ao clicar fora (no overlay ou fora do popover)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
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

  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(obsCorrigida);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  //   ================================================================================
  //   RENDERIZAÇÃO PRINCIPAL
  //   ================================================================================
  return (
    <>
      <div className="relative inline-flex items-center">
        {/* Botão de Visualizar */}
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="group flex items-center gap-1.5 sm:gap-2 rounded bg-blue-500 px-2 sm:px-2 py-1 text-white transition-all hover:bg-blue-600 hover:scale-110 active:scale-95"
          title="Visualizar observação completa"
        >
          <FiEye
            size={18}
            className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5"
          />
          <span className="text-xs sm:text-sm font-semibold tracking-widest select-none text-white">
            Ver
          </span>
        </button>

        {/* Popover */}
        {isOpen && (
          <div
            ref={popoverRef}
            className="animate-in fade-in zoom-in-95 absolute left-0 top-full z-[60] mt-2 w-[95vw] sm:w-[650px] rounded-lg border border-teal-600 bg-white shadow-lg shadow-black"
            style={{ maxWidth: 'calc(100vw - 32px)' }}
          >
            {/* Header do Popover */}
            <div className="flex items-center justify-between border-b-2 border-teal-600 bg-teal-100 px-3 sm:px-4 py-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FiEye className="text-black flex-shrink-0" size={18} />
                <span className="text-sm sm:text-base font-semibold text-black tracking-widest select-none">
                  Observação OS #{numOS}
                </span>
              </div>

              {/* Botão Fechar */}
              <button
                onClick={handleToggle}
                className="group rounded-full p-1 bg-teal-300 transition-all hover:bg-red-500 hover:scale-110 active:scale-95 shadow-md shadow-black cursor-pointer flex-shrink-0"
                title="Fechar"
              >
                <FiX
                  className="text-black hover:text-white group-hover:scale-110 group-active:scale-95 transition-transform"
                  size={18}
                />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="max-h-[200px] sm:max-h-[300px] overflow-y-auto p-3 sm:p-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-teal-400">
              <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base text-black tracking-widest select-none text-justify font-semibold">
                {obsCorrigida}
              </p>
            </div>

            {/* Footer com ações */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 bg-gray-50 px-3 sm:px-4 py-2">
              <span className="text-xs sm:text-sm text-gray-50 font-semibold select-none tracking-widest italic">
                {obsCorrigida.length} caracteres
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Botão Copiar */}
                <button
                  onClick={handleCopy}
                  className="group flex items-center justify-center gap-1.5 sm:gap-2 rounded bg-gray-300 px-2 sm:px-3 py-1 border border-gray-400 transition-all hover:bg-gray-400 hover:scale-110 active:scale-95 cursor-pointer flex-1 sm:flex-initial"
                  title="Copiar texto"
                >
                  {copied ? (
                    <>
                      <FiCheck className="text-green-600 flex-shrink-0" size={14} />
                      <span className="text-xs sm:text-sm text-green-600 tracking-widest select-none font-semibold">
                        Copiado!
                      </span>
                    </>
                  ) : (
                    <>
                      <FiCopy
                        className="text-black group-hover:text-white flex-shrink-0"
                        size={14}
                      />
                      <span className="text-xs sm:text-sm text-black tracking-widest select-none font-semibold group-hover:text-white">
                        Copiar
                      </span>
                    </>
                  )}
                </button>

                {/* Botão Expandir (só aparece se texto for longo) */}
                {isLongText && onOpenModal && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenModal();
                    }}
                    className="flex items-center justify-center gap-1 sm:gap-1.5 rounded bg-teal-600 px-2 sm:px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-teal-700 hover:scale-110 active:scale-95 flex-1 sm:flex-initial"
                    title="Abrir em tela cheia"
                  >
                    <FiMaximize2 size={12} className="flex-shrink-0" />
                    <span>Expandir</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="animate-in fade-in fixed inset-0 z-[50] bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}