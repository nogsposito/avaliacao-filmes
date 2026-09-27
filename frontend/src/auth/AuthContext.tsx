import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  type LoginData,
  type User,
} from "../services/auth";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (data: LoginData) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(
  null
);

const TOKEN_KEY = "rocketlab_access_token";

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem(TOKEN_KEY)
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser(token);

        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, [token]);

  async function signIn(data: LoginData) {
    const accessToken = await loginRequest(data);
    const currentUser = await getCurrentUser(accessToken);

    sessionStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(currentUser);
  }

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser utilizado dentro de AuthProvider."
    );
  }

  return context;
}
