// Gallery data with images organized by categories
// Starting with an empty array - images will be loaded from the server
const galleryData = [];

// Export galleryData for use in other modules
export { galleryData };

// Function to load gallery data from the server
export async function loadGalleryDataFromServer() {
  try {
    const response = await fetch('/api/images');
    if (!response.ok) {
      throw new Error(`Failed to fetch gallery data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Clear the existing galleryData array
    galleryData.length = 0;
    
    // Push all items from server data to galleryData
    data.forEach(item => galleryData.push(item));
    
    // Return the data for any additional processing
    return data;
  } catch (error) {
    console.error('Error loading gallery data from server:', error);
    
    // Fallback to localStorage if server request fails
    const savedGallery = localStorage.getItem('galleryData');
    if (savedGallery) {
      try {
        // Parse the saved data and assign it to galleryData
        const parsedData = JSON.parse(savedGallery);
        
        // Clear the existing galleryData array
        galleryData.length = 0;
        
        // Push all items from parsed data to galleryData
        parsedData.forEach(item => galleryData.push(item));
        
        // Attempt to migrate localStorage data to server
        migrateLocalStorageDataToServer(parsedData);
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
      }
    }
    
    return galleryData;
  }
}

// Function to save gallery data to the server
async function saveImageToServer(imageData) {
  try {
    // If the image is a data URL, use the dataurl endpoint
    if (imageData.url && imageData.url.startsWith('data:')) {
      const response = await fetch('/api/images/dataurl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataUrl: imageData.url,
          title: imageData.title,
          category: imageData.category
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save image: ${response.status}`);
      }
      
      return await response.json();
    } else {
      // For other types of image data (not implemented in this version)
      console.error('Non-data URL images not supported in this version');
      return null;
    }
  } catch (error) {
    console.error('Error saving image to server:', error);
    return null;
  }
}

// Function to delete an image from the server
async function deleteImageFromServer(imageId) {
  try {
    const response = await fetch(`/api/images/${imageId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting image from server:', error);
    return { success: false };
  }
}

// Function to update an image caption on the server
async function updateImageCaptionOnServer(imageId, title) {
  try {
    const response = await fetch(`/api/images/${imageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update image caption: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating image caption on server:', error);
    return null;
  }
}

// Function to migrate localStorage data to server
async function migrateLocalStorageDataToServer(localStorageData) {
  try {
    const response = await fetch('/api/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ galleryData: localStorageData })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to migrate data: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`Successfully migrated ${result.migratedCount} images to server`);
    
    // Clear localStorage after successful migration
    if (result.success && result.migratedCount > 0) {
      localStorage.removeItem('galleryData');
    }
    
    return result;
  } catch (error) {
    console.error('Error migrating data to server:', error);
    return { success: false };
  }
}

// Images will be loaded from the server when the page loads
// and will persist until removed by the user