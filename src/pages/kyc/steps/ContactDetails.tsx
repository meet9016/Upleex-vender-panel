"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { ChevronDownIcon } from "../../../icons";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/common/Input";
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

  const [loading, setLoading] = useState(false);
  const [hasMoreCountries, setHasMoreCountries] = useState(true);
  const [hasMoreStates, setHasMoreStates] = useState(true);
  const [hasMoreCities, setHasMoreCities] = useState(true);

  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);
  const [openCity, setOpenCity] = useState(false);

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

  const loaderRefCountry = useRef(null);
  const loaderRefState = useRef(null);
  const loaderRefCity = useRef(null);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  /* <!-- ================================== fetch country, state, city from API ================================== --> */

  const fetchOptions = useCallback(async (type: string, search: string, page: number) => {

    if (loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("page", String(page));
      formData.append("search", search);

      let res;
      if (type === "country") {
        res = await api.post(`${endPointApi.postVendorCountryList}`, formData);
      } else if (type === "state") {
        if (selectedCountry?.value) {
          formData.append("country_id", selectedCountry.value);
        }
        res = await api.post(`${endPointApi.postVendorStateList}`, formData);
      } else if (type === "city") {
        if (selectedState?.value) {
          formData.append("state_id", selectedState.value);
        }
        res = await api.post(`${endPointApi.postVendorCityList}`, formData);
      }

      const list = res?.data?.data || [];

      if (list.length === 0) {
        if (type === "country") setHasMoreCountries(false);
        if (type === "state") setHasMoreStates(false);
        if (type === "city") setHasMoreCities(false);
        return;
      }

      if (type === "country") {
        setCountries((prev) => [...prev, ...list.map((item: any) => ({
          value: String(item.id),
          label: item.country_name
        }))]);
      }
      if (type === "state") {
        setStates((prev) => [...prev, ...list.map((item: any) => ({
          value: String(item.id),
          label: item.state_name
        }))]);
      }
      if (type === "city") {
        setCities((prev) => [...prev, ...list.map((item: any) => ({
          value: String(item.id),
          label: item.city_name
        }))]);
      }

      if (type === "country") pageRefCountry.current += 1;
      if (type === "state") pageRefState.current += 1;
      if (type === "city") pageRefCity.current += 1;
    } catch (error) {
      console.error(`Failed to fetch ${type}`, error);
    } finally {
      setLoading(false);
    }
  }, [loading, selectedCountry, selectedState]);


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
    fetchOptions("country", searchCountry, pageRefCountry.current);
  }, [searchCountry]);

  useEffect(() => {
    if (searchState === "") return;
    fetchOptions("state", searchState, pageRefState.current);
  }, [searchState]);

  useEffect(() => {
    if (searchCity === "") return;
    fetchOptions("city", searchCity, pageRefCity.current);
  }, [searchCity]);

  useEffect(() => {
    if (openCountry) {
      fetchOptions("country", searchCountry, pageRefCountry.current)
      setOpenState(false)
      setOpenCity(false)
    };
    if (openState) {
      fetchOptions("state", searchState, pageRefState.current)
      setOpenCountry(false)
      setOpenCity(false)
    };
    if (openCity) {
      fetchOptions("city", searchCity, pageRefCity.current)
      setOpenCountry(false)
      setOpenState(false)
    };
  }, [openCountry, openState, openCity, searchCountry, searchState, searchCity]);

  /* <!-- ================================================ Scroll handle ================================================ --> */

  const filteredCountries = useMemo(() => countries, [countries]);
  const filteredStates = useMemo(() => states, [states]);
  const filteredCities = useMemo(() => cities, [cities]);

  const handleScrollObserver = useCallback((ref: any, type: string) => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (type === "country") fetchOptions("country", searchCountry, pageRefCountry.current);
          if (type === "state") fetchOptions("state", searchState, pageRefState.current);
          if (type === "city") fetchOptions("city", searchCity, pageRefCity.current);
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [searchCountry, searchState, searchCity, fetchOptions]);

  useEffect(() => {
    if (loaderRefCountry.current) handleScrollObserver(loaderRefCountry, "country");
    if (loaderRefState.current) handleScrollObserver(loaderRefState, "state");
    if (loaderRefCity.current) handleScrollObserver(loaderRefCity, "city");
  }, [handleScrollObserver]);

  /* <!-- ====================================================================== UI ====================================================================== --> */

  return (
    /* <!-- =========================================================== Form component =========================================================== --> */

    <ComponentCard title="">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* <!-- =========================================================== Full name =========================================================== --> */}

        <div>
          <Label>Full Name <span className="text-red-500">*</span></Label>

          <Input placeholder="Enter your full name" type="text"
            value={KYCformData.full_name}
            onFocus={() => clearError("full_name")}
            onChange={(e) => {
              setKYCFormData(prevData => ({
                ...prevData,
                full_name: e.target.value,
              }));
            }} />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
          )}
        </div>

        {/* <!-- =========================================================== Mobile name =========================================================== --> */}

        <div>
          <Label>Mobile Number<span className="text-red-500">*</span></Label>
          <Input placeholder="Enter your mobile number" type="text"
            value={KYCformData.mobile}
            onFocus={() => clearError("mobile")}
            onChange={(e) => {
              setKYCFormData(prevData => ({
                ...prevData,
                mobile: e.target.value,
              }));
            }}
            maxLength={10}
          />
          {errors.mobile && (
            <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>
          )}
        </div>

        {/* <!-- =========================================================== Email =========================================================== --> */}

        <div>
          <Label>Email<span className="text-red-500">*</span></Label>
          <Input placeholder="Enter your email address" type="email"
            value={KYCformData.email}
            onFocus={() => clearError("email")}

            onChange={(e) => {
              setKYCFormData(prevData => ({
                ...prevData,
                email: e.target.value,
              }));
            }}

          />

          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* <!-- =========================================================== Address =========================================================== --> */}

        <div>
          <Label>Address<span className="text-red-500">*</span></Label>
          <Input placeholder="Enter your Address" type="text"
            value={KYCformData.address}
            onFocus={() => clearError("address")}
            onChange={(e) => {
              setKYCFormData(prevData => ({
                ...prevData,
                address: e.target.value,
              }));
            }}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-500">{errors.address}</p>
          )}
        </div>

        {/* <!-- =========================================================== Country =========================================================== --> */}

        <div>
          <Label>Select Country<span className="text-red-500">*</span></Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                clearError("country_id");
                setOpenCountry(v => !v);
              }}
              className="flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm"
            >
              <span className={KYCformData.country_id.label ? "" : "text-gray-400"}>
                {KYCformData.country_id.label || "Select Country"}
              </span>
              <ChevronDownIcon />
            </button>
            {openCountry && (
              <div className="absolute z-100 mt-1 w-full rounded-lg border bg-white shadow">
                <div className="max-h-60 overflow-auto p-1">
                  <Input
                    type="text"
                    placeholder="Search Country"
                    onChange={(e) => debounceSearch("country", e.target.value)}
                  />
                  {filteredCountries.map((country, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedCountry(country);
                        setKYCFormData(prevData => ({
                          ...prevData,
                          country_id: { value: country.value, label: country.label },
                        }));
                        setOpenCountry(false);
                      }}
                      className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      {country.label}
                    </div>
                  ))}

                  {hasMoreCountries && (
                    <div ref={loaderRefCountry} className="px-4 py-3 text-center text-sm text-gray-400">
                      {loading ? "Loading…" : "Load more"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {errors.country_id && (
            <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
          )}
        </div>

        {/* <!-- =========================================================== State =========================================================== --> */}

        <div>
          <Label>Select State<span className="text-red-500">*</span></Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                clearError("state_id");
                setOpenState((v) => !v)
              }}
              className="flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm"
            >
              <span className={KYCformData.state_id.label ? "" : "text-gray-400"}>
                {KYCformData.state_id.label || "Select State"}
              </span>
              <ChevronDownIcon />
            </button>
            {openState && (
              <div className="absolute z-100 mt-1 w-full rounded-lg border bg-white shadow">
                <div className="max-h-60 overflow-auto">
                  <Input
                    type="text"
                    placeholder="Search State"
                    onChange={(e) => debounceSearch("state", e.target.value)}
                  />
                  {filteredStates.map((state, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedState(state);
                        setKYCFormData(prevData => ({
                          ...prevData, // Spread the previous form data to retain other fields
                          state_id: { value: state.value, label: state.label }, // Set the new country_id
                        }));
                        setOpenState(false);
                      }}
                      className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      {state.label}
                    </div>
                  ))}
                  {hasMoreStates && (
                    <div ref={loaderRefState} className="px-4 py-3 text-center text-sm text-gray-400">
                      {loading ? "Loading…" : "Load more"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.state_id && (
            <p className="mt-1 text-sm text-red-500">{errors.state_id}</p>
          )}
        </div>

        {/* <!-- =========================================================== City =========================================================== --> */}

        <div>
          <Label>Select City<span className="text-red-500">*</span></Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                clearError("city_id");
                setOpenCity((v) => !v)
              }}
              className="flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm"
            >
              <span className={KYCformData.city_id.label ? "" : "text-gray-400"}>
                {KYCformData.city_id.label || "Select City"}
              </span>
              <ChevronDownIcon />
            </button>
            {openCity && (
              <div className="absolute z-100 mt-1 w-full rounded-lg border bg-white shadow">
                <div className="max-h-60 overflow-auto">
                  <Input
                    type="text"
                    placeholder="Search City"
                    onChange={(e) => debounceSearch("city", e.target.value)}
                  />
                  {filteredCities.map((city, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedCity(city);
                        setOpenCity(false);
                        setKYCFormData(prevData => ({
                          ...prevData, // Spread the previous form data to retain other fields
                          city_id: { value: city.value, label: city.label }, // Set the new country_id
                        }));
                      }}
                      className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      {city.label}
                    </div>
                  ))}
                  {hasMoreCities && (
                    <div ref={loaderRefCity} className="px-4 py-3 text-center text-sm text-gray-400">
                      {loading ? "Loading…" : "Load more"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.city_id && (
            <p className="mt-1 text-sm text-red-500">{errors.city_id}</p>
          )}
        </div>

        <div>
          <Label>Pincode<span className="text-red-500">*</span></Label>
          <Input placeholder="Enter your Pincode" type="text"
            value={KYCformData.pincode}
            onFocus={() => clearError("pincode")}
            onChange={(e) => {
              setKYCFormData(prevData => ({
                ...prevData,
                pincode: e.target.value,
              }));
            }} />
          {errors.pincode && (
            <p className="mt-1 text-sm text-red-500">{errors.pincode}</p>
          )}
        </div>
      </div>

    </ComponentCard >
  );
}
