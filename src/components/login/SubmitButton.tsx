import { ImSpinner2 } from 'react-icons/im';
import { MdOutlineKeyboardArrowRight } from 'react-icons/md';

type SubmitButtonProps = {
  isLoading: boolean;
};

export default function SubmitButton({ isLoading }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`group relative w-full flex justify-center items-center py-3.5 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl text-white bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 shadow-xl transform ${
        isLoading
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:from-purple-600 hover:to-pink-600 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl sm:rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />

      {isLoading ? (
        <span className="flex items-center gap-2 relative z-10">
          <ImSpinner2 className="animate-spin w-5 h-5" />
          Entrando...
        </span>
      ) : (
        <>
          <span className="mr-2 relative z-10">Entrar</span>
          <MdOutlineKeyboardArrowRight className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
        </>
      )}
    </button>
  );
}
