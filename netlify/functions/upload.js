// netlify/functions/upload.js
const { Readable } = require("stream");
const multiparty = require("multiparty");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "method not allowed" };
  }

  const contentType =
    event.headers["content-type"] || event.headers["Content-Type"] || "";
  if (!/^multipart\/form-data/i.test(contentType)) {
    return { statusCode: 400, body: "content-type must be multipart/form-data" };
  }

  // convert lambda body → stream for multiparty
  const bodyBuffer = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64")
    : Buffer.from(event.body || "");

  const req = new Readable();
  req._read = () => {};
  req.headers = { "content-type": contentType };
  req.push(bodyBuffer);
  req.push(null);

  const MAX_SIZE = 15 * 1024 * 1024; // 15mb
  const MAX_FILES = 20;

  try {
    const result = await new Promise((resolve) => {
      const form = new multiparty.Form({ maxFilesSize: MAX_SIZE });

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error(err);
          return resolve({ ok: false, code: 400, body: "bad form data" });
        }

        // invite-code gate
        const required = process.env.INVITE_CODE || "";
        const supplied = (fields?.code?.[0] || "").trim();
        if (required && supplied !== required) {
          return resolve({ ok: false, code: 403, body: "bad code" });
        }

        const name = fields?.name?.[0] || "";
        const caption = fields?.caption?.[0] || "";
        const folder  = process.env.CLOUDINARY_FOLDER || "wedding";
        const baseTag = process.env.CLOUDINARY_TAG    || "wedding_photo";

        try {
          const items = (files?.photos || []).slice(0, MAX_FILES);
          const seen = new Set(); // dedupe within request
          let count = 0;

          for (const f of items) {
            const ct = f.headers?.["content-type"] || "";
            if (!/^image\//i.test(ct)) continue;
            if (f.size > MAX_SIZE) continue;

            const key = `${f.originalFilename}|${f.size}`;
            if (seen.has(key)) continue;
            seen.add(key);

            await cloudinary.uploader.upload(f.path, {
              folder,
              tags: [baseTag],           // no moderation: one tag only
              context: { name, caption },
            });
            count++;
          }

          resolve({ ok: true, code: 200, body: JSON.stringify({ count }) });
        } catch (e) {
          console.error(e);
          resolve({ ok: false, code: 500, body: "upload error" });
        }
      });
    });

    return {
      statusCode: result.code,
      headers: result.ok ? { "content-type": "application/json" } : undefined,
      body: result.body,
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: "server error" };
  }
};
