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
