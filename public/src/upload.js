// public/src/upload.js
const form = document.getElementById("upload-form");
const statusEl = document.getElementById("status");
let busy = false;

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busy) return;
  busy = true;

  statusEl.textContent = "uploading…";

  const fd = new FormData(form); // includes code, name, caption, files

  try {
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.status === 403) {
      statusEl.textContent = "wrong invite code.";
      return;
    }
    if (!res.ok) throw new Error("upload failed");
    const { count = 0 } = await res.json();
    statusEl.textContent = `thanks! uploaded ${count} photo${count === 1 ? "" : "s"}.`;
    form.reset();
  } catch (err) {
    statusEl.textContent = "error uploading. try again.";
  } finally {
    busy = false;
  }
});
