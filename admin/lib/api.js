export async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "include", // cookie jwt হলে দরকার
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Request failed");
  }

  return res.json();
}
