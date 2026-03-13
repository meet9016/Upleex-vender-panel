import { api } from './axiosInstance';
import endPointApi from './endPointApi';

// Helper function to download file
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export Products to Excel
export const exportProductsToExcel = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportProductsExcel}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    // Extract filename from response headers or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `my_products_${new Date().toISOString().split('T')[0]}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=(.+)/);
      if (filenameMatch) {
        filename = filenameMatch[1].replace(/"/g, '');
      }
    }

    downloadFile(response.data, filename);
    
    return { success: true, message: 'Products exported to Excel successfully' };
  } catch (error: any) {
    console.error('Export products to Excel error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export products to Excel');
  }
};

// Export Products to PDF
export const exportProductsToPDF = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportProductsPDF}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    // Extract filename from response headers or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `my_products_${new Date().toISOString().split('T')[0]}.pdf`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=(.+)/);
      if (filenameMatch) {
        filename = filenameMatch[1].replace(/"/g, '');
      }
    }

    downloadFile(response.data, filename);
    
    return { success: true, message: 'Products exported to PDF successfully' };
  } catch (error: any) {
    console.error('Export products to PDF error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export products to PDF');
  }
};

// Export Quotes to Excel
export const exportQuotesToExcel = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportQuotesExcel}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    const filename = `quotes_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadFile(response.data, filename);
    
    return { success: true, message: 'Quotes exported to Excel successfully' };
  } catch (error: any) {
    console.error('Export quotes to Excel error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export quotes to Excel');
  }
};

// Export Quotes to PDF
export const exportQuotesToPDF = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportQuotesPDF}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    const filename = `quotes_${new Date().toISOString().split('T')[0]}.pdf`;
    downloadFile(response.data, filename);
    
    return { success: true, message: 'Quotes exported to PDF successfully' };
  } catch (error: any) {
    console.error('Export quotes to PDF error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export quotes to PDF');
  }
};