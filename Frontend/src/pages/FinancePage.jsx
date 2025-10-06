import React from "react";
import FinanceCards from "../components/Finance/FinanceCards";
import FinanceFilterBar from "../components/Finance/FinanceFilters";
import FinanceTable from "../components/Finance/FinanceTable";

const FinancePage = () => {
  return (
    <div className="p-6 bg-[#f8f9fb] min-h-screen">
      <div className="text-2xl font-bold text-gray-800 mb-1">My Finance</div>
      <p className="text-sm text-gray-500 mb-6">
        Manage all financial transactions and patient payments
      </p>

      <FinanceCards />
      <FinanceFilterBar />
      <FinanceTable />
    </div>
  );
};

export default FinancePage;
