import React, { useState } from "react";
import FinanceHeader from "./FinanceHeader";
import FinanceFilters from "./FinanceFilters";
import FinanceTable from "./FinanceTable";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const sampleData = [
  {
    name: "Vanitha",
    phone: "+1 234 567 8901",
    op: 800,
    lab: 1500,
    pending: 300,
    total: 2600,
    status: "Pending",
    lastVisit: "2024-07-25",
  },
  {
    name: "Samuel",
    phone: "+1 234 567 8902",
    op: 1200,
    lab: 2200,
    pending: 0,
    total: 3400,
    status: "Paid",
    lastVisit: "2024-07-24",
  },
  {
    name: "Saranya",
    phone: "+1 234 567 8903",
    op: 600,
    lab: 800,
    pending: 1400,
    total: 2800,
    status: "Overdue",
    lastVisit: "2024-07-23",
  },
  {
    name: "Nikhil",
    phone: "+1 234 567 8904",
    op: 400,
    lab: 1000,
    pending: 200,
    total: 1600,
    status: "Pending",
    lastVisit: "2024-07-22",
  },
];

const MyFinancePage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [viewPatient, setViewPatient] = useState(null);

  const filtered = sampleData.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "" || p.status === status)
  );

  return (
    <div className="p-6 bg-[#f5f8ff] min-h-screen">
      <h1 className="text-2xl font-bold mb-1">My Finance</h1>
      <p className="text-gray-500 mb-6">Manage all financial transactions and patient payments</p>

      <FinanceHeader />
      <FinanceFilters search={search} setSearch={setSearch} status={status} setStatus={setStatus} />

      <div className="mb-3 flex justify-between">
        <h2 className="font-medium">Patient Financial Overview</h2>
        <button className="bg-gray-100 px-4 py-1 rounded hover:bg-gray-200 text-sm">⬇ Export</button>
      </div>

      <FinanceTable data={filtered} onView={(p) => setViewPatient(p)} />

      <ToastContainer />
    </div>
  );
};

export default MyFinancePage;
