"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { ChevronDownIcon } from "../../../icons";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/common/Input";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import type { ErrorType, KycFormDataType } from '@/pages/kyc/KycPage'
import { toast } from "react-toastify";

/* <!-- =========================================== Types for Country, State, City Options =========================================== --> */

export type Option = {
  value: string;
  label: string;
};

type KYCFormProp = {
  setKYCFormData: React.Dispatch<React.SetStateAction<KycFormDataType>>;
  KYCformData: KycFormDataType;
  errors: ErrorType;
  clearError: (field: keyof ErrorType) => void;

};


export default function ContactDetails({ setKYCFormData, KYCformData, errors, clearError }: KYCFormProp) {

  /* <!-- =========================================== States =========================================== --> */

  const [countries, setCountries] = useState<Option[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [hasMoreCountries, setHasMoreCountries] = useState(true);
  const [hasMoreStates, setHasMoreStates] = useState(true);
  const [hasMoreCities, setHasMoreCities] = useState(true);

  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);
  const [selectedState, setSelectedState] = useState<Option | null>(null);
  const [selectedCity, setSelectedCity] = useState<Option | null>(null);

  const [searchCountry, setSearchCountry] = useState<string>('');
  const [searchState, setSearchState] = useState<string>('');
  const [searchCity, setSearchCity] = useState<string>('');

  /* <!-- ================================================== refs ================================================== --> */

  const pageRefCountry = useRef(1);
  const pageRefState = useRef(1);
  const pageRefCity = useRef(1);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  /* <!-- ================================== fetch country, state, city from API ================================== --> */
  const fetchOptions = useCallback(async (type: string, search: string, page: number) => {
    let isLoading: boolean;
    let setLoading: (value: boolean) => void;

    if (type === "country") {
      isLoading = loadingCountries;
      setLoading = setLoadingCountries;
    } else if (type === "state") {
      isLoading = loadingStates;
      setLoading = setLoadingStates;
    } else {
      isLoading = loadingCities;
      setLoading = setLoadingCities;
    }

    if (isLoading) return;
    setLoading(true);
    try {
      const payload: any = { page, search };
      let res;
      if (type === "country") {
        if (!endPointApi.postVendorCountryList) {
          throw new Error("Country endpoint not configured");
        }
        res = await api.post(endPointApi.postVendorCountryList as string, payload);
      } else if (type === "state") {
        if (!endPointApi.postVendorStateList) {
          throw new Error("State endpoint not configured");
        }
        if (selectedCountry?.value) {
          payload.country_id = selectedCountry.value;
        }
        res = await api.post(endPointApi.postVendorStateList as string, payload);
      } else if (type === "city") {
        if (!endPointApi.postVendorCityList) {
          throw new Error("City endpoint not configured");
        }
        if (selectedState?.value) {
          payload.state_id = selectedState.value;
        }
        res = await api.post(endPointApi.postVendorCityList as string, payload);
      }
      const list = res?.data?.data || [];
      if (list.length === 0) {
        if (type === "country") setHasMoreCountries(false);
        if (type === "state") setHasMoreStates(false);
        if (type === "city") setHasMoreCities(false);
        return;
      }
      if (type === "country") {
        setCountries((prev) => page === 1 ?
          list.map((item: any) => ({ value: String(item.id), label: item.country_name })) :
          [...prev, ...list.map((item: any) => ({ value: String(item.id), label: item.country_name }))]
        );
        pageRefCountry.current += 1;
      }
      if (type === "state") {
        setStates((prev) => page === 1 ?
          list.map((item: any) => ({ value: String(item.id), label: item.state_name })) :
          [...prev, ...list.map((item: any) => ({ value: String(item.id), label: item.state_name }))]
        );
        pageRefState.current += 1;
      }
      if (type === "city") {
        setCities((prev) => page === 1 ?
          list.map((item: any) => ({ value: String(item.id), label: item.city_name })) :
          [...prev, ...list.map((item: any) => ({ value: String(item.id), label: item.city_name }))]
        );
        pageRefCity.current += 1;
      }
    } catch (error) {
      console.error(`Failed to fetch ${type}`, error);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry?.value, selectedState?.value]);


  /* <!-- ================================================ Debounce for serach ================================================ --> */

  const debounceSearch = (type: string, value: string) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (type === "country") {
        setSearchCountry(value);
        setHasMoreCountries(true);
        pageRefCountry.current = 1;
        setCountries([]);
      } else if (type === "state") {
        setSearchState(value);
        setHasMoreStates(true);
        pageRefState.current = 1;
        setStates([]);
      } else if (type === "city") {
        setSearchCity(value);
        setHasMoreCities(true);
        pageRefCity.current = 1;
        setCities([]);
      }
    }, 500);
  };

  /* <!-- ================================================ UseEffects for serach ================================================ --> */

  useEffect(() => {
    if (searchCountry === "") return;
    fetchOptions("country", searchCountry, 1);
  }, [searchCountry]);

  useEffect(() => {
    if (searchState === "") return;
    fetchOptions("state", searchState, 1);
  }, [searchState]);

  useEffect(() => {
    if (searchCity === "") return;
    fetchOptions("city", searchCity, 1);
  }, [searchCity]);

  // Auto-fetch states when country is selected and states are empty
  useEffect(() => {
    if (selectedCountry && states.length === 0 && searchState === "") {
      fetchOptions("state", "", pageRefState.current);
    }
  }, [selectedCountry?.value, states.length, searchState]);

  // Auto-fetch cities when state is selected and cities are empty
  useEffect(() => {
    if (selectedState && cities.length === 0 && searchCity === "") {
      fetchOptions("city", "", pageRefCity.current);
    }
  }, [selectedState?.value, cities.length, searchCity]);

  // Load initial country list on mount
  useEffect(() => {
    if (!countries.length) {
      fetchOptions("country", "", 1);
    }
  }, []);

  // When country changes, clear states and cities
  useEffect(() => {
    if (selectedCountry && selectedCountry.value !== KYCformData?.country_id?.value) {
      setStates([]);
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);
      pageRefState.current = 1;
      pageRefCity.current = 1;
      setHasMoreStates(true);
      setHasMoreCities(true);
    }
  }, [selectedCountry?.value]);

  // When state changes, clear cities
  useEffect(() => {
    if (selectedState && selectedState.value !== KYCformData?.state_id?.value) {
      setCities([]);
      setSelectedCity(null);
      pageRefCity.current = 1;
      setHasMoreCities(true);
    }
  }, [selectedState?.value]);

  // Initialize/ensure selected country exists in options
  useEffect(() => {
    const val = KYCformData?.country_id?.value;
    const label = KYCformData?.country_id?.label;
    if (val && label) {
      const option: Option = { value: String(val), label: String(label) };
      setSelectedCountry(option);
      setCountries(prev => {
        const exists = prev.some(c => c.value === option.value);
        return exists ? prev : [option, ...prev];
      });
    }
  }, [KYCformData?.country_id?.value, KYCformData?.country_id?.label]);

  // When countries list updates later, re-insert selected if missing
  useEffect(() => {
    if (!selectedCountry?.value) return;
    setCountries(prev => {
      const exists = prev.some(c => c.value === selectedCountry.value);
      return exists ? prev : [selectedCountry, ...prev];
    });
  }, [selectedCountry?.value, countries.length]);

  useEffect(() => {
    if (KYCformData?.state_id?.value && KYCformData?.state_id?.label) {
      const stateOption: Option = {
        value: KYCformData.state_id.value,
        label: KYCformData.state_id.label,
      };
      setSelectedState(stateOption);
      // Add to states list if not already present
      setStates(prev => {
        const exists = prev.some(s => s.value === stateOption.value);
        return exists ? prev : [stateOption, ...prev];
      });
    }
  }, [KYCformData?.state_id?.value, KYCformData?.state_id?.label]);

  useEffect(() => {
    if (KYCformData?.city_id?.value && KYCformData?.city_id?.label) {
      const cityOption: Option = {
        value: KYCformData.city_id.value,
        label: KYCformData.city_id.label,
      };
      setSelectedCity(cityOption);
      // Add to cities list if not already present
      setCities(prev => {
        const exists = prev.some(c => c.value === cityOption.value);
        return exists ? prev : [cityOption, ...prev];
      });
    }
  }, [KYCformData?.city_id?.value, KYCformData?.city_id?.label]);

  /* <!-- ================================================ Scroll handle ================================================ --> */

  const filteredCountries = useMemo(() => countries, [countries]);
  const filteredStates = useMemo(() => states, [states]);
  const filteredCities = useMemo(() => cities, [cities]);

  /* <!-- ====================================================================== UI ====================================================================== --> */

  return (
    /* <!-- =========================================================== Form component =========================================================== --> */

    <ComponentCard title="">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dark:border-gray-800 dark:bg-[#1f2637] ">

        {/* <!-- =========================================================== Full name =========================================================== --> */}

        <div>
          <Label>Full Name <span className="text-required">*</span></Label>
          <Input
            placeholder="Enter your full name"
            className="py-3"
  error={!!errors?.full_name}
            type="text"
            value={KYCformData?.full_name}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow letters and spaces
              if (/^[a-zA-Z\s]*$/.test(value)) {
                clearError("full_name");
                setKYCFormData(prevData => ({
                  ...prevData,
                  full_name: value,
                }));
              }
            }}
          />
          {errors?.full_name && (
            <p className="error-message">{errors.full_name}</p>
          )}
        </div>

        {/* <!-- =========================================================== Mobile name =========================================================== --> */}

        <div>
          <Label>Mobile Number <span className="text-required">*</span></Label>
          <Input placeholder="Enter your mobile number" type="text"
            value={KYCformData?.mobile}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                clearError("mobile");
                setKYCFormData(prevData => ({
                  ...prevData,
                  mobile: value,
                }));
              }
            }}
            maxLength={10}
            className="py-3"
              error={!!errors?.mobile}
          />
          {errors?.mobile && (
            <p className="error-message">{errors.mobile}</p>
          )}
        </div>

        {/* <!-- =========================================================== Email =========================================================== --> */}

        <div>
          <Label>Email <span className="text-required">*</span></Label>
          <Input
            className="py-3"
  error={!!errors?.email}
            placeholder="Enter your email address"
            type="email"
            value={KYCformData?.email}
            onChange={(e) => {
              const value = e.target.value;

              // Allow empty input
              if (value === "") {
                clearError("email");
                setKYCFormData(prevData => ({
                  ...prevData,
                  email: value,
                }));
                return;
              }


              // Validate against the standard email format pattern
              const partialEmailPattern = /^[A-Z0-9._%+-]*@?[A-Z0-9.-]*\.?(in|com|i|c|co|IN|COM|I|C|CO)?$/i;
              const noConsecutiveDots = !/\.\./.test(value);
              const noStartingDot = !value.startsWith('.');
              const noMultipleAt = (value.match(/@/g) || []).length <= 1;

              if (partialEmailPattern.test(value) && noConsecutiveDots && noStartingDot && noMultipleAt) {
                clearError("email");
                setKYCFormData(prevData => ({
                  ...prevData,
                  email: value,
                }));
              }
            }}
          />

          {errors?.email && (
            <p className="error-message">{errors.email}</p>
          )}
        </div>

        {/* <!-- =========================================================== Address =========================================================== --> */}

        <div>
          <Label>Address <span className="text-required">*</span></Label>
          <Input placeholder="Enter your Address" type="text"
            className="py-3"
            value={KYCformData?.address}
            onChange={(e) => {
              clearError("address")
              setKYCFormData(prevData => ({
                ...prevData,
                address: e.target.value,
              }));
            }}
              error={!!errors?.address}
          />
          {errors?.address && (
            <p className="error-message">{errors.address}</p>
          )}
        </div>

        {/* <!-- =========================================================== Country =========================================================== --> */}

        <div>
          <Label>Select Country <span className="text-required">*</span></Label>
          <SearchableDropdown
            options={filteredCountries}
            value={KYCformData?.country_id?.value || null}
            placeholder="Select Country"
            onChange={(value: string) => {
              const selected = filteredCountries.find((c) => c.value === value);
              if (selected) {
                clearError("country_id");
                setSelectedCountry(selected);
                setKYCFormData((prevData) => ({
                  ...prevData,
                  country_id: { value: selected.value, label: selected.label },
                }));
              }
            }}
            error={!!errors?.country_id}
            searchable={true}
            onSearch={(value: string) => debounceSearch("country", value)}
            onScrollNearBottom={() => {
              if (hasMoreCountries && !loadingCountries) {
                fetchOptions("country", searchCountry, pageRefCountry.current);
              }
            }}
            footer={hasMoreCountries && loadingCountries ? <div className="px-4 py-3 text-center text-sm text-gray-400">Loading…</div> : null}
          />
          {errors?.country_id && (
            <p className="error-message">{errors.country_id}</p>
          )}
        </div>

        {/* <!-- =========================================================== State =========================================================== --> */}

        <div>
          <Label>Select State <span className="text-required">*</span></Label>
          <SearchableDropdown
            options={filteredStates}
            value={KYCformData?.state_id?.value || null}
            placeholder="Select State"
            onChange={(value: string) => {
              const selected = filteredStates.find((s) => s.value === value);
              if (selected) {
                clearError("state_id");
                setSelectedState(selected);
                setKYCFormData((prevData) => ({
                  ...prevData,
                  state_id: { value: selected.value, label: selected.label },
                }));
              }
            }}
            error={!!errors?.state_id}
            searchable={true}
            onSearch={(value: string) => debounceSearch("state", value)}
            onScrollNearBottom={() => {
              if (hasMoreStates && !loadingStates) {
                fetchOptions("state", searchState, pageRefState.current);
              }
            }}
            footer={hasMoreStates && loadingStates ? <div className="px-4 py-3 text-center text-sm text-gray-400">Loading…</div> : null}
          />
          {errors?.state_id && (
            <p className="error-message">{errors.state_id}</p>
          )}
        </div>

        {/* <!-- =========================================================== City =========================================================== --> */}

        <div>
          <Label>Select City <span className="text-required">*</span></Label>
          <SearchableDropdown
            options={filteredCities}
            value={KYCformData?.city_id?.value || null}
            placeholder="Select City"
            onChange={(value: string) => {
              const selected = filteredCities.find((c) => c.value === value);
              if (selected) {
                clearError("city_id");
                setSelectedCity(selected);
                setKYCFormData((prevData) => ({
                  ...prevData,
                  city_id: { value: selected.value, label: selected.label },
                }));
              }
            }}
            error={!!errors?.city_id}
            searchable={true}
            onSearch={(value: string) => debounceSearch("city", value)}
            onScrollNearBottom={() => {
              if (hasMoreCities && !loadingCities) {
                fetchOptions("city", searchCity, pageRefCity.current);
              }
            }}
            footer={hasMoreCities && loadingCities ? <div className="px-4 py-3 text-center text-sm text-gray-400">Loading…</div> : null}
          />
          {errors?.city_id && (
            <p className="error-message">{errors.city_id}</p>
          )}
        </div>

        <div>
          <Label>Pincode <span className="text-required">*</span></Label>
          <Input
            placeholder="Enter your Pincode"
            type="text"
            value={KYCformData?.pincode}
            maxLength={6}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                clearError("pincode");
                setKYCFormData(prevData => ({
                  ...prevData,
                  pincode: value,
                }));
              }
            }}
            className="py-3"
              error={!!errors?.pincode}
          />
          {errors?.pincode && (
            <p className="error-message">{errors.pincode}</p>
          )}
        </div>
      </div>

    </ComponentCard >
  );
}
