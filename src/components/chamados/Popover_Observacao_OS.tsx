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

  // Fecha ao clicar fora
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
    <div className="relative inline-flex items-center">
      {/* Botão de Visualizar */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="group flex items-center gap-2 rounded bg-blue-500 px-2 py-1 text-white transition-all hover:bg-blue-600 hover:scale-110 active:scale-95"
        title="Visualizar observação completa"
      >
        <FiEye
          size={20}
          className="group-hover:scale-110 transition-transform"
        />
        <span className="text-sm font-semibold tracking-widest select-none text-white">
          Ver
        </span>
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="animate-in fade-in zoom-in-95 absolute left-0 top-full z-50 mt-2 w-[650px] rounded-lg border border-teal-600 bg-white shadow-lg shadow-black"
          style={{ maxWidth: 'calc(100vw - 60px)' }}
        >
          {/* Header do Popover */}
          <div className="flex items-center justify-between border-b-2 border-teal-600 bg-teal-100 px-4 py-2">
            <div className="flex items-center gap-2">
              <FiEye className="text-black" size={20} />
              <span className="text-base font-semibold text-black tracking-widest select-none">
                Observação OS #{numOS}
              </span>
            </div>

            {/* Botão Fechar */}
            <button
              onClick={handleToggle}
              className="group rounded-full p-1 bg-teal-300 transition-all hover:bg-red-500 hover:scale-110 active:scale-95 shadow-md shadow-black cursor-pointer"
              title="Fechar"
            >
              <FiX
                className="text-black hover:text-white group-hover:scale-110 group-active:scale-95 transition-transform"
                size={20}
              />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="max-h-[300px] overflow-y-auto p-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-teal-400">
            <p className="whitespace-pre-wrap leading-relaxed text-base text-black tracking-widest select-none text-justify font-semibold">
              {obsCorrigida}
            </p>
          </div>

          {/* Footer com ações */}
          <div className="flex items-center justify-between border-t border-teal-600 bg-gray-50 px-4 py-2">
            <span className="text-sm text-black font-semibold select-none tracking-widest italic">
              {obsCorrigida.length} caracteres
            </span>

            <div className="flex items-center gap-2">
              {/* Botão Copiar */}
              <button
                onClick={handleCopy}
                className="group flex items-center gap-2 rounded bg-gray-300 px-3 py-1 border border-gray-400 transition-all hover:bg-gray-400 hover:scale-110 active:scale-95 cursor-pointer"
                title="Copiar texto"
              >
                {copied ? (
                  <>
                    <FiCheck className="text-green-600" size={14} />
                    <span className="text-sm text-green-600 tracking-widest select-none font-semibold">
                      Copiado!
                    </span>
                  </>
                ) : (
                  <>
                    <FiCopy className="text-black group-hover:text-white" size={14} />
                    <span className="text-sm text-black tracking-widest select-none font-semibold group-hover:text-white">
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
                  className="flex items-center gap-1.5 rounded bg-teal-600 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-teal-700 active:scale-95"
                  title="Abrir em tela cheia"
                >
                  <FiMaximize2 size={12} />
                  <span>Expandir</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
