// public/src/upload.js
const form = document.getElementById("upload-form");
const statusEl = document.getElementById("status");
let busy = false;

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busy) return; // block double clicks / enter spam
  busy = true;

  statusEl.textContent = "uploading…";

  // IMPORTANT: this already includes the <input name="photos" multiple>
  const fd = new FormData(form);

  try {
    const res = await fetch("/api/upload", { method: "POST", body: fd });
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
