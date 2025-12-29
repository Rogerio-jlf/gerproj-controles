import { useFilters } from '@/context/FiltersContext';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoCall, IoClose, IoHome, IoLogOut, IoMenu } from 'react-icons/io5';
import { PiTimerFill } from 'react-icons/pi';
import { useAuth } from '../../context/AuthContext';
import { ModalSaldoHoras } from '../saldo-horas/Modal_Saldo_Horas';

// ================================================================================
// COMPONENTE PRINCIPAL
// ================================================================================
export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const [targetRoute, setTargetRoute] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isModalSaldoOpen, setIsModalSaldoOpen] = useState(false);

    const { logout } = useAuth();
    const { clearFilters } = useFilters();

    useEffect(() => {
        setIsNavigating(false);
        setTargetRoute(null);
    }, [pathname]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            if (mobile) {
                setIsOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, route: string) => {
        if (pathname === route) return;
        e.preventDefault();
        setIsNavigating(true);
        setTargetRoute(route);

        if (isMobile) {
            setIsOpen(false);
        }

        setTimeout(() => {
            router.push(route);
        }, 300);
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = () => {
        logout();
        clearFilters();
        router.push('/paginas/login');
    };

    const handleOpenSaldoModal = () => {
        setIsModalSaldoOpen(true);
        if (isMobile) {
            setIsOpen(false);
        }
    };

    if (isMobile && !isOpen) {
        return (
            <>
                <button
                    onClick={toggleSidebar}
                    className="fixed top-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-black/40 transition-transform active:scale-90"
                    aria-label="Abrir menu"
                >
                    <IoMenu className="h-7 w-7 text-white" />
                </button>
            </>
        );
    }

    // ================================================================================
    // RENDERIZAÇÃO PRINCIPAL
    // ================================================================================
    return (
        <>
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <nav
                className={`group/sidebar flex h-full flex-col items-center overflow-hidden rounded-xl border border-purple-950 bg-purple-900 text-white transition-all duration-300 ease-in-out ${
                    isMobile
                        ? `fixed top-0 left-0 z-50 h-screen ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-64 p-5`
                        : 'relative w-20 p-3 hover:w-64 hover:p-5'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botão de Fechar (Mobile) */}
                {isMobile && (
                    <button
                        onClick={toggleSidebar}
                        className="absolute top-4 right-4 z-[100] h-10 w-10 transition-all duration-300"
                        aria-label="Fechar menu"
                    >
                        <div className="relative flex h-full w-full items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-black/60 transition-all duration-300 active:scale-90" />
                            <IoClose className="relative z-10 h-6 w-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                        </div>
                    </button>
                )}

                {/* Loading Overlay */}
                {isNavigating && (
                    <div className="absolute inset-0 z-[9999] flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 backdrop-blur-md">
                        <div className="flex flex-col items-center gap-6">
                            {/* Barra de Loading Vertical */}
                            <div className="relative h-96 w-3 overflow-hidden rounded-full bg-white/10">
                                {/* Barra animada */}
                                <div className="animate-loading-bar absolute inset-x-0 bottom-0 h-0 w-full rounded-full bg-gradient-to-t from-purple-400 via-blue-400 to-purple-300 shadow-lg shadow-purple-400/50"></div>

                                {/* Brilho adicional */}
                                <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-transparent via-white/20 to-transparent"></div>
                            </div>

                            {/* Texto */}
                            <div className="flex flex-col items-center gap-2 px-2 opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100">
                                <h3 className="text-lg font-extrabold tracking-widest text-white select-none">
                                    Aguarde
                                </h3>
                                <p className="text-center text-sm font-semibold tracking-wider text-white/80 select-none">
                                    {targetRoute === '/paginas/dashboard' && 'Dashboard'}
                                    {targetRoute === '/paginas/chamados' && 'Chamados'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Conteúdo da sidebar */}
                <div
                    className={`relative z-10 flex h-full w-full flex-col items-center ${
                        isMobile ? 'pt-20' : 'pt-8'
                    }`}
                >
                    {/* Logo */}
                    <div className="group relative mt-5 mb-8 transition-all duration-300">
                        <div className="absolute inset-0 rounded-full bg-blue-500 opacity-50 blur-sm"></div>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/50 to-white/10 p-2 ring-2 ring-white/20 transition-all group-hover:ring-purple-400/50">
                            <Image
                                src="/logo-solutii.png"
                                alt="Logo Solutii"
                                width={isMobile ? 70 : 40}
                                height={isMobile ? 70 : 40}
                                className="relative z-10 rounded-xl transition-all duration-500 group-hover/sidebar:h-[70px] group-hover/sidebar:w-[70px]"
                                priority
                            />
                        </div>
                    </div>

                    {/* Divisor */}
                    <div className="mb-8 h-px w-full bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>

                    {/* Links de Navegação */}
                    <div className="flex w-full flex-1 flex-col gap-6">
                        {/* Dashboard Link */}
                        <Link
                            href="/paginas/dashboard"
                            onClick={(e) => handleNavigation(e, '/paginas/dashboard')}
                            className={`group relative flex items-center rounded-xl border-b-2 border-purple-700/50 p-3 transition-all ${
                                pathname === '/paginas/dashboard'
                                    ? 'bg-gradient-to-r from-purple-950 to-blue-950 ring-2 ring-teal-500'
                                    : 'bg-white/20 shadow-md shadow-black hover:bg-white/30'
                            } ${
                                isNavigating && targetRoute === '/paginas/dashboard'
                                    ? 'pointer-events-none opacity-60'
                                    : 'hover:scale-[1.02] active:scale-95'
                            }`}
                        >
                            {pathname === '/paginas/dashboard' && (
                                <div className="absolute top-1/2 -left-1 h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-teal-500 opacity-100 shadow-lg shadow-teal-500/50 transition-opacity md:opacity-0 md:group-hover/sidebar:opacity-100"></div>
                            )}

                            <div className="relative flex w-full items-center justify-center gap-4 md:justify-start">
                                {isNavigating && targetRoute === '/paginas/dashboard' ? (
                                    <div className="h-7 w-7 flex-shrink-0 animate-spin rounded-full border-3 border-white/20 border-t-white"></div>
                                ) : (
                                    <IoHome
                                        className={`h-7 w-7 flex-shrink-0 transition-all ${
                                            pathname === '/paginas/dashboard'
                                                ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                                                : 'text-white/80 group-hover:text-white'
                                        }`}
                                    />
                                )}

                                <span
                                    className={`overflow-hidden text-base font-extrabold tracking-widest whitespace-nowrap transition-all select-none ${
                                        pathname === '/paginas/dashboard'
                                            ? 'text-white'
                                            : 'text-white/80 group-hover:text-white'
                                    } ${
                                        isMobile
                                            ? 'w-auto opacity-100'
                                            : 'w-0 opacity-0 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100'
                                    }`}
                                >
                                    Dashboard
                                </span>
                            </div>
                        </Link>

                        {/* Chamados Link */}
                        <Link
                            href="/paginas/chamados"
                            onClick={(e) => handleNavigation(e, '/paginas/chamados')}
                            className={`group relative flex items-center rounded-xl border-b-2 border-purple-700/50 p-3 transition-all ${
                                pathname === '/paginas/chamados'
                                    ? 'bg-gradient-to-r from-purple-950 to-blue-950 ring-2 ring-teal-500'
                                    : 'bg-white/20 shadow-md shadow-black hover:bg-white/30'
                            } ${
                                isNavigating && targetRoute === '/paginas/chamados'
                                    ? 'pointer-events-none opacity-60'
                                    : 'hover:scale-[1.02] active:scale-95'
                            }`}
                        >
                            {pathname === '/paginas/chamados' && (
                                <div className="absolute top-1/2 -left-1 h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-teal-500 opacity-100 shadow-lg shadow-teal-500/50 transition-opacity md:opacity-0 md:group-hover/sidebar:opacity-100"></div>
                            )}

                            <div className="relative flex w-full items-center justify-center gap-4 md:justify-start">
                                {isNavigating && targetRoute === '/paginas/chamados' ? (
                                    <div className="h-7 w-7 flex-shrink-0 animate-spin rounded-full border-3 border-white/20 border-t-white"></div>
                                ) : (
                                    <IoCall
                                        className={`h-7 w-7 flex-shrink-0 transition-all ${
                                            pathname === '/paginas/chamados'
                                                ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                                                : 'text-white/80 group-hover:text-white'
                                        }`}
                                    />
                                )}

                                <span
                                    className={`overflow-hidden text-base font-extrabold tracking-widest whitespace-nowrap transition-all select-none ${
                                        pathname === '/paginas/chamados'
                                            ? 'text-white'
                                            : 'text-white/80 group-hover:text-white'
                                    } ${
                                        isMobile
                                            ? 'w-auto opacity-100'
                                            : 'w-0 opacity-0 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100'
                                    }`}
                                >
                                    Chamados
                                </span>
                            </div>
                        </Link>

                        {/* Botão Saldo de Horas */}
                        <button
                            onClick={handleOpenSaldoModal}
                            className="group relative flex items-center rounded-xl border-b-2 border-purple-700/50 bg-white/20 p-3 shadow-md shadow-black transition-all hover:scale-[1.02] hover:bg-white/30 active:scale-95"
                        >
                            <div className="relative flex w-full items-center justify-center gap-4 md:justify-start">
                                <PiTimerFill className="h-7 w-7 flex-shrink-0 text-white/80 transition-all group-hover:text-white" />

                                <span
                                    className={`overflow-hidden text-base font-extrabold tracking-widest whitespace-nowrap text-white/80 transition-all select-none group-hover:text-white ${
                                        isMobile
                                            ? 'w-auto opacity-100'
                                            : 'w-0 opacity-0 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100'
                                    }`}
                                >
                                    Saldo
                                </span>
                            </div>
                        </button>
                    </div>

                    {/* Divisor antes do logout */}
                    <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>

                    {/* Botão de Logout */}
                    <div className="w-full pb-4">
                        <button
                            onClick={handleLogout}
                            className="group relative flex w-full items-center rounded-xl bg-white/10 p-3 shadow-md shadow-black transition-all hover:scale-105 hover:bg-white/20 hover:shadow-lg active:scale-95"
                        >
                            <div className="relative flex w-full items-center justify-center gap-4 md:justify-start">
                                <IoLogOut className="h-7 w-7 flex-shrink-0 text-white/80 transition-all group-hover:scale-110 group-hover:text-white" />

                                <span
                                    className={`overflow-hidden text-base font-extrabold tracking-widest whitespace-nowrap text-white/80 transition-colors select-none group-hover:text-white ${
                                        isMobile
                                            ? 'w-auto opacity-100'
                                            : 'w-0 opacity-0 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100'
                                    }`}
                                >
                                    Sair
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Modal de Saldo de Horas */}
            <ModalSaldoHoras isOpen={isModalSaldoOpen} onClose={() => setIsModalSaldoOpen(false)} />
        </>
    );
}
