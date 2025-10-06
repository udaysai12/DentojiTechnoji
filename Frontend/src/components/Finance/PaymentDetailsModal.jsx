import React, { useState } from "react";
import { X } from "lucide-react";

// Dummy transaction data
const transactions = [
  {
    date: "2024-07-25",
    type: "Lab",
    description: "X-Ray Analysis",
    doctor: "Dr. Sita",
    amount: "₹150",
    status: "Paid",
  },
  {
    date: "2024-07-25",
    type: "OP",
    description: "Root Canal Treatment",
    doctor: "Dr. Arun",
    amount: "₹800",
    status: "Paid",
  },
  {
    date: "2024-07-25",
    type: "Lab",
    description: "Crown Lab Work",
    doctor: "Dr. Vinay",
    amount: "₹1350",
    status: "Paid",
  },
  {
    date: "2024-07-25",
    type: "Pending",
    description: "Follow-up Consultation",
    doctor: "Dr. Likitha",
    amount: "₹300",
    status: "Pending",
  },
];

const typeColors = {
  Lab: "bg-blue-100 text-blue-700",
  OP: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

const statusColors = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

export default function PaymentDetailsModal({ patient, onClose }) {
  const [activeTab, setActiveTab] = useState("All Transactions");

  const filteredData =
    activeTab === "All Transactions"
      ? transactions
      : activeTab === "Pending"
      ? transactions.filter((t) => t.status === "Pending")
      : transactions.filter((t) => t.type === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-black cursor-pointer"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-4">
          Payment Details - {patient.name}
        </h3>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center border border-gray-200 rounded-lg py-3">
            <div className="text-blue-600 text-lg font-bold">{patient.labAmount}</div>
            <div className="text-xs text-gray-500">Lab Amount</div>
          </div>
          <div className="text-center border border-gray-200 rounded-lg py-3">
            <div className="text-green-600 text-lg font-bold">{patient.opAmount}</div>
            <div className="text-xs text-gray-500">OP Amount</div>
          </div>
          <div className="text-center border border-gray-200 rounded-lg py-3">
            <div className="text-red-600 text-lg font-bold">{patient.pending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center border border-gray-200 rounded-lg py-3">
            <div className="text-black text-lg font-bold">{patient.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-start gap-2 mb-4 w-full rounded-full  p-1 bg-gray-100 shadow-sm">
          {["All Transactions", "Lab", "OP", "Pending"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 text-sm rounded-full transition-all duration-150 ${
                activeTab === tab
                  ? "bg-white text-black font-semibold shadow-sm border border-gray-300"
                  : "bg-transparent text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Transaction Table */}
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="border-b font-medium">
            <tr>
              <th className="p-2">Last Visit</th>
              <th className="p-2">Type</th>
              <th className="p-2">Description</th>
              <th className="p-2">Doctor</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((tx, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-2">{tx.date}</td>
                <td className="p-2">
                  <span
                    className={`inline-flex items-center justify-center w-[80px] h-[24px] rounded-full text-xs font-medium ${typeColors[tx.type]}`}
                  >
                    {tx.type}
                  </span>
                </td>
                <td className="p-2">{tx.description}</td>
                <td className="p-2">{tx.doctor}</td>
                <td className="p-2">{tx.amount}</td>
                <td className="p-2">
                  <span
                    className={`inline-flex items-center justify-center w-[80px] h-[24px] rounded-full text-xs font-medium ${
                      statusColors[tx.status] || "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-400">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
