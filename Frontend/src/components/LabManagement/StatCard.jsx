import React from "react";

export default function StatCard({ title, value, icon, iconBg }) {
  return (
    <div className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-lg font-semibold mt-1">{value}</p>
      </div>
      <div className={`p-2 rounded-lg ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
}
