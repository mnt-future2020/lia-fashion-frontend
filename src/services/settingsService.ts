import axios from '../lib/axios';
export interface CloudinarySettings {
  protocol: string;
  hostname: string;
  port: string;
  path_pattern: string;
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

export const settingsService = {
  getCloudinarySettings: async (): Promise<{ status: string; data: CloudinarySettings }> => {
    try {
      const response = await axios.get('/api/admin/settings/cloudinary');
      return response.data;
    } catch (error) {
      // console.error('Failed to fetch Cloudinary settings:', error);
      throw new Error((error as Error).message || 'Failed to fetch Cloudinary settings');
    }
  },

  updateCloudinarySettings: async (settings: CloudinarySettings): Promise<{ status: string; message: string }> => {
    try {
      const response = await axios.post('/api/admin/settings/cloudinary', settings);
      return response.data;
    } catch (error) {
      // console.error('Failed to update Cloudinary settings:', error);
      throw new Error((error as Error).message || 'Failed to update Cloudinary settings');
    }
  }
}; 