// src/app/paginas/gerproj/chamados/page.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import { useConsultorData, useIsConsultor } from '@/hooks/useUserType';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChamadosPage() {
    const { isLoggedIn, isLoading } = useAuth();
    const isConsultor = useIsConsultor();
    const consultorData = useConsultorData();
    const router = useRouter();

    // Proteção de rota: apenas consultores podem acessar
    useEffect(() => {
        if (!isLoading) {
            if (!isLoggedIn) {
                router.push('/');
            } else if (!isConsultor) {
                // Se não for consultor, redireciona para dashboard
                router.push('/paginas/dashboard');
            }
        }
    }, [isLoggedIn, isLoading, isConsultor, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-lg">Carregando...</div>
            </div>
        );
    }

    if (!consultorData) {
        return null; // Redirecionando...
    }

    return (
        <div className="min-h-screen p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">Gerenciamento de Chamados</h1>
                    <p className="mt-2 text-gray-600">
                        Bem-vindo,{' '}
                        <span className="font-semibold">{consultorData.nomeUsuario}</span>
                        {consultorData.isAdmin && (
                            <span className="ml-2 rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                                Administrador
                            </span>
                        )}
                    </p>
                </header>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Card de Informações do Usuário */}
                    <div className="rounded-lg border bg-white p-6 shadow">
                        <h2 className="mb-4 text-xl font-semibold">Suas Informações</h2>
                        <dl className="space-y-2">
                            <div>
                                <dt className="text-sm text-gray-600">ID Usuário:</dt>
                                <dd className="font-medium">{consultorData.idUsuario}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-600">Código:</dt>
                                <dd className="font-medium">{consultorData.codUsuario}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-600">Tipo:</dt>
                                <dd className="font-medium">
                                    {consultorData.tipoUsuario === 'ADM'
                                        ? 'Administrador'
                                        : 'Usuário'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Card de Permissões */}
                    <div className="rounded-lg border bg-white p-6 shadow">
                        <h2 className="mb-4 text-xl font-semibold">Permissões</h2>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <span
                                    className={
                                        consultorData.permissoes.permtar
                                            ? 'text-green-600'
                                            : 'text-gray-400'
                                    }
                                >
                                    {consultorData.permissoes.permtar ? '✓' : '✗'}
                                </span>
                                <span>Permissão TAR</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span
                                    className={
                                        consultorData.permissoes.perproj1
                                            ? 'text-green-600'
                                            : 'text-gray-400'
                                    }
                                >
                                    {consultorData.permissoes.perproj1 ? '✓' : '✗'}
                                </span>
                                <span>Permissão Projeto 1</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span
                                    className={
                                        consultorData.permissoes.perproj2
                                            ? 'text-green-600'
                                            : 'text-gray-400'
                                    }
                                >
                                    {consultorData.permissoes.perproj2 ? '✓' : '✗'}
                                </span>
                                <span>Permissão Projeto 2</span>
                            </li>
                        </ul>
                    </div>

                    {/* Card de Estatísticas */}
                    <div className="rounded-lg border bg-white p-6 shadow">
                        <h2 className="mb-4 text-xl font-semibold">Estatísticas</h2>
                        <div className="space-y-3">
                            <div>
                                <div className="text-2xl font-bold">12</div>
                                <div className="text-sm text-gray-600">Chamados Abertos</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">45</div>
                                <div className="text-sm text-gray-600">Chamados Resolvidos</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de Chamados */}
                <div className="mt-8 rounded-lg border bg-white p-6 shadow">
                    <h2 className="mb-4 text-xl font-semibold">Seus Chamados</h2>
                    <p className="text-gray-600">
                        Aqui aparecerão os chamados atribuídos a você...
                    </p>
                </div>
            </div>
        </div>
    );
}
