import { api } from './axiosInstance';
import endPointApi from './endPointApi';

type ExportFormat = 'xlsx' | 'pdf';

interface ExportConfig {
  endpoint: string;
  format: ExportFormat;
  /** Base filename prefix (e.g. "orders") */
  prefix: string;
  /** Optional query params / filters */
  filters?: Record<string, any>;
}

/**
 * Triggers a browser file download from a Blob response.
 */
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

/**
 * Builds a URLSearchParams string from a filters object, skipping empty values.
 */
const buildQueryString = (filters: Record<string, any> = {}): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

/**
 * Extracts a filename from the `Content-Disposition` response header,
 */
const resolveFilename = (
  headers: Record<string, string>,
  prefix: string,
  ext: string
): string => {
  const disposition = headers['content-disposition'];
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    if (match?.[1]) return match[1].trim();
  }
  return `${prefix}_${new Date().toISOString().split('T')[0]}.${ext}`;
};

/**
 * Generic export handler used by all specific export functions.
 * Hits the given endpoint with optional filters and downloads the file.
 */
export const exportData = async ({
  endpoint,
  format,
  prefix,
  filters = {},
}: ExportConfig): Promise<{ success: boolean; message: string }> => {
  try {
    const qs = buildQueryString(filters);
    const url = qs ? `${endpoint}?${qs}` : endpoint;

    const response = await api.get(url, { responseType: 'blob' });

    const ext = format === 'xlsx' ? 'xlsx' : 'pdf';
    const filename = resolveFilename(response.headers as any, prefix, ext);
    downloadFile(response.data, filename);

    return {
      success: true,
      message: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} exported to ${format.toUpperCase()} successfully`,
    };
  } catch (error: any) {
    console.error(`Export [${prefix}] to [${format}] error:`, error);
    throw new Error(
      error.response?.data?.message || `Failed to export ${prefix} to ${format.toUpperCase()}`
    );
  }
};

// ─── Named wrappers (backward-compatible) ─────────────────────────────────────
// All existing imports across the codebase continue to work unchanged.

export const exportProductsToExcel = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportProductsExcel, format: 'xlsx', prefix: 'my_products', filters });

export const exportProductsToPDF = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportProductsPDF, format: 'pdf', prefix: 'my_products', filters });

export const exportQuotesToExcel = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportQuotesExcel, format: 'xlsx', prefix: 'quotes', filters });

export const exportQuotesToPDF = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportQuotesPDF, format: 'pdf', prefix: 'quotes', filters });

export const exportOrdersToExcel = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportOrdersExcel, format: 'xlsx', prefix: 'orders', filters });

export const exportOrdersToPDF = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportOrdersPDF, format: 'pdf', prefix: 'orders', filters });

export const exportPaymentsToExcel = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportPaymentsExcel, format: 'xlsx', prefix: 'payments', filters });

export const exportPaymentsToPDF = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportPaymentsPDF, format: 'pdf', prefix: 'payments', filters });

export const exportWalletTransactionsToExcel = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportWalletTransactionsExcel, format: 'xlsx', prefix: 'wallet_transactions', filters });

export const exportWalletTransactionsToPDF = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportWalletTransactionsPDF, format: 'pdf', prefix: 'wallet_transactions', filters });

export const exportServicesToExcel = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportServicesExcel, format: 'xlsx', prefix: 'services', filters });

export const exportServicesToPDF = (filters?: Record<string, any>) =>
  exportData({ endpoint: endPointApi.exportServicesPDF, format: 'pdf', prefix: 'services', filters });