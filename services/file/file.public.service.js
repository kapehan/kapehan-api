const {supabase, bucket} = require('../../configs/supabase.config');

const BUCKET = bucket.public;

async function uploadPublicImage(fileBuffer, fileName, mimetype, filepath) {
  try {
    const upfilename = `${Date.now()}-${fileName}`;
    const upfilePath = `${filepath}/${upfilename}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(upfilePath, fileBuffer, {
        contentType: mimetype,
        upsert: false, // ensure uniqueness
      });

    if (error) throw error;

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${upfilePath}`;
    return { 
      filePath: upfilePath,
      fileName: upfilename,
      url: publicUrl
    };
    
  } catch (error) {
    console.log(error)
    throw new Error(error);
    
  }
}

module.exports = {
  uploadPublicImage,
};
