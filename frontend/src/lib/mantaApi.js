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
        expires_in: options.expiresIn || '7d',
      }),
    });
  }

  // Anonymous Sharing (Ghost Sharing)
  async createAnonymousShare(fileId, options, token) {
    try {
      const response = await this.request('/createphraseshare', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          file_id: fileId,
          access_key: options.accessKey,
          password: options.password,
          expires_in: options.expiresIn || 24,
          max_downloads: options.maxDownloads,
        }),
      });

      console.log('Anonymous share response:', response);
      return response;
    } catch (error) {
      console.error('Error in createAnonymousShare:', error);
      throw error;
    }
  }

  // Share with Passphrase - Simple version
  async createPhraseShare(s3_url, phrase, token) {
    try {
      // Check if we're in demo mode
      const demoMode = localStorage.getItem('demoMode') === 'true';

      if (demoMode) {
        // For demo mode, just create a mock share without API call
        console.log('Demo mode: Creating phrase share');

        // Use the default key if none provided
        const sharePhrase = phrase || '12345';

        // Generate a share ID from the S3 URL
        const shareId = s3_url.split('/').pop() || Date.now().toString();
        const shareUrl = `${window.location.origin}/share/phrase/${shareId}`;

        // Store the share info in localStorage for demo purposes
        const demoShares = JSON.parse(
          localStorage.getItem('demoShares') || '{}'
        );
        demoShares[shareId] = {
          s3_url: s3_url,
          phrase: sharePhrase,
        };
        localStorage.setItem('demoShares', JSON.stringify(demoShares));

        // Return mock response
        const result = {
          message: 'Demo share created successfully',
          statusCode: 201,
          shareUrl: shareUrl,
          shareId: shareId,
        };

        console.log('Demo phrase share response:', result);
        return result;
      }

      // Normal mode - Extract username from token
      const username = JSON.parse(atob(token.split('.')[1])).username;

      // Using the exact endpoint from the curl example
      const url =
        'https://api.mantahq.com/api/workflow/olaleye/mantadrive/createphraseshare';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          s3_url: s3_url, // Required: Direct URL to the file
          phrase: phrase, // Required: Secret phrase to protect the share
          username: username, // Required: Username of the sharer
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create phrase share');
      }

      // Generate a share URL based on the file ID
      const shareId = s3_url.split('/').pop() || Date.now().toString();
      const shareUrl = `${window.location.origin}/share/phrase/${shareId}`;

      // Return both the API response and the generated share URL
      const result = {
        ...data,
        shareUrl: shareUrl,
        shareId: shareId,
      };

      console.log('Phrase share response:', result);
      return result;
    } catch (error) {
      console.error('Error in createPhraseShare:', error);
      throw error;
    }
  }

  async accessAnonymousShare(accessId, accessKey, password) {
    const params = new URLSearchParams();
    if (accessKey) params.append('access_key', accessKey);
    if (password) params.append('password', password);

    const url = `/s/${accessId}${
      params.toString() ? '?' + params.toString() : ''
    }`;

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

  // Verify phrase and get file access
  async verifyPhrase(fileId, phrase) {
    try {
      // Check if we're in demo mode with the default key "12345"
      const demoMode = localStorage.getItem('demoMode') === 'true';
      const demoKey = localStorage.getItem('demoKey');

      if (demoMode && phrase === demoKey) {
        // For demo mode, just return the file URL directly without API call
        console.log('Demo mode: Phrase verified successfully');
        return {
          success: true,
          s3_url: fileId, // In demo mode, fileId is actually the S3 URL
          message: 'Demo phrase verified successfully',
        };
      }

      // Normal mode - Using GET method to retrieve data
      const url = `https://api.mantahq.com/api/workflow/olaleye/mantadrive/verifyphrase?file_id=${encodeURIComponent(
        fileId
      )}&phrase=${encodeURIComponent(phrase)}`;

      const response = await fetch(url, {
        method: 'GET', // Using GET method to retrieve data
        headers: {
          accept: 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify phrase');
      }

      // If phrase is correct, response should contain s3_url to access the file
      return data;
    } catch (error) {
      console.error('Phrase verification error:', error);
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
