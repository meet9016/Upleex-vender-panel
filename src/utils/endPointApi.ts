export interface EndPointApi {
    sendOtp: string;
    login: string;
    register: string;
    logout: string;

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
    postAllVendorProductList: string;
    postDeleteVendorProductList: string;

    postGetQuote: string;
    getQuoteById: string;
    updateQuote: string;
    getStatus: string;
    changeStatus: string;
    }

// Define and export the API endpoint object
const endPointApi: EndPointApi = {
    sendOtp: 'vendor/auth/send-otp',
    login: 'vendor/auth/vendor-login',
    register: 'auth/register',
    logout: 'auth/logout',

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

    // Quote
    postGetQuote: 'quote/getall',
    getQuoteById: 'quote/getById',
    updateQuote: 'quote/update',
    changeStatus: 'quote/change-status',
    getStatus: 'quote/status-dropdown'
};

export default endPointApi;
