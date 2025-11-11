// components/TooltipTabela.tsx
'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { useRef, useState, useEffect } from 'react';

interface TooltipTabelaProps {
  content: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function TooltipTabela({ 
  content, 
  children, 
  maxWidth = '200px' 
}: TooltipTabelaProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && content) {
        const element = textRef.current;
        
        // Método mais confiável para detectar truncamento
        const isTruncated = element.scrollWidth > element.clientWidth;
        
        console.log('TooltipTabela - Debug:', {
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          isTruncated,
          contentLength: content.length,
          content: content.substring(0, 50) + '...' // Mostra só o início
        });
        
        setShowTooltip(isTruncated);
      }
    };

    // Usar múltiplos timeouts para garantir que a tabela foi renderizada
    const timeout1 = setTimeout(checkOverflow, 50);
    const timeout2 = setTimeout(checkOverflow, 200);
    const timeout3 = setTimeout(checkOverflow, 500);
    
    window.addEventListener('resize', checkOverflow);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [content]);

  // Sempre mostrar tooltip se o conteúdo for longo (fallback)
  const shouldShowTooltip = showTooltip || (content && content.length > 50);

  if (!shouldShowTooltip || !content) {
    return (
      <div 
        ref={textRef} 
        className="truncate w-full"
        style={{ maxWidth }}
      >
        {children}
      </div>
    );
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div 
            ref={textRef} 
            className="truncate w-full cursor-help"
            style={{ maxWidth }}
          >
            {children}
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            align="end"
            className="z-[9999] max-w-[500px] break-words rounded-md bg-black px-3 py-2 text-base text-white shadow-md shadow-black select-none tracking-widest font-medium"
            sideOffset={30}
          >
            {content}
            <Tooltip.Arrow className="fill-red-500" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}