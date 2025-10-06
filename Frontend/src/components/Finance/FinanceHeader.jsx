import React from "react";
import { DollarSign, Activity, Wallet, BarChart } from "lucide-react";

const FinanceHeader = ({ summary }) => {
  const cards = [
    { title: "Total Lab Revenue", amount: "$5,500", icon: <DollarSign /> },
    { title: "Total OP Revenue", amount: "$3,000", icon: <Wallet /> },
    { title: "Pending Payment", amount: "$1,900", icon: <Activity /> },
    { title: "Total Revenue", amount: "$10,400", icon: <BarChart /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="p-4 rounded-lg bg-white shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{card.title}</p>
            <h2 className="text-xl font-bold">{card.amount}</h2>
          </div>
          <div className="text-blue-500 bg-blue-100 p-2 rounded-full">{card.icon}</div>
        </div>
      ))}
    </div>
  );
};

export default FinanceHeader;
