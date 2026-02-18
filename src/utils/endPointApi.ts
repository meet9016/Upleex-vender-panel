export interface EndPointApi {
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
    postAllVendorProductList: string;
    postDeleteVendorProductList: string;

    postGetQuote:string;
    getStatus:string;
    changeStatus:string;

}

// Define and export the API endpoint object
const endPointApi: EndPointApi = {
    login: 'vendor-login',
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
    postCategoryList: 'vendor-category-list',
    postSubCategoryList: 'vendor-sub-category-list',
    postProductDropDownList: 'vendor-product-drop-down-list',
    postVendorAddProduct: 'vendor-add-product',
    postVendorProductDetails: 'vendor-product-details',
    postAllVendorProductList: 'vendor-product-list',
    postDeleteVendorProductList: 'vendor-delete-product',

    // Quote
    postGetQuote: 'vendor-product-quotes-list',
    changeStatus:'vendor-change-quote-status',
    getStatus:'vendor-quote-status-dropdown-list'

};

export default endPointApi;