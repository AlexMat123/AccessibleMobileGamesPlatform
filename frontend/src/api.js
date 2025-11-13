export const API_URL = "http://localhost:5000/api";

export const registerUser = async (username, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
};

export const loginUser = async (username, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
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
