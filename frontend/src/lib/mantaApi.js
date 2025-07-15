// Backend API integration (connects to our FastAPI backend which uses MantaHQ)
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

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
    return this.request('/signup', {
      method: 'POST',
      body: JSON.stringify(userauth),
    });
  }

  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getUserProfile(token) {
    return this.request('/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updateUserProfile(profileData, token) {
    return this.request('/user-reset', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(profileData),
    });
  }

  // File Management
  async uploadFile(file, token) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_size', file.size);
    formData.append('file_type', file.type || 'application/octet-stream');

    const url = `${this.baseURL}/upload`;
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
    // Get username from token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const username = payload.username;

    return this.request(`/files?username=${username}`, {
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
    const url = `${this.baseURL}/download/${fileId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Download failed');
    }

    const data = await response.json();

    // Download from S3 presigned URL
    const fileResponse = await fetch(data.download_url);
    if (!fileResponse.ok) {
      throw new Error('Failed to download file from storage');
    }

    return fileResponse.blob();
  }

  // Sharing & QR Codes
  async generateShareLink(fileId, token) {
    return this.request('/share', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ file_id: fileId, manta_token: token }),
    });
  }

  async generateQRCode(fileId, token) {
    return this.request('/qrcode', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ file_id: fileId, manta_token: token }),
    });
  }

  async generateProtectedShareLink(fileId, options, token) {
    return this.request('/share/protected', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        file_id: fileId,
        protection: options.protection,
        access_key: options.accessKey,
        expires_in: options.expiresIn || '7d'
      }),
    });
  }

  // Anonymous Sharing (Ghost Sharing)
  async createAnonymousShare(fileId, options, token) {
    try {
      const response = await this.request('/share/anonymous', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          file_id: fileId,
          access_key: options.accessKey,
          password: options.password,
          expires_in: options.expiresIn || 24,
          max_downloads: options.maxDownloads
        }),
      });
      
      console.log('Anonymous share response:', response);
      return response;
    } catch (error) {
      console.error('Error in createAnonymousShare:', error);
      throw error;
    }
  }

  async accessAnonymousShare(accessId, accessKey, password) {
    const params = new URLSearchParams();
    if (accessKey) params.append('access_key', accessKey);
    if (password) params.append('password', password);
    
    const url = `/s/${accessId}${params.toString() ? '?' + params.toString() : ''}`;
    
    try {
      const response = await fetch(`${this.baseURL}${url}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Access denied');
      }
      
      return data;
    } catch (error) {
      console.error('Anonymous Share Access Error:', error);
      throw error;
    }
  }

  // AI Features
  async organizeFiles(token) {
    return this.request('/ai/organize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getSmartInsights(token) {
    return this.request('/ai/smart-insights', {
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
