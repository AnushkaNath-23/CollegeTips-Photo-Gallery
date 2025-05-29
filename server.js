import express from 'express';
import multer from 'multer';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('.'));

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create data directory if it doesn't exist
const dataDir = join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    cb(null, `image-${uniqueSuffix}.${extension}`);
  }
});

const upload = multer({ storage: storage });

// Data file path
const galleryDataPath = join(dataDir, 'galleryData.json');

// Helper function to read gallery data
function readGalleryData() {
  try {
    if (fs.existsSync(galleryDataPath)) {
      const data = fs.readFileSync(galleryDataPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading gallery data:', error);
    return [];
  }
}

// Helper function to write gallery data
function writeGalleryData(data) {
  try {
    fs.writeFileSync(galleryDataPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing gallery data:', error);
    return false;
  }
}

// Routes

// Get all images
app.get('/api/images', (req, res) => {
  const galleryData = readGalleryData();
  res.json(galleryData);
});

// Upload a new image
app.post('/api/images', upload.single('image'), (req, res) => {
  try {
    const { title, category } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const galleryData = readGalleryData();
    
    // Create new image object
    const newImage = {
      id: Date.now(),
      url: `/uploads/${file.filename}`,
      title: title || 'Untitled',
      category: category || 'uncategorized',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      location: 'Campus'
    };
    
    // Add to gallery data
    galleryData.push(newImage);
    
    // Save to file
    writeGalleryData(galleryData);
    
    res.status(201).json(newImage);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload image from data URL
app.post('/api/images/dataurl', (req, res) => {
  try {
    const { dataUrl, title, category } = req.body;
    
    if (!dataUrl) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    // Extract the base64 data from the data URL
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid data URL format' });
    }
    
    const type = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    
    // Determine file extension from mime type
    let extension = 'jpg';
    if (type.includes('png')) extension = 'png';
    if (type.includes('gif')) extension = 'gif';
    if (type.includes('webp')) extension = 'webp';
    
    // Generate unique filename
    const filename = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
    const filepath = join(uploadsDir, filename);
    
    // Write the file
    fs.writeFileSync(filepath, data);
    
    const galleryData = readGalleryData();
    
    // Create new image object
    const newImage = {
      id: Date.now(),
      url: `/uploads/${filename}`,
      title: title || 'Untitled',
      category: category || 'uncategorized',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      location: 'Campus'
    };
    
    // Add to gallery data
    galleryData.push(newImage);
    
    // Save to file
    writeGalleryData(galleryData);
    
    res.status(201).json(newImage);
  } catch (error) {
    console.error('Error uploading image from data URL:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Delete an image
app.delete('/api/images/:id', (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const galleryData = readGalleryData();
    
    // Find the image to delete
    const imageIndex = galleryData.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const image = galleryData[imageIndex];
    
    // Remove the image file if it exists
    if (image.url && image.url.startsWith('/uploads/')) {
      const filename = image.url.replace('/uploads/', '');
      const filepath = join(uploadsDir, filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
    
    // Remove from gallery data
    galleryData.splice(imageIndex, 1);
    
    // Save to file
    writeGalleryData(galleryData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Update image caption
app.put('/api/images/:id', (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const galleryData = readGalleryData();
    
    // Find the image to update
    const imageIndex = galleryData.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Update the title
    galleryData[imageIndex].title = title;
    
    // Save to file
    writeGalleryData(galleryData);
    
    res.json(galleryData[imageIndex]);
  } catch (error) {
    console.error('Error updating image caption:', error);
    res.status(500).json({ error: 'Failed to update image caption' });
  }
});

// Migrate existing localStorage data to server
app.post('/api/migrate', (req, res) => {
  try {
    const { galleryData: localStorageData } = req.body;
    
    if (!localStorageData || !Array.isArray(localStorageData)) {
      return res.status(400).json({ error: 'Invalid gallery data' });
    }
    
    const serverGalleryData = readGalleryData();
    const migratedImages = [];
    
    // Process each image from localStorage
    for (const image of localStorageData) {
      // Skip if image already exists on server (by ID)
      if (serverGalleryData.some(img => img.id === image.id)) {
        continue;
      }
      
      // Handle data URL images
      if (image.url && image.url.startsWith('data:')) {
        // Extract the base64 data from the data URL
        const matches = image.url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          continue;
        }
        
        const type = matches[1];
        const data = Buffer.from(matches[2], 'base64');
        
        // Determine file extension from mime type
        let extension = 'jpg';
        if (type.includes('png')) extension = 'png';
        if (type.includes('gif')) extension = 'gif';
        if (type.includes('webp')) extension = 'webp';
        
        // Generate unique filename
        const filename = `image-${image.id}.${extension}`;
        const filepath = join(uploadsDir, filename);
        
        // Write the file
        fs.writeFileSync(filepath, data);
        
        // Create new image object with server URL
        const newImage = {
          ...image,
          url: `/uploads/${filename}`
        };
        
        serverGalleryData.push(newImage);
        migratedImages.push(newImage);
      }
    }
    
    // Save to file
    writeGalleryData(serverGalleryData);
    
    res.json({ 
      success: true, 
      migratedCount: migratedImages.length,
      totalCount: serverGalleryData.length 
    });
  } catch (error) {
    console.error('Error migrating gallery data:', error);
    res.status(500).json({ error: 'Failed to migrate gallery data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});