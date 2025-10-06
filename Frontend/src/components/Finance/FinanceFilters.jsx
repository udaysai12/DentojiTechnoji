import React from "react";
import { Search } from "lucide-react";

export default function FinanceFilterBar() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl shadow-sm mb-6">
      {/* Search input with icon */}
      <div className="relative w-full md:w-1/2">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search by patient name, lab name ……"
          className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Status Dropdown */}
      <select className="px-4 py-2 w-full md:w-1/4 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none">
        <option>All Staus</option>
        <option>Pending</option>
        <option>Paid</option>
        <option>Unpaid</option>
      </select>

      {/* Payments Dropdown */}
      <select className="px-4 py-2 w-full md:w-1/4 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none">
        <option>All Payments</option>
        <option>Pending</option>
        <option>Completed</option>
      </select>
    </div>
  );
}
