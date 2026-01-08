import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { ChevronDownIcon } from "@/icons";

const options = [
  { value: "marketing", label: "Marketing" },
  { value: "template", label: "Template" },
  { value: "development", label: "Development" },
];
export default function StepBankDetails() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

 <div>
          <Label>Bank Account Holder Name</Label>
          <div className="relative">
            <Input
                 placeholder="Enter Bank Account Holder Name"
              type="text"
            />
          </div>
        </div>
        <div>
          <Label>Account Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter Account Number"
              type="text"
            />
          </div>
        </div>
        <div>
          <Label>Confirm Account Number</Label>
          <div className="relative">
            <Input
              placeholder="Re-enter Account Number"
              type="text"
            />
          </div>
        </div>
        <div>
          <Label>IFSC Code</Label>
          <div className="relative">
            <Input
              placeholder="Enter your IFSC Code"
              type="text"
            />
          </div>
        </div>
         <div>
          <Label>Account Type</Label>
          <div className="relative">
            <Select
              options={options}
              placeholder="Account Type"
              onChange={() => {}}
              className="dark:bg-dark-900"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <ChevronDownIcon />
            </span>
          </div>
        </div>
        {/* Full width placeholder area (future use: MICR, Branch etc.) */}
        <div className="hidden md:block"></div>
      </div>
    </div>
  );
}
