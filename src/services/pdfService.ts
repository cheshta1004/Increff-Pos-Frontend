import axios from 'axios';

const API_URL = 'http://localhost:8080/api/pdf';

export const generateReceipt = async (order: any) => {
  try {
    const response = await axios.post(`${API_URL}/receipt`, order, {
      responseType: 'blob',
    });

    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'receipt.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}; 