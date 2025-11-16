const cloudinary = require("cloudinary").v2;
const multiparty = require("multiparty");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "method not allowed" };

  return new Promise((resolve) => {
    const form = new multiparty.Form();
    form.parse(event, async (err, fields, files) => {
      if (err) return resolve({ statusCode: 400, body: "bad form data" });

      const name = fields.name?.[0] || "";
      const caption = fields.caption?.[0] || "";
      const folder = process.env.CLOUDINARY_FOLDER || "wedding";
      const baseTag = process.env.CLOUDINARY_TAG || "wedding_photo";

      try {
        const uploads = (files.photos || []).slice(0, 20);
        let count = 0;
        for (const f of uploads) {
          const ct = f.headers?.["content-type"] || "";
          if (!/^image\//i.test(ct)) continue;
          if (f.size > 15 * 1024 * 1024) continue; // 15mb cap
          await cloudinary.uploader.upload(f.path, {
            folder,
            tags: [baseTag],
            context: { name, caption },
          });
          count++;
        }
        resolve({ statusCode: 200, body: JSON.stringify({ count }) });
      } catch (e) {
        console.error(e);
        resolve({ statusCode: 500, body: "upload error" });
      }
    });
  });
};
