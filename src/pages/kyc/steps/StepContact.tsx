"use client";
import React from "react";
import { ChevronDownIcon } from "../../../icons";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/common/Input";
import Select from "@/components/form/Select";

const options = [
  { value: "marketing", label: "Marketing" },
  { value: "template", label: "Template" },
  { value: "development", label: "Development" },
];

export default function InputGroup() {

  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };
  return (
    <ComponentCard title="">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Full Name</Label>
          <div className="relative">
            <Input
              placeholder="Enter your full name"
              type="text"
            />
          </div>
        </div>
        <div>
          <Label>Mobile Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter your mobile number"
              type="text"
            />
          </div>
        </div>
        <div>
          <Label>Address Line 1</Label>
          <div className="relative">
            <Input
              placeholder="Enter your Address line 1"
              type="text"
            />
          </div>
        </div>
        <div>
          <Label>Address Line 2</Label>
          <div className="relative">
            <Input
              placeholder="Enter your Address line 2"
              type="text"
            />
          </div>
        </div>
        <div>
          <Label>Select Country</Label>
          <div className="relative">
            <Select
              options={options}
              placeholder="Select Country"
              onChange={() => {}}
              className="dark:bg-dark-900"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon />
            </span>
          </div>
        </div>
        <div>
          <Label>Select State</Label>
          <div className="relative">
            <Select
              options={options}
              placeholder="Select State"
              onChange={() => {}}
              className="dark:bg-dark-900"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        <div>
          <Label>Select City</Label>
          <div className="relative">
            <Select
              options={options}
              placeholder="Select City"
              onChange={() => {}}
              className="dark:bg-dark-900"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon />
            </span>
          </div>
        </div>
        <div>
          <Label>Pincode</Label>
          <div className="relative">
            <Input
              placeholder="Enter your Pincode"
              type="text"
            />
          </div>
        </div>
      </div>
    </ComponentCard>
  );
}

