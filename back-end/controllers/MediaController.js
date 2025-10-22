const Media = require('../models/Media');
const Setting = require('../models/Setting');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const multer = require('multer');
const { promisify } = require('util');

// Cache for settings to reduce database queries
const settingsCache = {
  values: {},
  expiryTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  timestamps: {},
  
  async get(key, group, defaultValue) {
    const cacheKey = `${group}:${key}`;
    const now = Date.now();
    
    // Return cached value if it exists and hasn't expired
    if (this.values[cacheKey] !== undefined && 
        now - this.timestamps[cacheKey] < this.expiryTime) {
      return this.values[cacheKey];
    }
    
    // Otherwise fetch from database and cache
    const value = await Setting.getValue(key, group, defaultValue);
    
    this.values[cacheKey] = value;
    this.timestamps[cacheKey] = now;
    
    return value;
  },
  
  clear() {
    this.values = {};
    this.timestamps = {};
  }
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fsSync.existsSync(uploadsDir)) {
  fsSync.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // Create date-based folder
    const now = new Date();
    const dateFolder = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const uploadPath = path.join(uploadsDir, dateFolder);
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Create multer upload middleware with dynamic file size limit
const createUploadMiddleware = async () => {
  const maxFileSize = await settingsCache.get('MEDIA_MAX_FILE_SIZE', 'SYSTEM', 5); // Default to 5MB
  
  return multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: parseInt(maxFileSize) * 1024 * 1024
    }
  });
};

// Create upload middleware with default limit for immediate use
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        result: null, 
        message: 'No file uploaded' 
      });
    }
    
    // Check file size limit from settings (using cache)
    const maxFileSize = await settingsCache.get('MEDIA_MAX_FILE_SIZE', 'MEDIA', 5); // Default to 5MB
    const maxFileSizeBytes = parseInt(maxFileSize) * 1024 * 1024;
    
    if (req.file.size > maxFileSizeBytes) {
      // Delete the uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn('Could not delete uploaded file:', unlinkError);
      }
      
      return res.status(400).json({ 
        result: null, 
        message: `File size exceeds limit of ${maxFileSize}MB` 
      });
    }

    // Use local storage directly
    const relativePath = path.relative(uploadsDir, req.file.path);
    const dateFolder = path.dirname(relativePath);
    
    const mediaData = {
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${dateFolder}/${req.file.filename}`,
      storage_type: 'local',
      created_by: req.user ? req.user.id : null
    };

    // Create media record and return it directly without additional query
    const mediaId = await Media.create(mediaData);
    
    // Return the media data directly instead of fetching it again
    // This saves an extra database query
    mediaData.id = mediaId;
    
    res.status(200).json({
      result: mediaData,
      message: null
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ 
      result: null, 
      message: 'Lỗi khi tải file' 
    });
  }
};

const getMediaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use a more efficient query with proper error handling
    const media = await Media.findById(id);
    
    if (!media) {
      return res.status(404).json({ 
        result: null, 
        message: 'Không tìm thấy file' 
      });
    }
    
    // Add cache headers for better client-side caching
    res.set({
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'ETag': `"${media.id}-${media.modified_at || media.created_at}"`
    });
    
    res.status(200).json({
      result: media,
      message: null
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ 
      result: null, 
      message: 'Lỗi khi tải file' 
    });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get media info before deletion to remove file
    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ 
        result: null, 
        message: 'Không tìm thấy file' 
      });
    }
    
    // Delete from local filesystem
    if (media.path) {
      try {
        await fs.unlink(media.path);
        console.log(`Deleted file from local storage: ${media.path}`);
      } catch (fileError) {
        console.warn('Could not delete file from filesystem:', fileError);
      }
    }
    
    // Soft delete media record
    const deleted = await Media.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ 
        result: null, 
        message: 'Không tìm thấy file' 
      });
    }
    
    res.status(200).json({
      result: true,
      message: null
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ 
      result: null, 
      message: 'Lỗi khi xóa file' 
    });
  }
};

// Function to clear settings cache (useful for testing or when settings change)
const clearSettingsCache = () => {
  settingsCache.clear();
  console.log('Settings cache cleared');
};

module.exports = {
  upload,
  createUploadMiddleware,
  uploadMedia,
  getMediaById,
  deleteMedia,
  clearSettingsCache // Export for potential use in tests or admin functions
};
