import { useEffect, useState } from 'react';
import { MdPunchClock } from 'react-icons/md';
import { formatarHora } from '../../formatters/formatar-hora';

// Componente separado para o relógio
export function Relogio() {
    const [horaAtual, setHoraAtual] = useState(
        new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
    );

    useEffect(() => {
        const intervalo = setInterval(() => {
            setHoraAtual(
                new Date().toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                })
            );
        }, 1000);

        return () => clearInterval(intervalo);
    }, []);

    return (
        <div className="flex items-center justify-center gap-2 text-base font-extrabold tracking-widest text-black select-none">
            <MdPunchClock className="text-black" size={24} />
            {formatarHora(horaAtual)}
        </div>
    );
}
