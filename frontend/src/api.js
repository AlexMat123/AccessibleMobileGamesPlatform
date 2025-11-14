// export const API_URL = "http://localhost:5000/api";
const API_URL = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export const registerUser = async (username, email, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Registration failed');
  return res.json();
};

export const loginUser = async (identifier, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
};

export async function getGame(id) {
    const res = await fetch(`${API_URL}/games/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch game ${id}: ${res.status} ${res.statusText}`);
    return res.json();
}

export async function getGames() {
    const res = await fetch(`${API_URL}/games`);
    if (!res.ok) throw new Error(`Failed to fetch games: ${res.status} ${res.statusText}`);
    return res.json();
}

