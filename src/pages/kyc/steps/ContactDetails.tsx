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
  extra?: any;
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
  const fetchOptions = useCallback(async (
    type: string,
    search: string,
    page: number,
    parentId?: string // explicit parent ID to avoid stale closure
  ) => {
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
        // Use explicit parentId first, then fall back to selectedCountry
        const countryId = parentId || selectedCountry?.value;
        if (countryId) {
          payload.country_id = countryId;
        }
        res = await api.post(endPointApi.postVendorStateList as string, payload);
      } else if (type === "city") {
        if (!endPointApi.postVendorCityList) {
          throw new Error("City endpoint not configured");
        }
        // Use explicit parentId first, then fall back to selectedState
        const stateId = parentId || selectedState?.value;
        if (stateId && search === "") {
          payload.state_id = stateId;
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
          list.map((item: any) => ({ value: String(item.id), label: item.state_name, extra: item })) :
          [...prev, ...list.map((item: any) => ({ value: String(item.id), label: item.state_name, extra: item }))]
        );
        pageRefState.current += 1;
      }
      if (type === "city") {
        setCities((prev) => page === 1 ?
          list.map((item: any) => ({ value: String(item.id), label: item.city_name, extra: item })) :
          [...prev, ...list.map((item: any) => ({ value: String(item.id), label: item.city_name, extra: item }))]
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

  // Auto-fetch states when country is selected, search is empty
  useEffect(() => {
    if (selectedCountry?.value && searchState === "") {
      // If we only have the auto-selected state, or no states, fetch full list
      if (states.length <= 1) {
        pageRefState.current = 1;
        fetchOptions("state", "", 1, selectedCountry.value);
      }
    }
  }, [selectedCountry?.value, searchState]);

  // Auto-fetch cities when state is selected, search is empty
  useEffect(() => {
    if (selectedState?.value && searchCity === "") {
      // If we only have the auto-selected city, or no cities, fetch full list
      if (cities.length <= 1) {
        pageRefCity.current = 1;
        fetchOptions("city", "", 1, selectedState.value);
      }
    }
  }, [selectedState?.value, searchCity]);

  // Load initial country list on mount (states and cities will load reactively
  // after selectedCountry/selectedState are synced from KYCformData)
  useEffect(() => {
    if (!countries.length) fetchOptions("country", "", 1);

    // Sync from localStorage if KYCformData is missing city/state/country
    const storedCityId = localStorage.getItem('city_id');
    if (storedCityId && storedCityId.includes('-')) {
      const parts = storedCityId.split('-');
      if (parts.length >= 3) {
        const cityName = parts[parts.length - 1];
        const stateId = parts.slice(0, -1).join('-');
        const countryId = parts[0];

        setKYCFormData(prev => {
          const needsUpdate = !prev.city_id.value || !prev.state_id.value || !prev.country_id.value;
          if (!needsUpdate) return prev;

          const updated = {
            ...prev,
            city_id: prev.city_id.value ? prev.city_id : { value: storedCityId, label: cityName },
            state_id: prev.state_id.value ? prev.state_id : { value: stateId, label: "" },
            country_id: prev.country_id.value ? prev.country_id : { value: countryId, label: "" }
          };
          return updated;
        });
      }
    }
  }, []); // Only run on mount or when city_id is missing initially

  // Auto-fill state and country based on city_id value if they are missing
  useEffect(() => {
    if (KYCformData?.city_id?.value && KYCformData.city_id.value.includes('-')) {
      const parts = KYCformData.city_id.value.split('-');
      if (parts.length >= 3) {
        const countryId = parts[0];
        const stateId = parts.slice(0, -1).join('-');
        const cityName = parts[parts.length - 1];

        const needsUpdate = 
          !KYCformData.state_id.value || 
          !KYCformData.country_id.value || 
          !KYCformData.city_id.label || 
          KYCformData.city_id.label === KYCformData.city_id.value;

        if (needsUpdate) {
          setKYCFormData(prev => ({
            ...prev,
            city_id: { 
              value: prev.city_id.value, 
              label: prev.city_id.label && prev.city_id.label !== prev.city_id.value ? prev.city_id.label : cityName 
            },
            state_id: prev.state_id.value ? prev.state_id : { value: stateId, label: "" },
            country_id: prev.country_id.value ? prev.country_id : { value: countryId, label: "" }
          }));
        }
      }
    }
  }, [KYCformData?.city_id?.value]);

  // Removed the buggy useEffects that tried to clear states/cities.
  // Clearing dependent arrays is now handled explicitly in the onChange handlers.

  // Initialize/ensure selected country exists in options
  useEffect(() => {
    const val = KYCformData?.country_id?.value;
    const label = KYCformData?.country_id?.label;
    if (val) {
      let finalLabel = label || val;
      // Special case for common IDs to improve UX immediately
      if (!label || label === val) {
        if (val === "IN") finalLabel = "India";
      }
      
      const option: Option = { value: String(val), label: String(finalLabel) };
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

    // Fix label if it was just the ID or empty
    const currentLabel = selectedCountry.label;
    if (!currentLabel || currentLabel === selectedCountry.value) {
      const match = countries.find(c => c.value === selectedCountry.value && c.label && c.label !== c.value);
      if (match) {
        setSelectedCountry(match);
        setKYCFormData(prev => ({ ...prev, country_id: match }));
      }
    }
  }, [selectedCountry?.value, countries]);

  useEffect(() => {
    if (KYCformData?.state_id?.value) {
      const stateOption: Option = {
        value: KYCformData.state_id.value,
        label: KYCformData.state_id.label || KYCformData.state_id.value,
      };
      setSelectedState(stateOption);
      // Add to states list if not already present
      setStates(prev => {
        const exists = prev.some(s => s.value === stateOption.value);
        return exists ? prev : [stateOption, ...prev];
      });
    }
  }, [KYCformData?.state_id?.value, KYCformData?.state_id?.label]);

  // When states list updates later (e.g. page=1 fetch replaces list), re-insert selected if missing
  useEffect(() => {
    if (!selectedState?.value) return;
    setStates(prev => {
      const exists = prev.some(s => s.value === selectedState.value);
      return exists ? prev : [selectedState, ...prev];
    });

    // Fix label if it was just the ID or empty
    const currentLabel = selectedState.label;
    if (!currentLabel || currentLabel === selectedState.value) {
      const match = states.find(s => s.value === selectedState.value && s.label && s.label !== s.value);
      if (match) {
        setSelectedState(match);
        setKYCFormData(prev => ({ ...prev, state_id: match }));
      }
    }
  }, [selectedState?.value, states]);

  useEffect(() => {
    if (KYCformData?.city_id?.value) {
      const val = KYCformData.city_id.value;
      const label = KYCformData.city_id.label;
      let finalLabel = label || val;
      
      // If label is missing and it's a composite ID, try to parse the name
      if (!label || label === val) {
        if (val.includes('-')) {
          const parts = val.split('-');
          finalLabel = parts[parts.length - 1];
        }
      }

      const cityOption: Option = {
        value: val,
        label: finalLabel,
      };
      setSelectedCity(cityOption);
      // Add to cities list if not already present
      setCities(prev => {
        const exists = prev.some(c => c.value === cityOption.value);
        return exists ? prev : [cityOption, ...prev];
      });
    }
  }, [KYCformData?.city_id?.value, KYCformData?.city_id?.label]);

  // When cities list updates later, re-insert selected if missing and fix label/auto-fill state/country
  useEffect(() => {
    if (!KYCformData?.city_id?.value) return;
    const val = KYCformData.city_id.value;
    
    setCities(prev => {
      const exists = prev.some(c => c.value === val);
      return exists ? prev : [selectedCity || { value: val, label: KYCformData.city_id.label || val }, ...prev];
    });

    // Try to find a match in the loaded cities list to fix the label and auto-fill state/country
    const match = cities.find(c => c.value === val);
    if (match && match.extra) {
      const cityData = match.extra;
      const newState = cityData?.state_id ? { value: String(cityData.state_id), label: cityData.state_name } : null;
      const newCountry = cityData?.country_id ? { value: String(cityData.country_id), label: cityData.country_name } : null;

      // Update if label is missing/wrong or if state/country are not set
      const currentLabel = KYCformData.city_id.label;
      const shouldUpdate = 
        !currentLabel || 
        currentLabel === val ||
        KYCformData.city_id.label !== match.label ||
        (newState && KYCformData.state_id.value !== newState.value) ||
        (newCountry && KYCformData.country_id.value !== newCountry.value);

      if (shouldUpdate) {
        setKYCFormData(prev => ({
          ...prev,
          city_id: match,
          ...(newState && { state_id: newState }),
          ...(newCountry && { country_id: newCountry }),
        }));
        if (newState) {
          setSelectedState(newState);
          setStates(prev => prev.some(s => s.value === newState.value) ? prev : [newState, ...prev]);
        }
        if (newCountry) {
          setSelectedCountry(newCountry);
          setCountries(prev => prev.some(c => c.value === newCountry.value) ? prev : [newCountry, ...prev]);
        }
      }
    } else if (match) {
      // Just fix the label if no extra data but we found the name
      const currentLabel = KYCformData.city_id.label;
      if (!currentLabel || currentLabel === val) {
        setKYCFormData(prev => ({ ...prev, city_id: match }));
        setSelectedCity(match);
      }
    }
  }, [KYCformData?.city_id?.value, cities]);

  /* <!-- ================================================ Scroll handle ================================================ --> */

  const filteredCountries = useMemo(() => countries, [countries]);
  const filteredStates = useMemo(() => states, [states]);
  const filteredCities = useMemo(() => cities, [cities]);

  /* <!-- ====================================================================== UI ====================================================================== --> */

  return (
    /* <!-- =========================================================== Form component =========================================================== --> */

    <ComponentCard title="Contact Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dark:border-gray-800 dark:bg-[#1f2637]  ">

        {/* <!-- =========================================================== Full name =========================================================== --> */}

        <div>
          <Label required>Full Name</Label>
          <Input
            placeholder="Enter your full name"
            className="py-3"
            error={!!errors?.full_name}
            type="text"
            value={KYCformData?.full_name}
            onChange={(e) => {
              const value = e.target.value;
              clearError("full_name");
              setKYCFormData(prevData => ({
                ...prevData,
                full_name: value,
              }));
            }}
          />
          {errors?.full_name && (
            <p className="error-message">{errors.full_name}</p>
          )}
        </div>

        {/* <!-- =========================================================== Mobile name =========================================================== --> */}

        <div>
          <Label required>Mobile Number</Label>
          <Input placeholder="Enter your mobile number" type="text"
            disabled
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
          <Label required>Email</Label>
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
          <Label required>Address</Label>
          <Input placeholder="Enter your Address" type="text"
            className="py-3"
            value={KYCformData?.address}
            infoTooltip="This address will be shown to users."
            onChange={(e) => {
              clearError("address");
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

        {/* <!-- =========================================================== City =========================================================== --> */}

        <div>
          <Label required>Select City</Label>
          <SearchableDropdown
            options={filteredCities}
            value={KYCformData?.city_id?.value || null}
            placeholder="Select City"
            onChange={(value: string) => {
              const selected = filteredCities.find((c) => c.value === value);
              if (selected) {
                clearError("city_id");

                // Auto-select state and country from metadata
                const cityData = selected.extra;
                const newState = cityData?.state_id ? { value: String(cityData.state_id), label: cityData.state_name } : null;
                const newCountry = cityData?.country_id ? { value: String(cityData.country_id), label: cityData.country_name } : null;

                if (newState) clearError("state_id");
                if (newCountry) clearError("country_id");

                setKYCFormData((prevData) => ({
                  ...prevData,
                  city_id: { value: selected.value, label: selected.label },
                  ...(newState && { state_id: newState }),
                  ...(newCountry && { country_id: newCountry }),
                }));

                if (newState) {
                  setSelectedState(newState);
                  setStates((prev) => {
                    const exists = prev.some(s => s.value === newState.value);
                    return exists ? prev : [newState, ...prev];
                  });
                }
                if (newCountry) {
                  setSelectedCountry(newCountry);
                  setCountries((prev) => {
                    const exists = prev.some(c => c.value === newCountry.value);
                    return exists ? prev : [newCountry, ...prev];
                  });
                }
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

        {/* <!-- =========================================================== State =========================================================== --> */}

        <div>
          <Label required>Select State</Label>
          <SearchableDropdown
            options={filteredStates}
            value={KYCformData?.state_id?.value || null}
            placeholder="Select State"
            onChange={(value: string) => {
              const selected = filteredStates.find((s) => s.value === value);
              if (selected) {
                clearError("state_id");

                // Auto-select country from metadata
                const stateData = selected.extra;
                const newCountry = stateData?.country_id ? { value: String(stateData.country_id), label: stateData.country_name } : null;
                if (newCountry) clearError("country_id");

                // Clear dependent cities
                setCities([]);
                setSelectedCity(null);
                pageRefCity.current = 1;
                setHasMoreCities(true);

                setSelectedState(selected);
                setKYCFormData((prevData) => ({
                  ...prevData,
                  state_id: { value: selected.value, label: selected.label },
                  city_id: { value: "", label: "" },
                  ...(newCountry && { country_id: newCountry }),
                }));

                if (newCountry) {
                  setSelectedCountry(newCountry);
                  setCountries((prev) => prev.some(c => c.value === newCountry.value) ? prev : [newCountry, ...prev]);
                }
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
        {/* <!-- =========================================================== Country =========================================================== --> */}

        <div>
          <Label required>Select Country</Label>
          <SearchableDropdown
            options={filteredCountries}
            value={KYCformData?.country_id?.value || null}
            placeholder="Select Country"
            onChange={(value: string) => {
              const selected = filteredCountries.find((c) => c.value === value);
              if (selected) {
                clearError("country_id");

                // Clear dependent states
                setStates([]);
                setSelectedState(null);
                pageRefState.current = 1;
                setHasMoreStates(true);

                // Clear dependent cities
                setCities([]);
                setSelectedCity(null);
                pageRefCity.current = 1;
                setHasMoreCities(true);

                setSelectedCountry(selected);
                setKYCFormData((prevData) => ({
                  ...prevData,
                  country_id: { value: selected.value, label: selected.label },
                  state_id: { value: "", label: "" },
                  city_id: { value: "", label: "" },
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


        <div>
          <Label required>Pincode</Label>
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

      {/* Pickup Address Section */}
      <ComponentCard title="Pickup Address (Optional)" className="mt-6">
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                If different from contact address, courier will pick up from here
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setKYCFormData(prev => ({
                  ...prev,
                  pickup_address: KYCformData.address,
                  pickup_pincode: KYCformData.pincode,
                  pickup_country_id: KYCformData.country_id,
                  pickup_state_id: KYCformData.state_id,
                  pickup_city_id: KYCformData.city_id,
                }));
                toast.success("Contact address copied to pickup address!");
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white dark:bg-gray-800 border border-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy from Contact
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Address</Label>
            <Input
              placeholder="Pickup address"
              className="py-3"
              type="text"
              value={KYCformData?.pickup_address}
              onChange={(e) => {
                setKYCFormData(prev => ({
                  ...prev,
                  pickup_address: e.target.value,
                }));
              }}
            />
          </div>

          <div>
            <Label>City</Label>
            <SearchableDropdown
              options={filteredCities}
              value={KYCformData?.pickup_city_id?.value || null}
              placeholder="Select Pickup City"
              onChange={(value: string) => {
                const selected = filteredCities.find((c) => c.value === value);
                if (selected) {
                  setKYCFormData(prev => ({
                    ...prev,
                    pickup_city_id: { value: selected.value, label: selected.label },
                  }));
                }
              }}
              searchable={true}
              onSearch={(value: string) => debounceSearch("city", value)}
              onScrollNearBottom={() => {
                if (hasMoreCities && !loadingCities) {
                  fetchOptions("city", searchCity, pageRefCity.current);
                }
              }}
            />
          </div>

          <div>
            <Label>State</Label>
            <SearchableDropdown
              options={filteredStates}
              value={KYCformData?.pickup_state_id?.value || null}
              placeholder="Select Pickup State"
              onChange={(value: string) => {
                const selected = filteredStates.find((s) => s.value === value);
                if (selected) {
                  setKYCFormData(prev => ({
                    ...prev,
                    pickup_state_id: { value: selected.value, label: selected.label },
                  }));
                }
              }}
              searchable={true}
              onSearch={(value: string) => debounceSearch("state", value)}
            />
          </div>

          <div>
            <Label>Country</Label>
            <SearchableDropdown
              options={filteredCountries}
              value={KYCformData?.pickup_country_id?.value || null}
              placeholder="Select Pickup Country"
              onChange={(value: string) => {
                const selected = filteredCountries.find((c) => c.value === value);
                if (selected) {
                  setKYCFormData(prev => ({
                    ...prev,
                    pickup_country_id: { value: selected.value, label: selected.label },
                  }));
                }
              }}
              searchable={true}
              onSearch={(value: string) => debounceSearch("country", value)}
            />
          </div>

          <div>
            <Label>Pincode</Label>
            <Input
              placeholder="Pickup pincode"
              type="text"
              maxLength={6}
              value={KYCformData?.pickup_pincode}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) {
                  setKYCFormData(prev => ({
                    ...prev,
                    pickup_pincode: value,
                  }));
                }
              }}
              className="py-3"
            />
          </div>
        </div>
      </ComponentCard>

    </ComponentCard >
  );
}
