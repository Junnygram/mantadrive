// Backend API integration (connects to our FastAPI backend which uses MantaHQ)
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

class BackendAPI {
  constructor() {
    this.baseURL = BACKEND_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('Backend API Error:', error);
      throw error;
    }
  }

  // Authentication
  async register(userauth) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userauth),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getUserProfile(token) {
    return this.request('/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // File Management
  async uploadFile(file, token) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}/files/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  async getFiles(token) {
    return this.request('/files', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async deleteFile(fileId, token) {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  
  async downloadFile(fileId, token) {
    const url = `${this.baseURL}/files/${fileId}/download`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Download failed');
    }
    
    return response.blob();
  }

  // Sharing & QR Codes
  async generateShareLink(fileId, options, token) {
    return this.request(`/files/${fileId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(options),
    });
  }

  async generateQRCode(fileId, token) {
    return this.request(`/files/${fileId}/qr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // AI Features
  async organizeFiles(token) {
    return this.request('/ai/organize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async detectDuplicates(token) {
    return this.request('/ai/duplicates', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async processDocument(fileId, processingType, token) {
    return this.request(`/ai/process/${fileId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: processingType }),
    });
  }

  // File Processing
  async removeBackground(fileId, token) {
    return this.request(`/process/remove-background/${fileId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async convertFile(fileId, targetFormat, token) {
    return this.request(`/process/convert/${fileId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ format: targetFormat }),
    });
  }

  async extractText(fileId, token) {
    return this.request(`/process/extract-text/${fileId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export const backendApi = new BackendAPI();
