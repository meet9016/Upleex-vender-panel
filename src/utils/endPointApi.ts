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
    postBankAccountTypeList?: string;
    postSubImageDelete: string;

    postCategoryList: string;
    postSubCategoryList: string;
    postProductDropDownList: string;
    postVendorAddProduct: string;
    postVendorProductDetails: string;
    updateVendorProductDetails: string;
    postAllVendorProductList: string;
    postDeleteVendorProductList: string;

    postGetQuote: string;
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
    postBankAccountTypeList: 'vendor-account-type-list',
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

    // Quote
    postGetQuote: 'quotes/getall',
    changeStatus: 'quotes/change-status',
    getStatus: 'quotes/status-dropdown'
};

export default endPointApi;