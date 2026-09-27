
import { useState, type FormEvent } from "react";

import { useAuth } from "../auth/AuthContext";
import { register } from "../services/auth";

interface RegisterPageProps {
  onBack: () => void;
  onLogin: () => void;
  onSuccess: () => void;
}

function RegisterPage({
  onBack,
  onLogin,
  onSuccess,
}: RegisterPageProps) {
  const { signIn } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const usernameValid =
    /^[A-Za-z0-9_]{3,30}$/.test(username.trim());

  const emailValid =
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const passwordValid =
    password.length >= 8 && password.length <= 128;

  const passwordsMatch =
    password === confirmPassword;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!usernameValid) {
      setError(
        "O nome deve ter de 3 a 30 caracteres, sem espaços."
      );
      return;
    }

    if (!emailValid) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (!passwordValid) {
      setError("A senha deve ter de 8 a 128 caracteres.");
      return;
    }

    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setSaving(true);

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      await signIn({
        email: email.trim(),
        password,
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar sua conta."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-visual auth-visual-register">
        <button
          type="button"
          className="auth-back"
          onClick={onBack}
        >
          ← Voltar ao catálogo
        </button>

        <div className="auth-art">
          <div className="auth-art-ring auth-art-ring-one" />
          <div className="auth-art-ring auth-art-ring-two" />

          <div className="auth-art-center">
            <span aria-hidden="true">★</span>
          </div>
        </div>

        <div className="auth-visual-copy">
          <p className="eyebrow">FAÇA PARTE</p>

          <h2>
            Todo filme deixa
            <br />
            uma impressão.
          </h2>

          <p>
            Crie sua conta, dê suas notas e compartilhe
            o que cada história significou para você.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-mobile-back">
            <button
              type="button"
              className="back-button"
              onClick={onBack}
            >
              ← Voltar ao catálogo
            </button>
          </div>

          <div className="auth-brand">
            <span className="auth-brand-icon">▶</span>
            <span>ROCKETLAB FILMES</span>
          </div>

          <div className="auth-heading">
            <p className="eyebrow">COMECE SUA HISTÓRIA</p>

            <h1>Crie sua conta.</h1>

            <p>
              Um espaço para registrar suas descobertas
              e compartilhar suas opiniões.
            </p>
          </div>

          <form
            className="auth-fields"
            onSubmit={handleSubmit}
          >
            <label htmlFor="register-username">
              Nome de usuário
            </label>

            <input
              id="register-username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9_]{3,30}"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="seu_usuario"
            />

            <p className="auth-field-hint">
              De 3 a 30 caracteres. Letras, números e _.
            </p>

            <label htmlFor="register-email">
              E-mail
            </label>

            <input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="voce@exemplo.com"
            />

            <label htmlFor="register-password">
              Senha
            </label>

            <div className="auth-password-field">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Crie uma senha"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                aria-label={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <p
              className={
                passwordValid
                  ? "auth-field-hint valid"
                  : "auth-field-hint"
              }
            >
              {passwordValid
                ? "✓ Comprimento válido"
                : "Mínimo de 8 caracteres"}
            </p>

            <label htmlFor="register-confirm">
              Confirmar senha
            </label>

            <input
              id="register-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Repita sua senha"
            />

            {confirmPassword && !passwordsMatch && (
              <p className="auth-field-hint invalid">
                As senhas ainda não coincidem.
              </p>
            )}

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={saving}
            >
              {saving ? "Criando conta..." : "Criar conta"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-switch">
            Já tem uma conta?{" "}
            <button
              type="button"
              onClick={onLogin}
            >
              Entrar
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
