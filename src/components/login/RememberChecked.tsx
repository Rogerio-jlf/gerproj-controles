interface Props {
  rememberMe: boolean;
  onToggle: () => void;
}

export default function RememberChecked({ rememberMe, onToggle }: Props) {
  return (
    <div className="flex items-center justify-between pt-1 sm:pt-2 text-xs sm:text-sm">
      <div className="flex items-center group">
        <input
          id="remember-me"
          type="checkbox"
          checked={rememberMe}
          onChange={onToggle}
          className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400 bg-white/10 border-white/30 rounded"
        />
        <label
          htmlFor="remember-me"
          className="ml-2 sm:ml-3 text-white/80 group-hover:text-white cursor-pointer"
        >
          Lembrar de mim
        </label>
      </div>
    </div>
  );
}
