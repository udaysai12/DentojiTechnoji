import React from "react";

export default function StatCard({ title, value, icon, iconBg }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 flex items-center justify-between w-full max-w-xs">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-black mt-1">{value}</p>
      </div>
      <div
        className={`p-3 rounded-xl ${iconBg} flex items-center justify-center`}
      >
        {icon}
      </div>
    </div>
  );
}
