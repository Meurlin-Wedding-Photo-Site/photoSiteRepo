const form = document.getElementById("upload-form");
const statusEl = document.getElementById("status");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "uploading?";
  const fd = new FormData(form);
  const files = form.elements["photos"]?.files || [];
  if (!files.length) { statusEl.textContent = "pick at least one photo."; return; }
  for (const f of files) fd.append("photos", f);
  try {
    const r = await fetch("/api/upload", { method:"POST", body: fd });
    if (!r.ok) throw new Error("upload failed");
    const data = await r.json();
    statusEl.textContent = `thanks! uploaded ${data.count} photo${data.count===1?"":"s"}.`;
    form.reset();
  } catch {
    statusEl.textContent = "error uploading. try again.";
  }
});
