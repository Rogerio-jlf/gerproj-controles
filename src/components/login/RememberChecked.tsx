interface Props {
    rememberMe: boolean;
    onToggle: () => void;
}

export default function RememberChecked({ rememberMe, onToggle }: Props) {
    return (
        <div className="flex items-center justify-between pt-1 text-xs sm:pt-2 sm:text-sm">
            <div className="group flex items-center">
                <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={onToggle}
                    className="h-3.5 w-3.5 rounded border-white/30 bg-white/10 text-purple-400 sm:h-4 sm:w-4"
                />
                <label
                    htmlFor="remember-me"
                    className="ml-2 cursor-pointer text-white/80 group-hover:text-white sm:ml-3"
                >
                    Lembrar de mim
                </label>
            </div>
        </div>
    );
}
