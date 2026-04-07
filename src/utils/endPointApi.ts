export interface EndPointApi {
    sendOtp: string;
    login: string;
    register: string;
    logout: string;
    businessRegister: string;

    //Vendor
    postVendorKYCFormSubmit?: string;
    postFetchVendorKYCFormData?: string;
    postVendorCountryList?: String;
    postVendorStateList?: String;
    postVendorCityList?: string;
    postSubImageDelete: string;
    postUpdateVendorType: string;

    postCategoryList: string;
    postSubCategoryList: string;
    postServiceCategoryList: string;
    postProductDropDownList: string;
    postVendorAddProduct: string;
    postVendorProductDetails: string;
    updateVendorProductDetails: string;
    postBulkDeactivateProducts: string;
    postBulkDeleteProducts: string;
    postPurchasePlan: string;
    postCreateListingPlan: string;
    postCustomPlanRequest: string;
    postAllVendorProductList: string;
    postDeleteVendorProductList: string;
    getPlanOptions: string;
    toggleProductVisibility: string;

    postGetQuote: string;
    getQuoteById: string;
    updateQuote: string;
    getStatus: string;
    changeStatus: string;
    
    // Payment & Orders
    getVendorOrders: string;
    getVendorPaymentHistory: string;
    getVendorOrderStatusOptions: string;
    updateVendorOrderStatus: string;
    getVendorOrderDetails: string;
    
    // Export endpoints
    exportProductsExcel: string;
    exportProductsPDF: string;
    exportQuotesExcel: string;
    exportQuotesPDF: string;
    exportOrdersExcel: string;
    exportOrdersPDF: string;
    exportPaymentsExcel: string;
    exportPaymentsPDF: string;
    exportWalletTransactionsExcel: string;
    exportWalletTransactionsPDF: string;

    // Service
    postVendorAddService: string;
    postVendorServiceDetails: string;
    updateVendorServiceDetails: string;
    postAllVendorServiceList: string;
    postDeleteVendorServiceList: string;
    
    // Wallet
    getWalletBalance: string;
    addWalletMoney: string;
    getWalletTransactions: string;
    verifyWalletPayment: string;
    getWalletSummary: string;
    getPurchasedPlans: string;
    getVendorDashboardMetrics: string;
    getAllPriorityPlans: string;
    purchasePriorityPlan: string;
    getVendorPriorityPurchases: string;
    getAllRentalBoostPlans: string;
    purchaseRentalBoostPlan: string;
    getVendorRentalBoostPurchases: string;
    }

// Define and export the API endpoint object
const endPointApi: EndPointApi = {
    sendOtp: 'vendor/auth/send-otp',
    login: 'vendor/auth/vendor-login',
    register: 'auth/register',
    logout: 'auth/logout',
    businessRegister: 'vendor/auth/business-register',
    //Vendor
    postVendorKYCFormSubmit: 'vendor-kyc',
    postFetchVendorKYCFormData: 'vendor-single-details',
    postVendorCountryList: 'vendor-country-list',
    postVendorStateList: 'vendor-state-list',
    postVendorCityList: 'vendor-city-list',
    postSubImageDelete: 'vendor-delete-product-image',
    postUpdateVendorType: 'vendor-type',



    //Category 
    postCategoryList: 'categories/getall',
    postSubCategoryList: 'subcategories/getall',
    postServiceCategoryList: 'service-categories/getall',
    postProductDropDownList: 'dropdowns',
    postVendorAddProduct: 'products/create-product',
    postVendorProductDetails: 'products/getById',
    updateVendorProductDetails: 'products/update',
    postAllVendorProductList: 'products/getall',
    postDeleteVendorProductList: 'products/delete',
    postBulkDeactivateProducts: 'products/bulk-deactivate',
    postBulkDeleteProducts: 'products/bulk-delete',
    postPurchasePlan: 'products/purchase-plan',
    getPlanOptions: 'listing-plans/options',
    postCreateListingPlan: 'listing-plans/create',
    postCustomPlanRequest: 'listing-plans/custom-request',
    getPurchasedPlans: 'listing-plans/getall',
    toggleProductVisibility: 'products/toggle-visibility',

    // Priority Plans
    getAllPriorityPlans: 'priority-plans/getall',
    purchasePriorityPlan: 'priority-plans/purchase',
    getVendorPriorityPurchases: 'priority-plans/vendor/purchases',

    // Quote
    postGetQuote: 'quote/getall',
    getQuoteById: 'quote/getById',
    updateQuote: 'quote/update',
    changeStatus: 'quote/change-status',
    getStatus: 'quote/status-dropdown',
    
    // Payment & Orders
    getVendorOrders: 'vendor/orders',
    getVendorPaymentHistory: 'payment/vendor-payment-history',
    getVendorOrderStatusOptions: 'vendor/orders/status-options',
    updateVendorOrderStatus: 'vendor/orders',
    getVendorOrderDetails: 'vendor/orders',
    
    // Export endpoints
    exportProductsExcel: 'export/products/excel',
    exportProductsPDF: 'export/products/pdf',
    exportQuotesExcel: 'export/quotes/excel',
    exportQuotesPDF: 'export/quotes/pdf',
    exportOrdersExcel: 'export/orders/excel',
    exportOrdersPDF: 'export/orders/pdf',
    exportPaymentsExcel: 'export/payments/excel',
    exportPaymentsPDF: 'export/payments/pdf',
    exportWalletTransactionsExcel: 'export/wallet-transactions/excel',
    exportWalletTransactionsPDF: 'export/wallet-transactions/pdf',

    // Service
    postVendorAddService: 'services/create-service',
    postVendorServiceDetails: 'services/getById',
    updateVendorServiceDetails: 'services/update',
    postAllVendorServiceList: 'services/getall',
    postDeleteVendorServiceList: 'services/delete',
    
    // Wallet
    getWalletBalance: 'wallet/balance',
    addWalletMoney: 'wallet/add-money',
    getWalletTransactions: 'wallet/transactions',
    verifyWalletPayment: 'wallet/verify-payment',
    getWalletSummary: 'wallet/summary',
    getVendorDashboardMetrics: 'vendor/dashboard/metrics',
    // Rental Boost Plans
    getAllRentalBoostPlans: 'rental-boost-plans/getall',
    purchaseRentalBoostPlan: 'rental-boost-plans/purchase-bulk',
    getVendorRentalBoostPurchases: 'rental-boost-plans/vendor/purchases',
};

export default endPointApi;
