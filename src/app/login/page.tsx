import Background from '../../components/login/Background';
import LoginForm from '../../components/login/LoginForm';
import LogoHeader from '../../components/login/LogoHeader';
import './style_login.css';

export default function LoginPage() {
  return (
    <div className="kodchasan relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-3 sm:p-4 lg:p-6">
      <div className="absolute inset-0">
        <Background />
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md">
        <div className="mx-auto overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl sm:rounded-3xl">
          <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"></div>
          <div className="relative px-6 pt-8 pb-6 text-center sm:px-8 sm:pt-10 sm:pb-8">
            <LogoHeader />
            <h1 className="mb-2 text-2xl leading-tight font-bold tracking-tight text-white sm:mb-3 sm:text-3xl">
              Bem-vindo de volta!
            </h1>
            <p className="px-2 text-xs leading-relaxed text-white/80 sm:text-sm">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>
          <div className="px-6 pb-8 sm:px-8 sm:pb-10">
            <LoginForm />
          </div>
        </div>

        <div className="mt-6 px-4 text-center sm:mt-8">
          <p className="text-xs font-medium tracking-wide text-white/60 sm:text-sm">
            © 2025 Solutii. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
