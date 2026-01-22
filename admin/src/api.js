const withTimestamp = (url) => `${url}${url.includes("?") ? "&" : "?"}ts=${Date.now()}`;

export async function fetchWorks() {
  const res = await fetch(withTimestamp("/api/works/"));
  if (!res.ok) throw new Error("failed");
  return res.json();
}

export async function fetchWork(slug) {
  const res = await fetch(withTimestamp(`/api/works/${encodeURIComponent(slug)}/`));
  if (!res.ok) throw new Error("failed");
  return res.json();
}

export async function saveWork(payload) {
  const res = await fetch("/api/works/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "save failed");
  }
  return res.json();
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload/", {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "upload failed");
  }
  const data = await res.json();
  return data.url;
}
