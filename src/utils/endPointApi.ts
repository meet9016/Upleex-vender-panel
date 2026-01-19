export interface EndPointApi {
    login: string;
    register: string;
    logout: string;

    //Vendor
    postVendorCityList?: string;
}

// Define and export the API endpoint object
const endPointApi: EndPointApi = {
    login: 'auth/login',
    register: 'auth/register',
    logout: 'auth/logout',

    //Vendor
    postVendorCityList: 'vendor-city-list',
};

export default endPointApi;