// API Test Utility
import { backendApi } from './mantaApi';

// Test direct MantaHQ API call
export async function testDirectMantaHQ() {
  try {
    const response = await fetch('https://api.mantahq.com/api/workflow/olaleye/mantadrive/files/tamtamtamtam', {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Direct MantaHQ API Response:', data);
    return data;
  } catch (error) {
    console.error('Direct MantaHQ API Error:', error);
    throw error;
  }
}

// Test backend API call
export async function testBackendAPI(token) {
  try {
    // Test if backend is reachable
    const healthResponse = await fetch(`${backendApi.baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('Backend Health Check:', healthData);
    
    // Test file retrieval through backend
    if (token) {
      try {
        const filesData = await backendApi.getFiles(token);
        console.log('Files from Backend:', filesData);
        return filesData;
      } catch (fileError) {
        console.error('Error getting files from backend:', fileError);
        throw fileError;
      }
    }
    
    return healthData;
  } catch (error) {
    console.error('Backend API Error:', error);
    throw error;
  }
}

// Test POST request to backend
export async function testPostToBackend(token) {
  try {
    const testData = {
      s3_url: "tamtam",
      s3_key: "tamtam",
      size: 456,
      content_type: "tamtam",
      created_at: "347",
      username: "tamtam"
    };
    
    const response = await fetch(`${backendApi.baseURL}/test-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    console.log('Test POST Response:', data);
    return data;
  } catch (error) {
    console.error('Test POST Error:', error);
    throw error;
  }
}