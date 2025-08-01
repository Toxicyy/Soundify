import { LoginForm } from "../components/login/LoginForm";
import { MobileAuthForm } from "../components/login/MobileAuthForm.tsx";

/**
 * Адаптивная страница авторизации
 * Desktop (xl+): классический дизайн с волной
 * Mobile (<xl): современный card-based дизайн с анимациями
 *
 * @returns JSX.Element - Страница авторизации с адаптивным дизайном
 */
export default function Login() {
  return (
    <>
      {/* Desktop версия (xl и выше) */}
      <div className="hidden xl:block">
        <LoginForm />
      </div>

      {/* Mobile версия (меньше xl) */}
      <div className="block xl:hidden">
        <MobileAuthForm initialMode="login" />
      </div>
    </>
  );
}
