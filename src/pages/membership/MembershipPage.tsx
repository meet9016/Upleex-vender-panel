"use client";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
// import AgGridTable from "@/components/tables/AgGridTable";
ModuleRegistry.registerModules([AllCommunityModule]);

const MembershipPage = () => {
  return (
    <div>
      {/* <AgGridTable 
       buttonName={""}
       tableName={"Membership"}
       addButtonLink={(`/membership`)}
      /> */}
    </div>
  );
};

export default MembershipPage;
