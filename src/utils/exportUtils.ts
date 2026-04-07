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

// Export Orders to Excel
export const exportOrdersToExcel = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportOrdersExcel}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    const filename = `orders_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadFile(response.data, filename);
    
    return { success: true, message: 'Orders exported to Excel successfully' };
  } catch (error: any) {
    console.error('Export orders to Excel error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export orders to Excel');
  }
};

// Export Orders to PDF
export const exportOrdersToPDF = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportOrdersPDF}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    const filename = `orders_${new Date().toISOString().split('T')[0]}.pdf`;
    downloadFile(response.data, filename);
    
    return { success: true, message: 'Orders exported to PDF successfully' };
  } catch (error: any) {
    console.error('Export orders to PDF error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export orders to PDF');
  }
};

// Export Payments to Excel
export const exportPaymentsToExcel = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportPaymentsExcel}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    const filename = `payments_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadFile(response.data, filename);
    
    return { success: true, message: 'Payments exported to Excel successfully' };
  } catch (error: any) {
    console.error('Export payments to Excel error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export payments to Excel');
  }
};

// Export Payments to PDF
export const exportPaymentsToPDF = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportPaymentsPDF}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    const filename = `payments_${new Date().toISOString().split('T')[0]}.pdf`;
    downloadFile(response.data, filename);
    
    return { success: true, message: 'Payments exported to PDF successfully' };
  } catch (error: any) {
    console.error('Export payments to PDF error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export payments to PDF');
  }
};

// Export Wallet Transactions to Excel
export const exportWalletTransactionsToExcel = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportWalletTransactionsExcel}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    const filename = `wallet_transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadFile(response.data, filename);
    
    return { success: true, message: 'Transactions exported to Excel successfully' };
  } catch (error: any) {
    console.error('Export wallet transactions to Excel error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export transactions to Excel');
  }
};

// Export Wallet Transactions to PDF
export const exportWalletTransactionsToPDF = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportWalletTransactionsPDF}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    const filename = `wallet_transactions_${new Date().toISOString().split('T')[0]}.pdf`;
    downloadFile(response.data, filename);
    
    return { success: true, message: 'Transactions exported to PDF successfully' };
  } catch (error: any) {
    console.error('Export wallet transactions to PDF error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export transactions to PDF');
  }
};

// Export Services to Excel
export const exportServicesToExcel = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportServicesExcel}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    const filename = `services_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadFile(response.data, filename);
    
    return { success: true, message: 'Services exported to Excel successfully' };
  } catch (error: any) {
    console.error('Export services to Excel error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export services to Excel');
  }
};

// Export Services to PDF
export const exportServicesToPDF = async (filters: any = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await api.get(`${endPointApi.exportServicesPDF}?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    const filename = `services_${new Date().toISOString().split('T')[0]}.pdf`;
    downloadFile(response.data, filename);
    
    return { success: true, message: 'Services exported to PDF successfully' };
  } catch (error: any) {
    console.error('Export services to PDF error:', error);
    throw new Error(error.response?.data?.message || 'Failed to export services to PDF');
  }
};