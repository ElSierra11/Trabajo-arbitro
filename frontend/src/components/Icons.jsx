import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar as CalendarLucide,
  User as UserLucide,
  Menu as MenuLucide,
  ReceiptText,
  FileText,
  FileSpreadsheet,
  PlusCircle,
  Plus,
  History,
  Layers,
  CircleDollarSign,
  Clock,
  ClockAlert,
  Moon as MoonLucide,
  Sun as SunLucide,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Key as KeyLucide,
  X as XLucide,
  Shield as ShieldLucide,
  LogOut,
  Download as DownloadLucide,
  Upload as UploadLucide,
  Check as CheckLucide,
  MoreVertical,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';

// ==========================================
// LUCIDE ICONS EXPORTS
// ==========================================
export {
  LayoutDashboard,
  ClipboardList,
  ReceiptText,
  FileText,
  FileSpreadsheet,
  PlusCircle,
  Plus,
  History,
  Layers,
  CircleDollarSign,
  Clock,
  ClockAlert,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  MoreVertical,
  SlidersHorizontal,
  RefreshCw,
};

// Aliases with consistent sizing defaults
export const DashboardIcon = ({ size = 20, className = '' }) => <LayoutDashboard size={size} className={className} />;
export const CalendarIcon = ({ size = 20, className = '' }) => <CalendarLucide size={size} className={className} />;
export const UserIcon = ({ size = 20, className = '' }) => <UserLucide size={size} className={className} />;
export const MenuIcon = ({ size = 20, className = '' }) => <MenuLucide size={size} className={className} />;
export const PlusIcon = ({ size = 20, className = '' }) => <Plus size={size} className={className} />;
export const TrashIcon = ({ size = 20, className = '' }) => <Trash2 size={size} className={className} />;
export const EditIcon = ({ size = 20, className = '' }) => <Edit3 size={size} className={className} />;
export const CloseIcon = ({ size = 20, className = '' }) => <XLucide size={size} className={className} />;
export const DollarIcon = ({ size = 20, className = '' }) => <CircleDollarSign size={size} className={className} />;
export const CheckIcon = ({ size = 20, className = '' }) => <CheckLucide size={size} className={className} />;
export const PendingIcon = ({ size = 20, className = '' }) => <Clock size={size} className={className} />;
export const UploadIcon = ({ size = 20, className = '' }) => <UploadLucide size={size} className={className} />;
export const DownloadIcon = ({ size = 20, className = '' }) => <DownloadLucide size={size} className={className} />;
export const SunIcon = ({ size = 20, className = '' }) => <SunLucide size={size} className={className} />;
export const MoonIcon = ({ size = 20, className = '' }) => <MoonLucide size={size} className={className} />;
export const KeyIcon = ({ size = 20, className = '' }) => <KeyLucide size={size} className={className} />;
export const ShieldIcon = ({ size = 20, className = '' }) => <ShieldLucide size={size} className={className} />;
export const LogoutIcon = ({ size = 20, className = '' }) => <LogOut size={size} className={className} />;

// ==========================================
// SPORT-SPECIFIC VECTOR ICONS (SVG)
// ==========================================

// Whistle vector icon
export const WhistleIcon = ({ size = 20, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18.5 13H14a3 3 0 0 0-3-3H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1.5" />
    <path d="M9 14h2" />
    <path d="M14 17a3 3 0 0 0 3-3V7.5a2.5 2.5 0 0 0-5 0V10" />
    <path d="M22 10V6a2 2 0 0 0-2-2h-2" />
  </svg>
);

// Soccer ball vector icon
export const SoccerBallIcon = ({ size = 20, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-2 4 4 0-2-4z" />
    <path d="m12 22-2-4h4l-2 4z" />
    <path d="M2 12h4l2-2v4l-2-2H2z" />
    <path d="M22 12h-4l-2-2v4l2-2h4z" />
    <path d="m12 12-2-1.5 1-3.5h2l1 3.5-2 1.5z" />
    <path d="M10 10.5 6 12l2 4M14 10.5l4 1.5-2 4M11 18l1-3.5 1 3.5M10 6.5l2 1 2-1" />
  </svg>
);

// Generic Card Icon with custom color
export const CardIcon = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    stroke={color}
    strokeWidth="1.5"
    className={className}
  >
    <rect x="5" y="3" width="14" height="18" rx="2.5" ry="2.5" />
  </svg>
);

// Stylized Yellow Referee Card SVG (curved corners, gradient, subtle border)
export const YellowCardIcon = ({ size = 18, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={Math.round(size * 1.33)}
    viewBox="0 0 15 20"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="yellowCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
    </defs>
    <rect
      x="1"
      y="1"
      width="13"
      height="18"
      rx="2.5"
      fill="url(#yellowCardGrad)"
      stroke="#ca8a04"
      strokeWidth="1.2"
    />
  </svg>
);

// Stylized Red Referee Card SVG (curved corners, gradient, subtle border)
export const RedCardIcon = ({ size = 18, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={Math.round(size * 1.33)}
    viewBox="0 0 15 20"
    className={className}
    style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="redCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
    </defs>
    <rect
      x="1"
      y="1"
      width="13"
      height="18"
      rx="2.5"
      fill="url(#redCardGrad)"
      stroke="#b91c1c"
      strokeWidth="1.2"
    />
  </svg>
);

// Backwards compatibility
export const StatsIcon = ({ size = 20, className = '' }) => <History size={size} className={className} />;
export const ProfilesIcon = ({ size = 20, className = '' }) => <UserLucide size={size} className={className} />;
export const IncidentIcon = ({ size = 20, className = '' }) => <AlertCircle size={size} className={className} />;
