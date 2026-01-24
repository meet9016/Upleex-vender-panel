export interface EndPointApi {
    login: string;
    register: string;
    logout: string;

    //Vendor
    postVendorCityList?: string;

    postCategoryList: string;
    postSubCategoryList: string;
    postProductDropDownList: string;
    postVendorAddProduct: string;
    postAllVendorProductList: string;
    postDeleteVendorProductList: string;
}

// Define and export the API endpoint object
const endPointApi: EndPointApi = {
    login: 'vendor-login',
    register: 'auth/register',
    logout: 'auth/logout',

    //Vendor
    postVendorCityList: 'vendor-city-list',

    //Category 
    postCategoryList: 'vendor-category-list',
    postSubCategoryList: 'vendor-sub-category-list',
    postProductDropDownList: 'vendor-product-drop-down-list',
    postVendorAddProduct: 'vendor-add-product',
    postAllVendorProductList: 'vendor-product-list',
    postDeleteVendorProductList: 'vendor-delete-product',
};

export default endPointApi;