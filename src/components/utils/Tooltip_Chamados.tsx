// components/TooltipTabelaAlways.tsx
'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { cloneElement, ReactElement } from 'react';

interface TooltipTabelaAlwaysProps {
  content: string;
  children: ReactElement<any, any>;
  maxWidth?: string;
}

/**
 * Tooltip que sempre é exibido, diferente do TooltipTabela que só aparece quando há truncamento.
 * Útil para exibir informações adicionais mesmo quando o conteúdo visível é curto.
 */
export function TooltipTabelaChamado({
  content,
  children,
  maxWidth = '200px',
}: TooltipTabelaAlwaysProps) {
  // Se não há conteúdo, retorna apenas os children
  if (!content || content.trim() === '') {
    return children;
  }

  const childProps = (children.props ?? {}) as any;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {cloneElement(children, {
            className: `${childProps.className || ''} cursor-help`,
            style: { ...childProps.style, maxWidth },
          } as any)}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            align="center"
            className="z-[9999] max-w-[500px] break-words rounded-md bg-slate-900 px-4 py-3 text-sm text-white shadow-xl select-none tracking-wide font-medium"
            sideOffset={20}
          >
            {content}
            <Tooltip.Arrow className="fill-slate-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
