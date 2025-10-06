import React from "react";
import { DollarSign, FileText, Clock, BarChart3 } from "lucide-react";

const cards = [
  { label: "Total Lab Revenue", value: "$5,500", icon: <DollarSign />, color: "text-blue-500" },
  { label: "Total OP Revenue", value: "$3,000", icon: <FileText />, color: "text-green-500" },
  { label: "Pending Payment", value: "$1,900", icon: <Clock />, color: "text-purple-500" },
  { label: "Total Revenue", value: "$10,400", icon: <BarChart3 />, color: "text-orange-500" },
];

export default function FinanceCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, i) => (
        <div
          key={i}
          className="flex items-center p-4 bg-white shadow rounded-lg"
        >
          <div className={`p-2 rounded-full bg-gray-100 mr-4 ${card.color}`}>
            {card.icon}
          </div>
          <div>
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="text-lg font-semibold">{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
