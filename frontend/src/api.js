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
  return res.json();
};

export const fetchCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to load profile');
  return res.json();
};

export const fetchTagGroups = async () => {
  const res = await fetch(`${API_URL}/tag-groups`);
  if (!res.ok) throw new Error("Unable to load tag groups");
  return res.json();
};

export const fetchGames = async () => {
  const res = await fetch(`${API_URL}/games`);
  if (!res.ok) throw new Error("Unable to load games");
  return res.json();
};

export const searchGames = async ({ q = "", tags = [] } = {}) => {
  const params = new URLSearchParams();
  if (q && q.trim()) params.set("q", q.trim());
  if (Array.isArray(tags) && tags.length > 0) params.set("tags", tags.join(","));
  const url = `${API_URL}/games/search${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Unable to search games");
  return res.json();
};

export async function getGame(id) {
    const res = await fetch(`${API_URL}/games/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch game ${id}: ${res.status} ${res.statusText}`);
    return res.json();
}

export async function createReviewForGame(gameId, data) {
  const res = await fetch(`${API_URL}/games/${gameId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data), // { rating, comment }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to submit review");
  }

  return res.json();
}


export function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getReviewsForGame(gameId) {
  const res = await fetch(`${API_URL}/games/${gameId}/reviews`);
  if (!res.ok) {
    throw new Error("Failed to fetch reviews");
  }
  return res.json(); // array of reviews with .user field
}


export async function getGames() {
    const res = await fetch(`${API_URL}/games`);
    if (!res.ok) throw new Error(`Failed to fetch games: ${res.status} ${res.statusText}`);
    return res.json();
}

export async function fetchUserReviews(userId) {
  const res = await fetch(`${API_URL}/users/${userId}/reviews`, {
    headers: {
      ...authHeaders()
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to load user reviews');
  }
  return res.json();
}
