import React from 'react';

interface ResizeHandleProps {
    columnId: string;
    onMouseDown: (e: React.MouseEvent, columnId: string) => void;
    onDoubleClick: (columnId: string) => void; // ✅ NOVA PROP
    isResizing: boolean;
}

export const RedimensionarColunas: React.FC<ResizeHandleProps> = ({
    columnId,
    onMouseDown,
    onDoubleClick, // ✅ NOVA PROP
    isResizing,
}) => (
    <div
        className={`group absolute top-0 right-0 bottom-0 w-1 cursor-col-resize transition-colors hover:bg-white/60 ${
            isResizing ? 'bg-white' : ''
        }`}
        onMouseDown={(e) => onMouseDown(e, columnId)}
        onDoubleClick={() => onDoubleClick(columnId)} // ✅ NOVA FUNCIONALIDADE
        title="Arraste para redimensionar | Duplo clique para resetar" // ✅ TOOLTIP
        style={{ zIndex: 15 }}
    >
        {/* Área clicável maior para facilitar o resize */}
        <div className="absolute top-0 right-0 bottom-0 -mr-1.5 w-3" />

        {/* Indicador visual ao hover */}
        <div
            className={`absolute top-0 right-0 bottom-0 w-0.5 transition-colors ${
                isResizing
                    ? 'bg-purple-400' // ✅ Cor quando está redimensionando
                    : 'bg-white/0 group-hover:bg-white/80' // Cor normal e hover
            }`}
        />

        {/* ✅ NOVO: Indicador central para melhor visibilidade */}
        <div
            className={`absolute top-1/2 right-0 h-8 w-1 -translate-y-1/2 rounded-full transition-all ${
                isResizing ? 'scale-110 bg-purple-500' : 'bg-transparent group-hover:bg-white/90'
            }`}
        />
    </div>
);
