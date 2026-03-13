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

    postCategoryList: string;
    postSubCategoryList: string;
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

    postGetQuote: string;
    getQuoteById: string;
    updateQuote: string;
    getStatus: string;
    changeStatus: string;
    
    // Export endpoints
    exportProductsExcel: string;
    exportProductsPDF: string;
    exportQuotesExcel: string;
    exportQuotesPDF: string;
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



    //Category 
    postCategoryList: 'categories/getall',
    postSubCategoryList: 'subcategories/getall',
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

    // Quote
    postGetQuote: 'quote/getall',
    getQuoteById: 'quote/getById',
    updateQuote: 'quote/update',
    changeStatus: 'quote/change-status',
    getStatus: 'quote/status-dropdown',
    
    // Export endpoints
    exportProductsExcel: 'export/products/excel',
    exportProductsPDF: 'export/products/pdf',
    exportQuotesExcel: 'export/quotes/excel',
    exportQuotesPDF: 'export/quotes/pdf'
};

export default endPointApi;
