import { IoEye, IoEyeOff, IoLockClosed } from 'react-icons/io5';

interface Props {
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
}

export default function PasswordField({
  value,
  onChange,
  showPassword,
  toggleShowPassword,
}: Props) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <label
        htmlFor="password"
        className="text-sm font-semibold text-white/90 block"
      >
        Senha
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
          <IoLockClosed className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 group-focus-within:text-purple-300 transition-colors duration-200" />
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          id="password"
          name="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite sua senha"
          required
          className="block w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-white/15 hover:border-white/30 text-sm sm:text-base"
        />
        <button
          type="button"
          onClick={toggleShowPassword}
          className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center z-10 hover:scale-110 transition-transform duration-200 touch-manipulation"
          tabIndex={-1}
        >
          {showPassword ? (
            <IoEyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-white/60" />
          ) : (
            <IoEye className="h-4 w-4 sm:h-5 sm:w-5 text-white/60" />
          )}
        </button>
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
      </div>
    </div>
  );
}
