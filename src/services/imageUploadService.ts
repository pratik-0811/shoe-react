import { API_URL } from '../config/env';

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  image?: string;
  images?: string[];
  file?: {
    filename: string;
    originalName: string;
    size: number;
    url: string;
  };
  files?: Array<{
    filename: string;
    originalName: string;
    size: number;
    url: string;
  }>;
}

export interface UploadLimits {
  products: {
    maxFiles: number;
    maxSize: string;
    allowedTypes: string[];
  };
  banners: {
    maxFiles: number;
    maxSize: string;
    allowedTypes: string[];
  };
  avatars: {
    maxFiles: number;
    maxSize: string;
    allowedTypes: string[];
  };
}

class ImageUploadService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Upload product images (multiple files)
  async uploadProductImages(files: FileList | File[]): Promise<ImageUploadResponse> {
    const formData = new FormData();
    
    // Convert FileList to Array if needed
    const fileArray = Array.from(files);
    
    // Validate file count (max 5 for products)
    if (fileArray.length > 5) {
      throw new Error('Maximum 5 images allowed for products');
    }
    
    // Add files to FormData
    fileArray.forEach(file => {
      this.validateImageFile(file, 5 * 1024 * 1024); // 5MB limit
      formData.append('images', file);
    });
    
    const response = await fetch(`${API_URL}/uploads/products`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload product images');
    }
    
    return response.json();
  }

  // Upload banner image (single file)
  async uploadBannerImage(file: File): Promise<ImageUploadResponse> {
    this.validateImageFile(file, 10 * 1024 * 1024); // 10MB limit
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_URL}/uploads/banners`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload banner image');
    }
    
    return response.json();
  }

  // Upload avatar image (single file)
  async uploadAvatarImage(file: File): Promise<ImageUploadResponse> {
    this.validateImageFile(file, 2 * 1024 * 1024); // 2MB limit
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch(`${API_URL}/uploads/avatars`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload avatar image');
    }
    
    return response.json();
  }

  // Delete uploaded image
  async deleteImage(type: 'products' | 'banners' | 'avatars', filename: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/uploads/${type}/${filename}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete image');
    }
    
    return response.json();
  }

  // Get upload limits and info
  async getUploadInfo(): Promise<{ success: boolean; limits: UploadLimits }> {
    const response = await fetch(`${API_URL}/uploads/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get upload info');
    }
    
    return response.json();
  }

  // Validate image file
  private validateImageFile(file: File, maxSize: number): void {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }
    
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }
    
    // Check if file is actually an image
    if (!file.type.startsWith('image/')) {
      throw new Error('Selected file is not an image');
    }
  }

  // Helper method to extract filename from URL
  getFilenameFromUrl(url: string): string {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  // Helper method to check if URL is an uploaded file
  isUploadedFile(url: string, type: 'products' | 'banners' | 'avatars'): boolean {
    return url.includes(`/uploads/${type}/`);
  }

  // Helper method to get full image URL
  getImageUrl(filename: string, type: 'products' | 'banners' | 'avatars'): string {
    return `${API_URL}/uploads/${type}/${filename}`;
  }
}

export default new ImageUploadService();