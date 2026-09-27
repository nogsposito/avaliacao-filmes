
import { useState, type FormEvent } from "react";

import { useAuth } from "../auth/AuthContext";
import { register } from "../services/auth";

interface AuthPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

function AuthPage({
  onBack,
  onSuccess,
}: AuthPageProps) {
  const { signIn } = useAuth();

  const [mode, setMode] = useState<"login" | "register">(
    "login"
  );

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (isRegister) {
        await register({
          username: username.trim(),
          email: email.trim(),
          password,
        });
      }

      await signIn({
        email: email.trim(),
        password,
      });

      onSuccess();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  function changeMode() {
    setMode(isRegister ? "login" : "register");
    setError("");
  }

  return (
    <main className="container">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Voltar ao catálogo
      </button>

      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >
        <p className="eyebrow">FILMES</p>

        <h1>
          {isRegister ? "Criar conta" : "Entrar"}
        </h1>

        <p className="subtitle">
          {isRegister
            ? "Crie sua conta para avaliar seus filmes favoritos."
            : "Entre na sua conta para publicar avaliações."}
        </p>

        {isRegister && (
          <label>
            Nome de usuário
            <input
              required
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9_]+"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="seu_usuario"
            />
          </label>
        )}

        <label>
          E-mail
          <input
            required
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="voce@exemplo.com"
          />
        </label>

        <label>
          Senha
          <input
            required
            type="password"
            minLength={isRegister ? 8 : undefined}
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder={
              isRegister
                ? "Mínimo de 8 caracteres"
                : "Sua senha"
            }
          />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="primary-button"
          disabled={saving}
        >
          {saving
            ? "Aguarde..."
            : isRegister
              ? "Criar conta"
              : "Entrar"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={changeMode}
          disabled={saving}
        >
          {isRegister
            ? "Já tenho uma conta"
            : "Ainda não tenho uma conta"}
        </button>
      </form>
    </main>
  );
}

export default AuthPage;
