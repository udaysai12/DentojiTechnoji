import React, { useState } from "react";
import { Upload, Eye } from "lucide-react";
import PaymentDetailsModal from "./PaymentDetailsModal"; // Create this component

const data = [
    {
        name: "Vanitha",
        phone: "+91 234 567 8901",
        opAmount: " ₹800",
        labAmount: " ₹1,500",
        pending: " ₹300",
        total: " ₹2,600",
        status: "Pending",
        date: "2024-07-25",
    },
    {
        name: "Samuel",
        phone: "+91 234 567 8902",
        opAmount: " ₹1,200",
        labAmount: " ₹2,200",
        pending: " ₹0",
        total: " ₹3,400",
        status: "Paid",
        date: "2024-07-24",
    },
    {
        name: "Saranya",
        phone: "+91 234 567 8903",
        opAmount: " ₹600",
        labAmount: " ₹800",
        pending: " ₹1,400",
        total: " ₹2,800",
        status: "Unpaid",
        date: "2024-07-23",
    },
    {
        name: "Nikhil",
        phone: "+91 234 567 8904",
        opAmount: " ₹400",
        labAmount: " ₹1000",
        pending: " ₹200",
        total: " ₹1,600",
        status: "Pending",
        date: "2024-07-22",
    },
];

const statusStyles = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Unpaid: "bg-red-100 text-red-700",
};

export default function FinanceTable() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewClick = (row) => {
    setSelectedPatient(row);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 ">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Patient Financial Overview</h2>
        <button className="bg-gray-100 text-gray-800 px-5 py-2 rounded-lg cursor-pointer text-sm flex items-center gap-2 mr-5">
          <Upload size={16} />
          Export
        </button>
      </div>

      <table className="w-full text-sm text-left text-gray-700">
        <thead>
          <tr className="border-b border-gray-200 w-10/12">
            <th className="p-2">Patient Name</th>
            <th className="p-2">Phone Number</th>
            <th className="p-2">OP Amount</th>
            <th className="p-2">Lab Amount</th>
            <th className="p-2">Pending</th>
            <th className="p-2">Total</th>
            <th className="p-2">Status</th>
            <th className="p-2">Last Visit</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="p-2">{row.name}</td>
              <td className="p-2">{row.phone}</td>
              <td className="p-2">{row.opAmount}</td>
              <td className="p-2">{row.labAmount}</td>
              <td className="p-2">{row.pending}</td>
              <td className="p-2">{row.total}</td>
              <td className="p-2">
                <span
                  className={`inline-flex items-center justify-center w-20 h-6 rounded-full text-xs ${statusStyles[row.status]}`}
                >
                  {row.status}
                </span>
              </td>
              <td className="p-2 pt-5">{row.date}</td>
              <td className="p-2 text-center">
                <button
                  onClick={() => handleViewClick(row)}
                  className="p-1 mr-2 rounded-sm bg-gray-200 hover:bg-gray-100 cursor-pointer text-center"
                  title="View Details"
                >
                  <Eye className="w-3.5 h-3.5 text-black" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payment Modal */}
      {isModalOpen && selectedPatient && (
        <PaymentDetailsModal
          patient={selectedPatient}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
