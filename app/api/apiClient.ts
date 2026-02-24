// Basic API client without service dependencies
class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "/api"
  }

  // Basic HTTP methods
  async get(endpoint: string) {
    const finalUrl = `${this.baseURL}${endpoint}`;
    console.warn('🌐 [ApiClient] GET Request:', finalUrl);
    const response = await fetch(finalUrl, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  async post(endpoint: string, data: Record<string, unknown> | FormData) {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      credentials: 'include',
      headers: isFormData ? {} : {
        "Content-Type": "application/json",
      },
      body: isFormData ? data : JSON.stringify(data),
    })
    return response.json()
  }

  async put(endpoint: string, data: Record<string, unknown>) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    return response.json()
  }

  async patch(endpoint: string, data: Record<string, unknown> | FormData) {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PATCH",
      credentials: 'include',
      headers: isFormData ? {} : {
        "Content-Type": "application/json",
      },
      body: isFormData ? data : JSON.stringify(data),
    })
    return response.json()
  }

  async delete(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
    })
    return response.json()
  }

  async getBlob(endpoint: string): Promise<Blob> {
    const finalUrl = `${this.baseURL}${endpoint}`;
    console.warn('🌐 [ApiClient] GET Blob Request:', finalUrl);
    const response = await fetch(finalUrl, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.blob()
  }
}

// Create singleton instance
const apiClient = new ApiClient()

export default apiClient
