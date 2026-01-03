import api from './api';

export const uploadService = {
  async uploadPhoto(file: File): Promise<{ photoUrl: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.instance.post<{ success: boolean; photoUrl: string; filename: string }>(
      '/upload/photo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },
};

