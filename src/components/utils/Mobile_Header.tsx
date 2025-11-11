import Image from 'next/image';
import { IoClose, IoMenu } from 'react-icons/io5';

// Define as propriedades esperadas pelo componente MobileHeader
interface MobileHeaderProps {
  sidebarOpen: boolean; // Indica se a sidebar está aberta
  setSidebarOpen: (open: boolean) => void; // Função para alterar o estado da sidebar
  pageTitle: string; // Título da página exibido no header
}

// Componente funcional que representa o header mobile
export default function MobileHeader({
  sidebarOpen,
  setSidebarOpen,
  pageTitle,
}: MobileHeaderProps) {
  return (
    // Container fixo no topo da tela, visível apenas em telas pequenas (mobile)
    <div className="fixed top-0 right-0 left-0 z-50 bg-white px-4 py-3 shadow-md lg:hidden">
      <div className="flex items-center justify-between">
        {/* Bloco do logo */}
        <div className="flex items-center">
          <Image
            src="/logo-solutii.png"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-full"
            priority
          />
        </div>

        {/* Bloco do título centralizado */}
        <div className="flex flex-1 justify-center">
          <h1 className="text-lg font-semibold whitespace-nowrap text-gray-800">
            {pageTitle}
          </h1>
        </div>

        {/* Botão para abrir/fechar a sidebar */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Impede propagação do clique
            setSidebarOpen(!sidebarOpen); // Alterna o estado da sidebar
          }}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          {/* Exibe o ícone de fechar se a sidebar estiver aberta, senão o ícone de menu */}
          {sidebarOpen ? (
            <IoClose className="h-6 w-6 text-gray-700" />
          ) : (
            <IoMenu className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </div>
    </div>
  );
}
