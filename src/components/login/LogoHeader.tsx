import Image from 'next/image';

export default function LogoHeader() {
  return (
    <div className="mb-6 sm:mb-8 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-30 scale-110"></div>
      <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-3 sm:p-4 inline-block border border-white/30">
        <Image
          src="/logo-solutii.png"
          alt="Logo Solutii"
          width={60}
          height={60}
          className="mx-auto drop-shadow-lg sm:w-20 sm:h-20 rounded-full"
          priority
        />
      </div>
    </div>
  );
}
