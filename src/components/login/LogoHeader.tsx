import Image from 'next/image';

export default function LogoHeader() {
    return (
        <div className="relative mb-6 sm:mb-8">
            <div className="absolute inset-0 scale-110 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-30 blur-lg"></div>
            <div className="relative inline-block rounded-full border border-white/30 bg-white/20 p-3 backdrop-blur-sm sm:p-4">
                <Image
                    src="/logo-solutii.png"
                    alt="Logo Solutii"
                    width={60}
                    height={60}
                    className="mx-auto rounded-full drop-shadow-lg sm:h-20 sm:w-20"
                    priority
                />
            </div>
        </div>
    );
}
