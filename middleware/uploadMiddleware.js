const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads';
const trainerUploadsDir = path.join(uploadDir, 'trainers');
const vehicleUploadsDir = path.join(uploadDir, 'vehicles');

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(trainerUploadsDir)) {
  fs.mkdirSync(trainerUploadsDir);
}
if (!fs.existsSync(vehicleUploadsDir)) {
  fs.mkdirSync(vehicleUploadsDir);
}

// Storage configuration for trainer profile images
const trainerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, trainerUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'trainer-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Storage configuration for vehicle images
const vehicleStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, vehicleUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'vehicle-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to check file types
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(new Error('Error: Images Only! (jpeg, jpg, png, gif)'));
};

// Create upload objects
const uploadTrainerImage = multer({
  storage: trainerStorage,
  limits: {fileSize: 5000000}, // 5MB file size limit
  fileFilter,
});

const uploadVehicleImageMiddleware = multer({
  storage: vehicleStorage,
  limits: {fileSize: 5000000}, // 5MB file size limit
  fileFilter,
});

module.exports = {
  uploadTrainerImage,
  uploadVehicleImageMiddleware, // Export with the new name
};
