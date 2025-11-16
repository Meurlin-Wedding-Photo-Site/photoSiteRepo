// netlify/functions/photos.js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async () => {
  try {
    const baseTag = process.env.CLOUDINARY_TAG || "wedding_photo";

    const r = await cloudinary.search
      .expression(`tags=${baseTag}`)        // show ALL uploads (no moderation)
      .sort_by("created_at", "desc")
      .max_results(1000)
      .execute();

    const photos = (r.resources || []).map(x => ({
      url: x.secure_url,
      created_at: x.created_at,
      name: x.context?.custom?.name || "",
      caption: x.context?.custom?.caption || "",
    }));

    return { statusCode: 200, body: JSON.stringify(photos) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: "error fetching photos" };
  }
};
