export default function Background() {
    return (
        <>
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/imagem-fundo-login.avif)',
                    opacity: 0.3, // Ajuste a opacidade conforme necessário
                }}
            ></div>

            {/* Overlay escuro para melhor contraste */}
            <div className="absolute inset-0 bg-black/40"></div>

            {/* Floating Orbs */}
            <div className="absolute top-1/4 left-1/4 h-16 w-16 animate-pulse rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-xl sm:h-24 sm:w-24 lg:h-32 lg:w-32"></div>
            <div className="absolute top-3/4 right-1/4 h-20 w-20 animate-pulse rounded-full bg-gradient-to-r from-blue-400/15 to-purple-400/15 blur-2xl delay-1000 sm:h-32 sm:w-32 lg:h-40 lg:w-40"></div>
            <div className="absolute top-1/2 left-3/4 h-12 w-12 animate-pulse rounded-full bg-gradient-to-r from-pink-400/25 to-purple-400/25 blur-xl delay-500 sm:h-18 sm:w-18 lg:h-24 lg:w-24"></div>

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-5 sm:opacity-10"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
                    backgroundSize: '30px 30px sm:50px sm:50px',
                }}
            ></div>

            {/* Radial Gradients */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(168,85,247,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(236,72,153,0.10) 0%, transparent 50%),
            radial-gradient(circle at 60% 20%, rgba(59,130,246,0.08) 0%, transparent 50%)
          `,
                }}
            ></div>
        </>
    );
}
