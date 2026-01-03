const { supabase, bucket } = require("../../helpers/supabaseRoleConfig");

const BUCKET = bucket.public;

async function uploadPublicImage(fileBuffer, fileName, filepath) {
  try {
    if (typeof fileName !== "string") {
      throw new Error("fileName must be a string");
    }

    // Sanitize filename: replace spaces, remove non-ASCII, remove special chars
    const sanitize = (name) =>
      name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9\-_.]/g, "") // keep only safe chars
        .toLowerCase();

    const upfilename = `${Date.now()}-${sanitize(fileName)}`;
    const upfilePath = `${filepath}/${upfilename}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(upfilePath, fileBuffer, {
        contentType: "application/octet-stream",
        upsert: true,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(upfilePath);

    return {
      filePath: upfilePath,
      fileName: upfilename,
      url: publicData.publicUrl,
    };
  } catch (error) {
    console.error("Upload failed:", error.message || error);
    throw new Error(error.message || "Upload failed");
  }
}

module.exports = {
  uploadPublicImage,
};
