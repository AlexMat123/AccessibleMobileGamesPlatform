const API_URL = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export const registerUser = async (username, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    return res.json();
};

export const loginUser = async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    return res.json();
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