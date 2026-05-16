const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dfq6x5d7k',
  api_key: process.env.CLOUDINARY_API_KEY || '762711959847899',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Ie65DXlSsTxw-dwNow3nMOET0zI='
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flowdesk_attachments',
    resource_type: 'auto'
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
