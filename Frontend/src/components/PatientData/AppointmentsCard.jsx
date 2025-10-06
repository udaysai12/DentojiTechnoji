
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import AddAppointmentModal from '../Appointments/AddAppointmentModal';

export default function AppointmentsCard({ patientData, onAppointmentAdded }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [appointments, setAppointments] = useState(patientData?.appointments || []);

  // Sync local appointments state with patientData changes
  useEffect(() => {
    setAppointments(patientData?.appointments || []);
  }, [patientData]);

  // Filter out appointments with invalid or missing dates
  const validAppointments = appointments.filter(appointment => {
    const hasValidDate = appointment.appointmentDate || appointment.date || appointment.createdAt;
    return hasValidDate && hasValidDate !== null && hasValidDate !== undefined;
  });

  // Sort appointments by date in descending order (most recent first)
  const sortedAppointments = validAppointments.sort((a, b) => {
    const dateA = new Date(a.appointmentDate || a.date || a.createdAt);
    const dateB = new Date(b.appointmentDate || b.date || b.createdAt);
    return dateB - dateA;
  });

  // Display up to 2 appointments
  const displayAppointments = sortedAppointments.slice(0, 2);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "";
    return `at ${timeString}`;
  };

  // Get appointment title with fallback options
  const getAppointmentTitle = (appointment) =>
    appointment.title ||
    appointment.treatmentType ||
    appointment.treatment ||
    appointment.appointmentType ||
    appointment.reason ||
    appointment.description ||
    "General Checkup";

  // Get appointment description with fallback options
  const getAppointmentDescription = (appointment) =>
    appointment.description ||
    appointment.notes ||
    appointment.reason ||
    appointment.doctor ||
    " ";

  // Get appointment status with fallback
  const getAppointmentStatus = (appointment) =>
    appointment.status || "Scheduled";

  // Handle opening the add appointment modal
  const handleAddAppointment = () => {
    console.log('Opening appointment modal with patient data:', patientData);
    setIsModalOpen(true);
  };

  // Handle closing the add appointment modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle new appointment submission
  const handleAppointmentAdded = (newAppointment) => {
    console.log('New appointment added:', newAppointment);
    // Optimistically update local appointments state
    setAppointments((prevAppointments) => [...prevAppointments, newAppointment]);
    // Call parent callback if provided
    if (onAppointmentAdded) {
      onAppointmentAdded(newAppointment);
    }
    setIsModalOpen(false);
  };

  // Handle opening the view all appointments modal
  const handleViewAllAppointments = () => {
    setIsViewAllModalOpen(true);
  };

  // Handle closing the view all appointments modal
  const handleCloseViewAllModal = () => {
    setIsViewAllModalOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow p-5 flex flex-col h-full">
        <h3 className="font-semibold mb-3 flex items-center justify-between text-sm">
          <span className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            Appointments
          </span>
          <button
            onClick={handleAddAppointment}
            className="text-blue-500 hover:text-blue-600"
            title="Add Appointment"
          >
            <Plus className="w-5 h-5" />
          </button>
        </h3>

        <div className="flex-1">
          {validAppointments.length > 0 ? (
            displayAppointments.map((appt, idx) => {
              const status = getAppointmentStatus(appt);
              const isCompleted = status === "Completed" || status === "completed";
              const isPending = status === "Pending" || status === "Scheduled";

              return (
                <div
                  key={appt._id || idx}
                  className={`rounded-lg p-3 mb-2 flex justify-between items-center h-20 ${
                    isCompleted
                      ? "bg-green-50 border-l-4 border-green-400"
                      : isPending
                      ? "bg-blue-50 border-l-4 border-blue-400"
                      : "bg-yellow-50 border-l-4 border-yellow-400"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isCompleted
                          ? "text-green-800"
                          : isPending
                          ? "text-blue-800"
                          : "text-yellow-800"
                      }`}
                    >
                      {getAppointmentTitle(appt)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDate(appt.appointmentDate || appt.date)}{" "}
                      {formatTime(appt.appointmentTime || appt.time)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {getAppointmentDescription(appt)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ml-2 flex-shrink-0 ${
                      isCompleted
                        ? "bg-green-200 text-green-800"
                        : isPending
                        ? "bg-blue-200 text-blue-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-xs text-gray-500 mb-2">
                No appointments scheduled
              </p>
              <button
                onClick={handleAddAppointment}
                className="text-blue-500 hover:text-blue-600 text-xs font-medium"
              >
                Schedule first appointment
              </button>
            </div>
          )}
        </div>

        {/* Show "View All Appointments" button only if there are appointments */}
        {validAppointments.length > 0 && (
          <div className="mt-3 space-y-2">
            <button
              onClick={handleViewAllAppointments}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
            >
              View All Appointments ({validAppointments.length})
            </button>
          </div>
        )}
      </div>

      {/* Add Appointment Modal */}
      <AddAppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAppointmentAdded={handleAppointmentAdded}
        preSelectedPatient={patientData}
      />

      {/* View All Appointments Modal */}
      {isViewAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden m-4 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                All Appointments ({validAppointments.length})
              </h2>
              <button
                onClick={handleCloseViewAllModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {validAppointments.length > 0 ? (
                sortedAppointments.map((appt, idx) => {
                  const status = getAppointmentStatus(appt);
                  const isCompleted = status === "Completed" || status === "completed";
                  const isPending = status === "Pending" || status === "Scheduled";

                  return (
                    <div
                      key={appt._id || idx}
                      className={`rounded-lg p-3 mb-2 flex justify-between items-center h-20 ${
                        isCompleted
                          ? "bg-green-50 border-l-4 border-green-400"
                          : isPending
                          ? "bg-blue-50 border-l-4 border-blue-400"
                          : "bg-yellow-50 border-l-4 border-yellow-400"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isCompleted
                              ? "text-green-800"
                              : isPending
                              ? "text-blue-800"
                              : "text-yellow-800"
                          }`}
                        >
                          {getAppointmentTitle(appt)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(appt.appointmentDate || appt.date)}{" "}
                          {formatTime(appt.appointmentTime || appt.time)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {getAppointmentDescription(appt)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ml-2 flex-shrink-0 ${
                          isCompleted
                            ? "bg-green-200 text-green-800"
                            : isPending
                            ? "bg-blue-200 text-blue-800"
                            : "bg-yellow-200 text-yellow-800"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-xs text-gray-500">No appointments scheduled</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleCloseViewAllModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )};
