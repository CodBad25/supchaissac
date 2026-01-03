require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

(async () => {
  const result = await s3.send(new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET_NAME,
    Prefix: 'sessions/',
  }));
  
  console.log('Fichiers sur S3:');
  if (!result.Contents || result.Contents.length === 0) {
    console.log('  (aucun fichier)');
  } else {
    result.Contents.forEach(obj => console.log('  ' + obj.Key + ' (' + obj.Size + ' bytes)'));
  }
})();
