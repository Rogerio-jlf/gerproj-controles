// src/app/paginas/cliente/chamados/page.tsx
'use client';

import { LayoutTabelaChamados } from '../../../../components/chamados/Layout_Tabela_Chamados';
import { TabelaChamados } from '../../../../components/chamados/Tabela_Chamados';
import { Filtros } from '../../../../components/shared/Filtros';

export default function ChamadosPage() {
    return (
        <LayoutTabelaChamados pageTitle="Chamados">
            <div className="flex h-full flex-col gap-10 overflow-hidden">
                <div className="flex-shrink-0">
                    <Filtros />
                </div>

                <div className="min-h-0 flex-1">
                    <TabelaChamados />
                </div>
            </div>
        </LayoutTabelaChamados>
    );
}
