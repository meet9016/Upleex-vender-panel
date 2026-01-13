"use client";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
// import AgGridTable from "@/components/tables/AgGridTable";
ModuleRegistry.registerModules([AllCommunityModule]);

const OrderList = () => {
  return (
    <div>
      {/* <AgGridTable 
       buttonName={""}
       tableName={"Order"}
       addButtonLink={(`/order`)}
      /> */}
    </div>
  );
};

export default OrderList;
