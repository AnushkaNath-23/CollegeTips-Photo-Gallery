// Import galleryData from data.js
import { galleryData } from './data.js';
// Import admin panel functionality
import { checkForAdminMode } from './admin-panel.js';

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid');
const categoriesWrapper = document.querySelector('.categories-wrapper');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const resetFiltersBtn = document.getElementById('reset-filters');
const noResultsDiv = document.getElementById('no-results');
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalCategory = document.getElementById('modal-category');
const modalDescription = document.getElementById('modal-description');
const modalDate = document.getElementById('modal-date');
const modalLocation = document.getElementById('modal-location');
const modalClose = document.querySelector('.modal-close');
const modalOverlay = document.querySelector('.modal-overlay');
const modalPrev = document.querySelector('.modal-nav.prev');
const modalNext = document.querySelector('.modal-nav.next');
const modalDownload = document.getElementById('modal-download');
const modalShare = document.getElementById('modal-share');
const currentYearSpan = document.getElementById('current-year');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');

// Set current year in footer
currentYearSpan.textContent = new Date().getFullYear();

// State variables
let filteredImages = [];
let activeCategory = 'all';
let currentImageIndex = 0;
let likedImages = new Set();

// Load gallery data from localStorage if available
function loadGalleryDataFromStorage() {
  const savedGallery = localStorage.getItem('galleryData');
  if (savedGallery) {
    // Parse the saved data and assign it to galleryData
    const parsedData = JSON.parse(savedGallery);
    
    // Clear the existing galleryData array
    galleryData.length = 0;
    
    // Push all items from parsed data to galleryData
    parsedData.forEach(item => galleryData.push(item));
  }
  
  // Initialize filtered images
  filteredImages = [...galleryData];
}

// Save gallery data to localStorage
export function saveGalleryDataToStorage() {
  localStorage.setItem('galleryData', JSON.stringify(galleryData));
}

// Initialize gallery after a brief loading delay
setTimeout(() => {
  initializeGallery();
}, 1500);

// Initialize gallery
function initializeGallery() {
  // Clear loading skeleton
  galleryGrid.innerHTML = '';
  
  // Load gallery data from localStorage
  loadGalleryDataFromStorage();
  
  // Create and add category buttons
  createCategoryButtons();
  
  // Render all images initially
  renderGalleryImages(galleryData);
  
  // Set up event listeners
  setupEventListeners();
}

// Create category filter buttons
function createCategoryButtons() {
  // Clear existing category buttons
  categoriesWrapper.innerHTML = '';
  
  // Get unique categories - start with default categories even if gallery is empty
  let defaultCategories = ['all', 'team-vibes', 'creative-campaigns', 'work-hard-play-hard', 'behind-the-scenes'];
  
  // Add any additional categories from uploaded images
  if (galleryData.length > 0) {
    const uploadedCategories = new Set(galleryData.map(img => img.category));
    defaultCategories = [...new Set([...defaultCategories, ...uploadedCategories])];
  }
  
  // Create a button for each category
  defaultCategories.forEach(category => {
    const button = document.createElement('button');
    button.className = `category-btn ${category === 'all' ? 'active' : ''}`;
    button.dataset.category = category;
    
    // Format category name for display
    const displayName = category === 'all' 
      ? 'All Photos' 
      : category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    button.textContent = displayName;
    categoriesWrapper.appendChild(button);
  });
}

// Render gallery images based on filters
function renderGalleryImages(images) {
  // Clear gallery
  galleryGrid.innerHTML = '';
  
  // Show no results message if no images
  if (images.length === 0) {
    noResultsDiv.classList.remove('hidden');
    return;
  }
  
  // Hide no results message
  noResultsDiv.classList.add('hidden');
  
  // Create and append image cards
  images.forEach((image, index) => {
    const card = createImageCard(image, index);
    galleryGrid.appendChild(card);
  });
}

// Create image card element
function createImageCard(image, index) {
  const card = document.createElement('div');
  card.className = 'gallery-card';
  card.dataset.index = index;
  
  const imgContainer = document.createElement('div');
  imgContainer.className = 'gallery-card-img-container';
  
  const img = document.createElement('img');
  img.className = 'gallery-card-img';
  img.src = image.url;
  img.alt = image.title;
  img.loading = 'lazy';
  
  const overlay = document.createElement('div');
  overlay.className = 'gallery-card-overlay';
  
  // Format category name for display
  const categoryDisplay = image.category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  overlay.innerHTML = `
    <h3 class="gallery-card-title">${image.title}</h3>
    <div class="gallery-card-actions">
      <span class="category-badge">${categoryDisplay}</span>
      <div class="action-buttons">
        <button class="action-button like-button" data-id="${image.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <button class="action-button share-button" data-id="${image.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  imgContainer.appendChild(img);
  card.appendChild(imgContainer);
  card.appendChild(overlay);
  
  // Event listener for opening modal
  card.addEventListener('click', (e) => {
    // Don't open modal if clicking on like or share button
    if (e.target.closest('.action-button')) return;
    
    openImageModal(image, index);
  });
  
  return card;
}

// Set up event listeners
function setupEventListeners() {
  // Category filter buttons
  document.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', () => {
      // Update active category
      activeCategory = button.dataset.category;
      
      // Update active button styling
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === activeCategory);
      });
      
      // Filter images
      filterImages();
    });
  });
  
  // Search input
  searchInput.addEventListener('input', () => {
    // Show/hide clear button
    clearSearchBtn.classList.toggle('hidden', !searchInput.value);
    
    // Check for admin mode before filtering
    checkForAdminMode(searchInput.value);
    
    // Filter images
    filterImages();
  });
  
  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    filterImages();
  });
  
  // Reset filters button
  resetFiltersBtn.addEventListener('click', () => {
    // Reset category
    activeCategory = 'all';
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === 'all');
    });
    
    // Reset search
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    
    // Reset filters
    filterImages();
  });
  
  // Modal close button and overlay
  modalClose.addEventListener('click', closeImageModal);
  modalOverlay.addEventListener('click', closeImageModal);
  
  // Modal navigation
  modalPrev.addEventListener('click', () => navigateModal('prev'));
  modalNext.addEventListener('click', () => navigateModal('next'));
  
  // Modal download and share buttons
  modalDownload.addEventListener('click', handleDownload);
  modalShare.addEventListener('click', handleShare);
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!imageModal.classList.contains('open')) return;
    
    if (e.key === 'Escape') closeImageModal();
    if (e.key === 'ArrowLeft') navigateModal('prev');
    if (e.key === 'ArrowRight') navigateModal('next');
  });
  
  // Like and share buttons on cards
  document.addEventListener('click', (e) => {
    // Like button
    if (e.target.closest('.like-button')) {
      e.stopPropagation();
      const button = e.target.closest('.like-button');
      const imageId = parseInt(button.dataset.id);
      toggleLike(imageId, button);
    }
    
    // Share button
    if (e.target.closest('.share-button')) {
      e.stopPropagation();
      const imageId = parseInt(e.target.closest('.share-button').dataset.id);
      const image = galleryData.find(img => img.id === imageId);
      handleShare(image);
    }
  });
  
  // Mobile menu toggle
  mobileMenuToggle.addEventListener('click', () => {
    const nav = document.querySelector('.main-nav');
    nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
    
    // Animate hamburger to X
    const spans = mobileMenuToggle.querySelectorAll('span');
    spans[0].style.transform = spans[0].style.transform ? '' : 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = spans[1].style.opacity === '0' ? '1' : '0';
    spans[2].style.transform = spans[2].style.transform ? '' : 'rotate(-45deg) translate(5px, -5px)';
  });
}

// Filter images based on category and search query
function filterImages() {
  const searchQuery = searchInput.value.toLowerCase().trim();
  
  filteredImages = galleryData.filter(image => {
    // Filter by category
    const categoryMatch = activeCategory === 'all' || image.category === activeCategory;
    
    // Filter by search query
    const searchMatch = !searchQuery || 
      image.title.toLowerCase().includes(searchQuery);
    
    return categoryMatch && searchMatch;
  });
  
  // Render filtered images
  renderGalleryImages(filteredImages);
}

// Open image modal
function openImageModal(image, index) {
  currentImageIndex = index;
  
  // Set modal content
  modalImage.src = image.url;
  modalImage.alt = image.title;
  modalTitle.textContent = image.title;
  
  // Format category for display
  const categoryDisplay = image.category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  modalCategory.textContent = categoryDisplay;
  modalDate.textContent = image.date;
  modalLocation.textContent = image.location;
  
  // Show modal
  imageModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// Close image modal
function closeImageModal() {
  imageModal.classList.remove('open');
  document.body.style.overflow = '';
}

// Navigate between images in modal
function navigateModal(direction) {
  if (filteredImages.length <= 1) return;
  
  if (direction === 'next') {
    currentImageIndex = (currentImageIndex + 1) % filteredImages.length;
  } else {
    currentImageIndex = (currentImageIndex - 1 + filteredImages.length) % filteredImages.length;
  }
  
  const newImage = filteredImages[currentImageIndex];
  
  // Update modal content with animation
  modalImage.style.opacity = '0';
  setTimeout(() => {
    modalImage.src = newImage.url;
    modalImage.alt = newImage.title;
    modalTitle.textContent = newImage.title;
    
    // Format category for display
    const categoryDisplay = newImage.category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    modalCategory.textContent = categoryDisplay;
    modalDescription.textContent = newImage.description || 'No description available.';
    modalDate.textContent = newImage.date;
    modalLocation.textContent = newImage.location;
    
    modalImage.style.opacity = '1';
  }, 200);
}

// Toggle like status for an image
function toggleLike(imageId, button) {
  if (likedImages.has(imageId)) {
    likedImages.delete(imageId);
    button.classList.remove('liked');
  } else {
    likedImages.add(imageId);
    button.classList.add('liked');
    
    // Add heart animation
    const heart = document.createElement('div');
    heart.className = 'heart-animation';
    heart.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    `;
    button.appendChild(heart);
    
    // Remove after animation completes
    setTimeout(() => {
      heart.remove();
    }, 1000);
  }
}

// Handle download button click
function handleDownload() {
  const image = filteredImages[currentImageIndex];
  
  // Create temporary link to download image
  const link = document.createElement('a');
  link.href = image.url;
  link.download = `collegetips-${image.id}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Handle share button click
function handleShare() {
  const image = filteredImages[currentImageIndex];
  
  // Check if Web Share API is available
  if (navigator.share) {
    navigator.share({
      title: image.title,
      text: image.description,
      url: image.url
    }).catch(error => {
      console.log('Sharing failed:', error);
      alert(`Sharing image: ${image.title}`);
    });
  } else {
    // Fallback for browsers that don't support Web Share API
    alert(`Sharing image: ${image.title}`);
  }
}

// Add CSS animation for the heart effect
const style = document.createElement('style');
style.textContent = `
  .heart-animation {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--color-error);
    animation: heartPop 1s forwards;
    pointer-events: none;
  }
  
  @keyframes heartPop {
    0% { 
      opacity: 1;
      transform: translate(-50%, -50%) scale(0);
    }
    50% { 
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.5);
    }
    100% { 
      opacity: 0;
      transform: translate(-50%, -50%) scale(1);
    }
  }
`;
document.head.appendChild(style);