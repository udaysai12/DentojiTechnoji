//MedicalHistoryCard.jsx
import React from "react";
import { HeartPulse } from "lucide-react";
 
export default function MedicalHistoryCard({ patientData }) {
//export default function MedicalHistoryCard({ medicalHistory }) {
  console.log("hi");
  return (
    <div className="bg-white rounded-xl shadow p-6 min-h-64 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse className="text-red-500 w-6 h-6" />
          <h2 className="text-sm font-semibold">Medical Information</h2>
        </div>
        <div className="text-sm text-gray-700 space-y-3">
          <div>
            <span className="text-gray-500">Primary Issue</span><br />
            <span className="font-semibold text-black">{patientData?.primaryDentalIssue || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-500">Symptoms</span><br />
            <span className="font-semibold text-black">{patientData?.currentSymptoms || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-500">Allergies</span><br />
            <span className="font-semibold text-black">{patientData?.allergies || "N/A"}</span>
          </div>
          <div>
            <span className="text-gray-500">Blood Type</span><br />
            <span className="font-semibold text-black">{patientData?.bloodType || "N/A"}</span>
          </div>
 
           <div>
            <span className="text-gray-500"> Medical History</span><br />
            <span className="font-semibold text-black">{patientData?.medicalHistory || "N/A"}</span>
          </div>  
 
         
         
 
        </div>
      </div>
    </div>
  );
}
 
 