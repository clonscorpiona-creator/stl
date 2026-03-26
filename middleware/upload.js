const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Settings = require('../models/Settings');

// Создаём директорию для загрузок
const uploadDir = path.join(__dirname, '../public/uploads/works');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройки хранения
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize filename - remove any potentially dangerous characters
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    cb(null, uniqueSuffix + safeExt);
  }
});

// Magic numbers for image file validation
const MAGIC_NUMBERS = {
  'jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffdb'],
  'jpg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffdb'],
  'png': ['89504e470d0a1a0a'],
  'gif': ['474946383761', '474946383961'], // GIF87a, GIF89a
  'webp': ['52494646'] // RIFF (WebP uses RIFF container)
};

// Проверка магических чисел файла
function validateMagicNumber(buffer, extension) {
  if (!buffer || buffer.length < 8) return false;

  const hex = buffer.toString('hex', 0, 8).toLowerCase();
  const ext = extension.toLowerCase();

  // Special handling for WebP - check RIFF header and WEBP signature
  if (ext === 'webp') {
    return hex.startsWith('52494646') && buffer.toString('utf8', 8, 12) === 'WEBP';
  }

  const allowedMagic = MAGIC_NUMBERS[ext] || [];
  return allowedMagic.some(magic => hex.startsWith(magic));
}

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (!extname || !mimetype) {
    return cb(new Error('Только изображения (jpeg, jpg, png, gif, webp)'));
  }

  cb(null, true);
};

// Post-upload validator - call this after multer processes the file
async function validateUploadedFile(file) {
  if (!file || !file.path) return true;

  return new Promise((resolve, reject) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

    // Read first 12 bytes for magic number check
    fs.open(file.path, 'r', (err, fd) => {
      if (err) return reject(err);

      const buffer = Buffer.alloc(12);
      fs.read(fd, buffer, 0, 12, 0, (readErr, bytesRead, data) => {
        fs.close(fd);

        if (readErr) return reject(readErr);

        if (!validateMagicNumber(data, ext)) {
          // Delete invalid file
          fs.unlinkSync(file.path);
          reject(new Error('Неверный формат файла. Пожалуйста, загрузите действительное изображение.'));
        } else {
          resolve(true);
        }
      });
    });
  });
}

// Factory function to create upload middleware with dynamic limit
async function createUploader() {
  const maxFileSizeMB = await Settings.get('max_file_size_mb') || 10;

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxFileSizeMB * 1024 * 1024 }
  });
}

// Helper middleware for validation
const validateUpload = async (req, res, next) => {
  try {
    if (req.file) {
      await validateUploadedFile(req.file);
    }
    next();
  } catch (err) {
    // Store error message on request for controller to handle
    req.fileValidationError = err.message;
    // Delete the invalid file
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next();
  }
};

// Export both the factory function and a default instance for backward compatibility
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Default 10MB for backward compatibility
});

module.exports = upload;
module.exports.createUploader = createUploader;
module.exports.validateUpload = validateUpload;
