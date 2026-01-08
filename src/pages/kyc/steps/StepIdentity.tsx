import Input from "@/components/common/Input";
import Label from "@/components/form/Label";

export default function StepIdentity() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

 <div>
          <Label>PAN Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter your PAN Number"
              type="text"
            />
          </div>
        </div>
        <div>
          <Label>Aadhaar Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter your Aadhaar Number"
              type="text"
            />
          </div>
        </div>
        <div>
          <Label>Business Name</Label>
          <div className="relative">
            <Input
              placeholder="Enter your Business Name"
              type="text"
            />
          </div>
        </div>
        <div>
          <Label>GST Number</Label>
          <div className="relative">
            <Input
              placeholder="Enter your GST Number"
              type="text"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
