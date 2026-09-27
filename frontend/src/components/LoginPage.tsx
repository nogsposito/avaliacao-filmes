
import { useState, type FormEvent } from "react";

import { useAuth } from "../auth/AuthContext";

interface LoginPageProps {
  onBack: () => void;
  onRegister: () => void;
  onSuccess: () => void;
}

function LoginPage({
  onBack,
  onRegister,
  onSuccess,
}: LoginPageProps) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await signIn({
        email: email.trim(),
        password,
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível entrar."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-visual">
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
            <span aria-hidden="true">▶</span>
          </div>
        </div>

        <div className="auth-visual-copy">
          <p className="eyebrow">SUA PRÓXIMA SESSÃO</p>

          <h2>
            Bons filmes merecem
            <br />
            boas conversas.
          </h2>

          <p>
            Descubra histórias, compartilhe opiniões
            e registre os filmes que marcaram você.
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
            <p className="eyebrow">QUE BOM TER VOCÊ DE VOLTA</p>

            <h1>Entre na sua conta.</h1>

            <p>
              Continue de onde parou e compartilhe
              suas avaliações.
            </p>
          </div>

          <form
            className="auth-fields"
            onSubmit={handleSubmit}
          >
            <label htmlFor="login-email">
              E-mail
            </label>

            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="voce@exemplo.com"
            />

            <label htmlFor="login-password">
              Senha
            </label>

            <div className="auth-password-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Sua senha"
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
              {saving ? "Entrando..." : "Entrar"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-switch">
            Ainda não tem uma conta?{" "}
            <button
              type="button"
              onClick={onRegister}
            >
              Cadastre-se
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
