// src/app/paginas/chamados/page.tsx
'use client';

import { TabelaChamados } from '@/components/chamados/Tabela_Chamados';
import { Filtros } from '@/components/utils/Filtros';
import { LayoutTabelaChamados } from '../../../components/chamados/Layout_Tabela_Chamados';

export default function ChamadosPage() {
  return (
    <LayoutTabelaChamados pageTitle="Chamados">
      <div className="flex flex-col gap-10 h-full overflow-hidden">
        <div className="flex-shrink-0">
          <Filtros showRefreshButton={false} />
        </div>

        <div className="flex-1 min-h-0">
          <TabelaChamados />
        </div>
      </div>
    </LayoutTabelaChamados>
  );
}
