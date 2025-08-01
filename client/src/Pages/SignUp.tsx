import SignUpForm from "../components/signUp/SignUpForm";
import { MobileAuthForm } from "../components/login/MobileAuthForm.tsx";

/**
 * Адаптивная страница регистрации
 * Desktop (xl+): классический дизайн с волной
 * Mobile (<xl): современный card-based дизайн с анимациями
 *
 * @returns JSX.Element - Страница регистрации с адаптивным дизайном
 */
export default function SignUp() {
  return (
    <>
      {/* Desktop версия (xl и выше) */}
      <div className="hidden xl:block">
        <SignUpForm />
      </div>

      {/* Mobile версия (меньше xl) */}
      <div className="block xl:hidden">
        <MobileAuthForm initialMode="signup" />
      </div>
    </>
  );
}
