const {supabase, bucket} = require('../../configs/supabase.config');

const BUCKET = bucket.private;

async function uploadImage(fileBuffer, upfilename, filepath, mimetype) {
  const upfilepath = `${filepath}/${upfilename}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(upfilepath, fileBuffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) throw error;
  return {
    ...data,
    fileName: upfilename,
    filePath: upfilepath
  };
}

async function createSignedUrl(filename, expiresIn = 60) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filename, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

async function getSignedPhotoUrl(filename, expiresIn = 300) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filename, expiresIn); // expiresIn = seconds (default 5 min)

  if (error) throw error;
  return data.signedUrl;
}

module.exports = {
  uploadImage,
  createSignedUrl,
  getSignedPhotoUrl
};
