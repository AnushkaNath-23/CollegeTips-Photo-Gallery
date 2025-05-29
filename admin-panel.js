// Admin Panel for Image Upload
import { galleryData } from './data.js';
import { saveGalleryDataToStorage } from './script.js';

// DOM Elements for Admin Panel
let adminPanel = null;
let isAdminPanelCreated = false;

// Function to check if admin mode should be activated
export function checkForAdminMode(searchQuery) {
  if (searchQuery.toLowerCase() === 'tipsyadmin') {
    createAdminPanel();
  } // else if (adminPanel && adminPanel.style.display === 'block') {
  //   // Hide admin panel if it's visible and search query is not 'tipsyadmin'
  //   adminPanel.style.display = 'none';
  // }
}

// Create the admin panel
function createAdminPanel() {
  // If admin panel already exists, just show it
  if (isAdminPanelCreated) {
    adminPanel.style.display = 'block';
    return;
  }

  // Create admin panel container
  adminPanel = document.createElement('div');
  adminPanel.className = 'admin-panel';
  adminPanel.innerHTML = `
    <div class="admin-panel-header">
      <h2>Admin Panel</h2>
      <button id="close-admin-panel" class="btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="admin-panel-content">
      <div class="admin-tabs">
        <button id="upload-tab" class="tab-btn active">Upload Images</button>
        <button id="manage-tab" class="tab-btn">Manage Gallery</button>
      </div>
      <div id="upload-panel" class="tab-panel">
        <form id="image-upload-form">
          <div class="form-group">
            <label for="image-title">Caption</label>
            <input type="text" id="image-title">
          </div>
          <div class="form-group">
            <label for="image-category">Category</label>
            <select id="image-category" required>
              <option value="">Select a category</option>
              <option value="team-vibes">Team Vibes</option>
              <option value="creative-campaigns">Creative Campaigns</option>
              <option value="work-hard-play-hard">Work Hard, Play Hard</option>
              <option value="behind-the-scenes">Behind-the-Scenes</option>
              <option value="add-new-category">+ Add New Category</option>
            </select>
          </div>
          <div class="form-group hidden" id="new-category-group">
            <label for="new-category">New Category Name</label>
            <input type="text" id="new-category" placeholder="e.g. study-sessions">
          </div>
          <div class="form-group">
            <label for="image-file">Upload Image</label>
            <input type="file" id="image-file" accept="image/*" required>
            <div class="image-preview" id="image-preview"></div>
          </div>
          <button type="submit" class="btn">Add to Gallery</button>
        </form>
      </div>
      <div id="manage-panel" class="tab-panel hidden">
        <h3>Manage Gallery Images</h3>
        <div id="gallery-manager" class="gallery-manager">
          <!-- Images will be loaded here -->
        </div>
      </div>
    </div>
  `;

  // Add admin panel to the page
  document.querySelector('main').appendChild(adminPanel);
  isAdminPanelCreated = true;

  // Set up event listeners for admin panel
  setupAdminPanelEvents();
}

// Set up event listeners for admin panel
function setupAdminPanelEvents() {
  // Close admin panel
  document.getElementById('close-admin-panel').addEventListener('click', () => {
    adminPanel.style.display = 'none';
    // Clear search input
    document.getElementById('search-input').value = '';
    clearSearchBtn.classList.add('hidden');
  });

  // Tab switching
  const uploadTab = document.getElementById('upload-tab');
  const manageTab = document.getElementById('manage-tab');
  const uploadPanel = document.getElementById('upload-panel');
  const managePanel = document.getElementById('manage-panel');

  uploadTab.addEventListener('click', () => {
    uploadTab.classList.add('active');
    manageTab.classList.remove('active');
    uploadPanel.classList.remove('hidden');
    managePanel.classList.add('hidden');
  });

  manageTab.addEventListener('click', () => {
    manageTab.classList.add('active');
    uploadTab.classList.remove('active');
    managePanel.classList.remove('hidden');
    uploadPanel.classList.add('hidden');
    loadGalleryManager();
  });

  // Handle category selection
  document.getElementById('image-category').addEventListener('change', (e) => {
    const newCategoryGroup = document.getElementById('new-category-group');
    if (e.target.value === 'add-new-category') {
      newCategoryGroup.classList.remove('hidden');
    } else {
      newCategoryGroup.classList.add('hidden');
    }
  });

  // Image preview
  document.getElementById('image-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const previewDiv = document.getElementById('image-preview');
        previewDiv.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });

  // Form submission
  document.getElementById('image-upload-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addNewImage();
  });
}

// Add new image to gallery
function addNewImage() {
  // Get form values
  const title = document.getElementById('image-title').value;
  let category = document.getElementById('image-category').value;
  const fileInput = document.getElementById('image-file');
  
  // Validate form inputs
  if (!title || !category || !fileInput.files[0]) {
    alert('Please fill in all fields and select an image.');
    return;
  }
  
  // Check if adding new category
  if (category === 'add-new-category') {
    const newCategory = document.getElementById('new-category').value;
    if (!newCategory) {
      alert('Please enter a new category name.');
      return;
    }
    category = newCategory;
    
    // Add new category button if it doesn't exist
    if (!document.querySelector(`.category-btn[data-category="${category}"]`)) {
      const displayName = category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      const button = document.createElement('button');
      button.className = 'category-btn';
      button.dataset.category = category;
      button.textContent = displayName;
      
      // Add event listener to the new button
      button.addEventListener('click', () => {
        activeCategory = category;
        document.querySelectorAll('.category-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.category === activeCategory);
        });
        filterImages();
      });
      
      categoriesWrapper.appendChild(button);
      
      // Add option to the select dropdown for future uploads
      const option = document.createElement('option');
      option.value = category;
      option.textContent = displayName;
      const selectElement = document.getElementById('image-category');
      selectElement.insertBefore(option, selectElement.lastElementChild);
    }
  }
  
  // Get the file
  const file = fileInput.files[0];
  
  try {
    // Convert the image to a data URL for persistent storage
    const reader = new FileReader();
    reader.onload = function(event) {
      const imageDataUrl = event.target.result;
      
      // Create new image object
      const newImage = {
        id: Date.now(), // Use timestamp for unique ID
        url: imageDataUrl, // Store as data URL instead of object URL
        title: title,
        category: category,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        location: 'Campus'
      };
      
      // Add to gallery data
      galleryData.push(newImage);
      
      // Save to localStorage
      saveGalleryDataToStorage();
      
      // Reset form
      document.getElementById('image-upload-form').reset();
      document.getElementById('image-preview').innerHTML = '';
      document.getElementById('new-category-group').classList.add('hidden');
      
      // Update gallery
      filterImages();
      loadGalleryManager();
      
      // Show success message
      alert('Image added successfully!');
    };
    
    reader.onerror = function() {
      alert('Error reading the image file. Please try again.');
    };
    
    // Read the file as a data URL
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error adding image:', error);
    alert('An error occurred while adding the image. Please try again.');
  }
}

// Load gallery manager with all images and edit/delete buttons
function loadGalleryManager() {
  const galleryManager = document.getElementById('gallery-manager');
  galleryManager.innerHTML = '';
  
  if (galleryData.length === 0) {
    galleryManager.innerHTML = '<p>No images in the gallery.</p>';
    return;
  }
  
  // Create a grid of images with edit and delete buttons
  galleryData.forEach(image => {
    const imageCard = document.createElement('div');
    imageCard.className = 'manager-image-card';
    imageCard.dataset.id = image.id;
    
    imageCard.innerHTML = `
      <div class="manager-image-container">
        <img src="${image.url}" alt="${image.title}">
      </div>
      <div class="manager-image-info">
        <h4 class="image-title" data-id="${image.id}">${image.title}</h4>
        <span class="category-badge">${image.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
        <div class="manager-image-actions">
          <button class="edit-image-btn" data-id="${image.id}">
            Edit
          </button>
          <button class="delete-image-btn" data-id="${image.id}">
            Delete
          </button>
        </div>
      </div>
    `;
    
    galleryManager.appendChild(imageCard);
  });
  
  // Add event listeners to edit buttons
  document.querySelectorAll('.edit-image-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const imageId = parseInt(e.currentTarget.dataset.id);
      editImageCaption(imageId);
    });
  });
  
  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-image-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const imageId = parseInt(e.currentTarget.dataset.id);
      deleteImage(imageId);
    });
  });
}

// Delete an image from the gallery
function deleteImage(imageId) {
  if (confirm('Are you sure you want to delete this image?')) {
    // Find the index of the image in the gallery data
    const imageIndex = galleryData.findIndex(image => image.id === imageId);
    
    if (imageIndex !== -1) {
      // Remove the image from the gallery data
      galleryData.splice(imageIndex, 1);
      
      // Save changes to localStorage
      saveGalleryDataToStorage();
      
      // Update the gallery
      filterImages();
      loadGalleryManager();
      
      // Show success message
      alert('Image deleted successfully!');
    }
  }
}

// Edit image caption
function editImageCaption(imageId) {
  // Find the image in the gallery data
  const imageIndex = galleryData.findIndex(image => image.id === imageId);
  
  if (imageIndex !== -1) {
    const image = galleryData[imageIndex];
    
    // Prompt for new caption
    const newCaption = prompt('Edit image caption:', image.title);
    
    // Update if user didn't cancel and provided a non-empty caption
    if (newCaption !== null && newCaption.trim() !== '') {
      // Update the image title
      image.title = newCaption.trim();
      
      // Save changes to localStorage
      saveGalleryDataToStorage();
      
      // Update the gallery
      filterImages();
      loadGalleryManager();
      
      // Show success message
      alert('Caption updated successfully!');
    }
  }
}

// Modify the existing filterImages function to check for admin mode
// const originalFilterImages = window.filterImages;
// window.filterImages = function() {
//   const searchQuery = searchInput.value.toLowerCase().trim();
//   
//   // Check for admin mode
//   checkForAdminMode(searchQuery);
//   
//   // If it's admin mode, don't actually filter
//   if (searchQuery === 'tipsyadmin') {
//     return;
//   }
//   
//   // Otherwise, proceed with normal filtering
//   originalFilterImages();
// };