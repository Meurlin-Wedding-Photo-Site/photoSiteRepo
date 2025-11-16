const el = document.getElementById("gallery");
(async () => {
  el.textContent = "loading?";
  try {
    const r = await fetch("/api/photos");
    if (!r.ok) throw new Error();
    const photos = await r.json();
    if (!photos.length) { el.textContent = "no photos yet."; return; }
    const frag = document.createDocumentFragment();
    for (const p of photos) {
      const card = document.createElement("div"); card.className = "photo-card";
      const img = document.createElement("img");
      img.src = p.url.replace("/upload/", "/upload/w_800,q_auto,f_auto/");
      img.alt = p.caption || "wedding photo";
      const meta = document.createElement("div"); meta.className = "photo-meta";
      meta.textContent = [p.name, p.caption].filter(Boolean).join(" ? ");
      card.append(img, meta); frag.append(card);
    }
    el.innerHTML = ""; el.append(frag);
  } catch { el.textContent = "could not load photos rn."; }
})();
