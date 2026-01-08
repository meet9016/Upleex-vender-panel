import DocumentUpload from "./DocumentUpload";


export default function StepDocument() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">

      {/* PAN Front */}
      <DocumentUpload label="PAN Card (Front)" />

      {/* Aadhaar Front */}
      <DocumentUpload label="Aadhaar Card (Front)" />

      {/* Aadhaar Back */}
      <DocumentUpload label="Aadhaar Card (Back)" />

      {/* GST Certificate */}
      <DocumentUpload label="GST Certificate" />

    </div>
  );
}
