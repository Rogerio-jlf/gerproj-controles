'use client';

import { useFilters } from '@/context/FiltersContext';
import { useRouter } from 'next/navigation';
import { IoLogOut } from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';

// Componente funcional para o botão de logout
export function ButtonLogout() {
  const { logout } = useAuth(); // Obtém a função de logout do contexto de autenticação
  const { clearFilters } = useFilters(); // Obtém a função para limpar filtros do contexto de filtros
  const router = useRouter(); // Inicializa o hook de navegação para redirecionamento

  // Função chamada ao clicar no botão de logout
  const handleLogout = () => {
    logout(); // Realiza o logout do usuário
    clearFilters(); // Limpa os filtros aplicados
    router.push('/paginas/login'); // Redireciona o usuário para a página de login
  };

  // Renderiza o botão de logout com estilos aprimorados
  return (
    <button
      onClick={handleLogout}
      className="group relative flex w-full items-center hover:scale-105 justify-center gap-4 rounded-2xl bg-white/10 px-6 py-3 shadow-md shadow-black transition-all hover:bg-white/20 hover:shadow-lg hover:shadow-black active:scale-95 tracking-widest"
    >
      {/* Ícone de logout */}
      <IoLogOut
        className=" group-active:scale-90 group-hover:scale-105 text-white/80 hover:text-white"
        size={32}
      />

      {/* Texto do botão */}
      <span className="font-extrabold tracking-widest select-none text-lg text-white/80 hover:text-white">
        Sair
      </span>
    </button>
  );
}
