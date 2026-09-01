import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Store uploaded files in memory for direct stream processing
const storage = multer.memoryStorage();

export const uploadPdfMiddleware = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents (.pdf) are allowed for upload.'));
    }
  },
});
