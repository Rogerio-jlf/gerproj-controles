// src/app/paginas/tabela/page.tsx
'use client';

import { LayoutTabelaOS } from '@/components/tabela/Layout_Tabela';
import { TabelaOS } from '@/components/tabela/Tabela_OS';
import { Filtros } from '@/components/utils/Filtros';

export default function TicketChamadoPage() {
  return (
    <LayoutTabelaOS pageTitle="Dados">
      <div className="flex flex-col gap-10 h-full overflow-hidden">
        <div className="flex-shrink-0">
          <Filtros showRefreshButton={false} />
        </div>

        <div className="flex-1 min-h-0">
          <TabelaOS />
        </div>
      </div>
    </LayoutTabelaOS>
  );
}
