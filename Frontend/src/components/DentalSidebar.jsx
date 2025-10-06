//DentalSidebar
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAccessControl } from "../App";
import { usePermissions } from "../pages/PermissionContext";
import DashboardIcon from "../assets/icons/Dashboard.png";
import PatientIcon from "../assets/icons/Dental_Patient.png";
import TreatmentIcon from "../assets/icons/Treatment.png";
import UserGroupIcon from "../assets/icons/User_Groups.png";
import MicroscopeIcon from "../assets/icons/Optical_Microscope.png";
import SettingsIcon from "../assets/icons/Settings.png";
import WhatsappIcon from "../assets/icons/WhatsApp.png";
import LogoutIcon from "../assets/icons/Logout.png";
import DoctorIcon from "../assets/icons/Doctor.png";
import FinanceIcon from "../assets/icons/Finance.png";
import ShareIcon from "../assets/icons/share.png";
import { Menu, X } from "lucide-react";

const DentalSidebar = () => {
  const location = useLocation();
  const { triggerAccessDenied, userRole } = useAccessControl();
  const { hasPermission, userRole: contextRole, permissions, loading: permissionLoading, hasPermissionsInDB, defaultPermissions } = usePermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine effective user role
  const effectiveRole = contextRole || userRole;

  // Check if user has permission with detailed logic
  const hasEffectivePermission = (requiredPermission) => {
    if (effectiveRole === 'Admin' || effectiveRole === 'admin') {
      return true;
    }

    if (permissionLoading) {
      return false;
    }

    if (effectiveRole === 'Receptionist' || effectiveRole === 'receptionist') {
      if (hasPermissionsInDB && permissions && permissions.length > 0) {
        return permissions.includes(requiredPermission);
      }

      const defaultPerms = defaultPermissions || ['patients', 'appointments', 'whatsapp', 'share'];
      return defaultPerms.includes(requiredPermission);
    }

    return false;
  };

  // Define all possible menu items
  const allMainLinks = [
    {
      to: '/dashboard',
      paths: ['/dashboard'],
      icon: DashboardIcon,
      label: "Dashboard",
      permission: 'dashboard',
      isDefault: false
    },
    {
      to: '/patients',
      paths: ['/patients', '/addpatient'],
      icon: PatientIcon,
      label: "Patients",
      permission: 'patients',
      isDefault: true
    },
    {
      to: '/appointments',
      paths: ['/appointments'],
      icon: TreatmentIcon,
      label: "Appointments",
      permission: 'appointments',
      isDefault: true
    },
    {
      to: '/staff',
      paths: ['/staff'],
      icon: UserGroupIcon,
      label: "Staff",
      permission: 'staff',
      isDefault: false
    },
    {
      to: '/labmanagement',
      paths: ['/labmanagement'],
      icon: MicroscopeIcon,
      label: "Labs",
      permission: 'labmanagement',
      isDefault: false
    },
    {
      to: '/consultant',
      paths: ['/consultant'],
      icon: DoctorIcon,
      label: "Consultant",
      permission: 'consultant',
      isDefault: false
    },
    {
      to: '/finance',
      paths: ['/finance'],
      icon: FinanceIcon,
      label: "Finance",
      permission: 'finance',
      isDefault: false
    },
  ];

  const allBottomLinks = [
    {
      to: '/messages',
      paths: ['/messages'],
      icon: WhatsappIcon,
      label: "Messages",
      permission: 'whatsapp',
      isDefault: true
    },
    {
      to: '/share',
      paths: ['/share'],
      icon: ShareIcon,
      label: "Share",
      permission: 'share',
      isDefault: true
    },
    {
      to: '/settings',
      paths: ['/settings'],
      icon: SettingsIcon,
      label: "Settings",
      permission: 'settings',
      isDefault: false
    },
    {
      to: '/logout',
      paths: ['/logout'],
      icon: LogoutIcon,
      label: "Logout",
      permission: null,
      isDefault: true
    },
  ];

  const handleLinkClick = (e, link) => {
    if (!link.permission || effectiveRole === 'Admin') {
      setIsMobileMenuOpen(false);
      return true;
    }

    if (effectiveRole === 'Receptionist') {
      const hasAccess = hasEffectivePermission(link.permission);

      if (!hasAccess) {
        e.preventDefault();
        console.log('Access denied for:', link.label, {
          permission: link.permission,
          userPermissions: permissions,
          hasPermissionsInDB,
          defaultPermissions
        });
        triggerAccessDenied(link.label);
        setIsMobileMenuOpen(false);
        return false;
      }
    }

    setIsMobileMenuOpen(false);
    return true;
  };

  // Desktop Link Component
  const DesktopLink = ({ link, idx }) => {
    const isActive = link.paths.includes(location.pathname);
    const hasAccess = !link.permission || effectiveRole === 'Admin' || hasEffectivePermission(link.permission);
    const isRestricted = effectiveRole === 'Receptionist' && link.permission && !hasAccess;

    return (
      <div
        key={`desktop-${idx}`}
        className={`relative group flex flex-col items-center  ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={(e) => handleLinkClick(e, link)}
      >
        {!isRestricted ? (
          <Link to={link.to} className="flex flex-col items-center">
            <DesktopLinkContent link={link} isActive={isActive} isRestricted={isRestricted} />
          </Link>
        ) : (
          <div className="flex flex-col items-center">
            <DesktopLinkContent link={link} isActive={isActive} isRestricted={isRestricted} />
          </div>
        )}
      </div>
    );
  };

  // Mobile Sidebar Link Component
  const MobileSidebarLink = ({ link }) => {
    const isActive = link.paths.includes(location.pathname);
    const hasAccess = !link.permission || effectiveRole === 'Admin' || hasEffectivePermission(link.permission);
    const isRestricted = effectiveRole === 'Receptionist' && link.permission && !hasAccess;

    return (
      <div
        className={`flex items-center px-6 py-4 cursor-pointer transition-all duration-200 ${
          isActive ? 'bg-white/10' : 'hover:bg-white/5'
        } ${isRestricted ? 'opacity-50' : ''}`}
        onClick={(e) => handleLinkClick(e, link)}
      >
        {!isRestricted ? (
          <Link to={link.to} className="flex items-center w-full">
            <div className="relative">
              <img src={link.icon} alt={link.label} className="w-6 h-6" />
              {isRestricted && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
                  🔒
                </div>
              )}
            </div>
            <span className={`ml-4 text-base ${isActive ? 'font-semibold' : 'font-normal'}`}>
              {link.label}
            </span>
          </Link>
        ) : (
          <div className="flex items-center w-full">
            <div className="relative">
              <img src={link.icon} alt={link.label} className="w-6 h-6 filter grayscale" />
              <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
                🔒
              </div>
            </div>
            <span className="ml-4 text-base text-red-300">{link.label}</span>
          </div>
        )}
      </div>
    );
  };

  // Desktop Link Content
  const DesktopLinkContent = ({ link, isActive, isRestricted }) => (
    <>
      <div
        className={`
          p-0.5 md:p-1 lg:p-1.5 xl:p-2 2xl:p-2.1  
          rounded-lg md:rounded-xl
          transition-all duration-300 ease-in-out relative
          ${isActive ? 'bg-white/20 backdrop-blur-md border border-white/40 shadow-lg' : 'opacity-90 group-hover:opacity-100'}
          ${isRestricted
            ? 'opacity-40 group-hover:opacity-60 group-hover:bg-red-500/10 border border-red-300/30'
            : 'group-hover:bg-white/15'
          }
        `}
      >
        <img
          src={link.icon}
          alt={link.label}
          className={`
            w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7
            transition-all duration-300 
            ${isRestricted ? 'filter grayscale contrast-50' : ''}
          `}
        />

        {isRestricted && (
          <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full w-2.5 h-2.5 md:w-3 md:h-3 flex items-center justify-center text-[7px]">
            🔒
          </div>
        )}
      </div>

      <div
        className={`
          rounded text-[7px] md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-[11px]
          transition-all duration-300 ease-in-out text-center 
          mt-0.5 md:mt-0.5 lg:mt-1
          leading-tight font-medium
          ${isActive
            ? 'opacity-100 translate-y-0 text-white font-medium'
            : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
          }
          ${isRestricted
            ? 'text-red-200 group-hover:text-red-300'
            : 'text-white'
          }
        `}
      >
        {link.label}
      </div>
    </>
  );

  // Loading state
  if (permissionLoading) {
    return (
      <>
        <div className="hidden md:flex flex-col items-center  bg-[#4169E1] text-white rounded-3xl w-14 md:w-16 lg:w-[4.5rem] xl:w-20 2xl:w-24 h-screen fixed left-2 md:left-2 lg:left-3 xl:left-5 top-0 shadow-xl">
          <div className="text-center font-bold text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs leading-tight tracking-wide py-1.5 md:py-2 lg:py-2 xl:py-2.5 px-1 w-full">
            Dentoji
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-2 border-white border-t-transparent"></div>
          </div>
        </div>

        <div className="md:hidden fixed top-0 left-0 right-0 bg-[#4169E1] z-50 h-16 flex items-center px-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* DESKTOP SIDEBAR - UNCHANGED */}
      <div className="hidden md:flex flex-col items-center bg-[#4169E1] text-white rounded-xl mt-2 mb-2  md:rounded-3xl w-10 md:w-16 lg:w-[4.5rem] xl:w-20 2xl:w-22 h-screen fixed left-2 md:left-2 lg:left-3 xl:left-5 top-0 shadow-xl">
        <div className="text-center font-bold text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs 2xl:text-sm  leading-tight mt-1 tracking-wide  px-1 w-full flex-shrink-0">
          Dentoji
        </div>

        <div className="sidebar-main-section flex flex-col justify-evenly flex-1 w-full  ">
          {allMainLinks.map((link, idx) => (
            <DesktopLink key={`main-${idx}`} link={link} idx={idx} />
          ))}
        </div>

        <div className="sidebar-bottom-section flex flex-col justify-evenly w-full  flex-shrink-0 mb-3" >
          {allBottomLinks.map((link, idx) => (
            <DesktopLink key={`bottom-${idx}`} link={link} idx={idx} />
          ))}
        </div>
      </div>

      {/* MOBILE HEADER WITH HAMBURGER */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#4169E1] z-50 h-16 flex items-center px-4 shadow-lg">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-white font-bold text-lg">Dentoji</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* MOBILE SIDEBAR MENU */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>

        {/* Sidebar */}
        <div
          className={`absolute top-0 left-0 h-full w-72 bg-[#4169E1] text-white shadow-2xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center">
              {/* <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl font-bold">U</span>
              </div> */}
              {/* <div className="ml-3">
                <div className="font-semibold text-base">User Name</div>
                <div className="text-sm text-white/70">{effectiveRole}</div>
              </div> */}
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="overflow-y-auto h-[calc(100vh-80px)]">
            <div className="py-4">
              {allMainLinks.map((link, idx) => (
                <MobileSidebarLink key={`sidebar-main-${idx}`} link={link} />
              ))}
            </div>

            <div className="border-t border-white/10 py-4">
              {allBottomLinks.map((link, idx) => (
                <MobileSidebarLink key={`sidebar-bottom-${idx}`} link={link} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for mobile header */}
      <div className="md:hidden h-16 w-full"></div>

      {/* Responsive margin for content */}
      <style jsx>{`
        @media (min-width: 1920px) and (max-height: 1000px) {
          .sidebar-bottom-section {
            height: 38% !important;
            min-height: 300px !important;
            padding-top: 0.75rem !important;
            padding-bottom: 1.75rem !important;
          }
          .sidebar-main-section {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }
        }

        @media (min-width: 1920px) and (min-height: 1001px) and (max-height: 1100px) {
          .sidebar-bottom-section {
            height: 36% !important;
            min-height: 290px !important;
            padding-top: 1rem !important;
            padding-bottom: 1.5rem !important;
          }
        }

        @media (min-width: 1920px) and (min-height: 1101px) {
          .sidebar-bottom-section {
            height: 32% !important;
            min-height: 260px !important;
          }
        }

        @media (min-width: 1536px) and (max-width: 1919px) {
          .sidebar-bottom-section {
            height: 30% !important;
            min-height: 220px !important;
          }
        }

        @media (min-width: 1280px) and (max-width: 1535px) {
          .sidebar-bottom-section {
            height: 28% !important;
            min-height: 200px !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1279px) {
          .sidebar-bottom-section {
            height: 26% !important;
            min-height: 180px !important;
          }
        }

        @media (min-width: 768px) {
          .main-content {
            margin-left: 4rem;
          }
        }
        @media (min-width: 1024px) {
          .main-content {
            margin-left: 5rem;
          }
        }
        @media (min-width: 1280px) {
          .main-content {
            margin-left: 6rem;
          }
        }
        @media (min-width: 1536px) {
          .main-content {
            margin-left: 7rem;
          }
        }
      `}</style>
    </>
  );
};

export default DentalSidebar;