"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { ChevronDownIcon } from "../../../icons";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/common/Input";
import { api } from "@/utils/axiosInstance";

// Types for Country, State, City Options
type Option = {
  value: string;
  label: string;
};

export default function InputGroup() {
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

  const pageRefCountry = useRef(1);
  const pageRefState = useRef(1);
  const pageRefCity = useRef(1);

  const loaderRefCountry = useRef(null);
  const loaderRefState = useRef(null);
  const loaderRefCity = useRef(null);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

const fetchOptions = useCallback(async (type: string, search: string, page: number) => {
  if (loading) return;
  setLoading(true);
  try {
    const formData = new FormData();
    formData.append("page", String(page));
    formData.append("search", search);

    let res;
    if (type === "country") {
      res = await api.post("/vendor-country-list", formData);
    } else if (type === "state") {
      if (selectedCountry?.value) {
        formData.append("country_id", selectedCountry.value);
      }
      res = await api.post("/vendor-state-list", formData);
    } else if (type === "city") {
      if (selectedState?.value) {
        formData.append("state_id", selectedState.value);
      }
      res = await api.post("/vendor-city-list", formData);
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
  } catch (err) {
    console.error(`Failed to fetch ${type}`, err);
  } finally {
    setLoading(false);
  }
}, [loading, selectedCountry, selectedState]);


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
    if (openCountry) fetchOptions("country", searchCountry, pageRefCountry.current);
    if (openState) fetchOptions("state", searchState, pageRefState.current);
    if (openCity) fetchOptions("city", searchCity, pageRefCity.current);
  }, [openCountry, openState, openCity, searchCountry, searchState, searchCity]);

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

  return (
    <ComponentCard title="">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Full Name</Label>
          <Input placeholder="Enter your full name" type="text" />
        </div>

        <div>
          <Label>Mobile Number</Label>
          <Input placeholder="Enter your mobile number" type="text" />
        </div>

        <div>
          <Label>Address Line 1</Label>
          <Input placeholder="Enter your Address line 1" type="text" />
        </div>

        <div>
          <Label>Address Line 2</Label>
          <Input placeholder="Enter your Address line 2" type="text" />
        </div>

        {/* COUNTRY DROPDOWN */}
        <div>
          <Label>Select Country</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenCountry((v) => !v)}
              className="flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm"
            >
              <span className={selectedCountry ? "" : "text-gray-400"}>
                {selectedCountry?.label || "Select Country"}
              </span>
              <ChevronDownIcon />
            </button>
            {openCountry && (
              <div className="absolute z-100 mt-1 w-full rounded-lg border bg-white shadow">
                <div className="max-h-60 overflow-auto">
                  <Input
                    type="text"
                    placeholder="Search Country"
                    onChange={(e) => debounceSearch("country", e.target.value)}
                  />
                  {filteredCountries.map((country) => (
                    <div
                      key={country.value}
                      onClick={() => {
                        setSelectedCountry(country);
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
        </div>

        {/* STATE DROPDOWN */}
        <div>
          <Label>Select State</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenState((v) => !v)}
              className="flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm"
            >
              <span className={selectedState ? "" : "text-gray-400"}>
                {selectedState?.label || "Select State"}
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
                  {filteredStates.map((state) => (
                    <div
                      key={state.value}
                      onClick={() => {
                        setSelectedState(state);
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
        </div>

        {/* CITY DROPDOWN */}
        <div>
          <Label>Select City</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenCity((v) => !v)}
              className="flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm"
            >
              <span className={selectedCity ? "" : "text-gray-400"}>
                {selectedCity?.label || "Select City"}
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
                  {filteredCities.map((city) => (
                    <div
                      key={city.value}
                      onClick={() => {
                        setSelectedCity(city);
                        setOpenCity(false);
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
        </div>

        <div>
          <Label>Pincode</Label>
          <Input placeholder="Enter your Pincode" type="text" />
        </div>
      </div>
    </ComponentCard>
  );
}
