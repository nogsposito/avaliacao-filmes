const API_URL = "http://localhost:8000/api/v1";

export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function register(
  data: RegisterData
): Promise<User> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        "E-mail ou nome de usuário já cadastrado."
      );
    }

    throw new Error("Não foi possível criar sua conta.");
  }

  return response.json();
}

export async function login(
  data: LoginData
): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("E-mail ou senha incorretos.");
    }

    throw new Error("Não foi possível entrar.");
  }

  const result: TokenResponse = await response.json();

  return result.access_token;
}

export async function getCurrentUser(
  token: string
): Promise<User> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Sua sessão expirou.");
  }

  return response.json();
}
