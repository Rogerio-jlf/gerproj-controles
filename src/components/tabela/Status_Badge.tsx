'use client';

import { CheckCircle, Clock, FileText, PlayCircle } from 'lucide-react';

// Função que retorna o ícone, cor e fundo de acordo com o status recebido.
const getStatusIcon = (status: string) => {
  const statusLower = status?.toLowerCase() || ''; // Converte o status para minúsculas para facilitar a comparação.

  // Mapeamento de status para ícone, cor e fundo.
  const statusConfig = {
    finalizado: {
      icon: CheckCircle,
      color: 'text-green-700',
      bg: 'bg-green-200',
    },
    'aguardando validacao': {
      icon: PlayCircle,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
    },
    atribuido: {
      icon: CheckCircle,
      color: 'text-pink-600',
      bg: 'bg-pink-200',
    },
    standby: {
      icon: Clock,
      color: 'text-yellow-700',
      bg: 'bg-yellow-200',
    },
    'em atendimento': {
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  };

  // Procura um status que combine com o status recebido.
  const matchedStatus = Object.keys(statusConfig).find(
    (key) => statusLower.includes(key) || key.includes(statusLower),
  );

  // Retorna o ícone, cor e fundo correspondente ou um padrão caso não encontre.
  return matchedStatus
    ? statusConfig[matchedStatus as keyof typeof statusConfig]
    : { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50' };
};

// Define as propriedades esperadas pelo componente StatusBadge.
interface StatusBadgeProps {
  status: string;
}

// Componente que exibe o badge de status com ícone, cor e fundo apropriados.
export function StatusBadge({ status }: StatusBadgeProps) {
  const { icon: Icon, color, bg } = getStatusIcon(status); // Obtém o ícone, cor e fundo baseado no status.

  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${bg} ${color}`}
    >
      <Icon className="mr-1.5 h-3.5 w-3.5" />{' '}
      {/* Renderiza o ícone à esquerda do texto */}
      {status} {/* Exibe o texto do status */}
    </div>
  );
}
