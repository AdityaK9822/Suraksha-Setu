import DashboardLayout from './DashboardLayout'
import {
  LayoutDashboard,
  Home,
  CreditCard,
  FolderOpen,
  Upload,
  Shield,
  CheckCircle,
  Activity,
  Bell,
  Settings,
} from 'lucide-react'
import type { NavItem } from '../types'

const nav: NavItem[] = [
  { to: '/homeowner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/homeowner/property', label: 'My Property', icon: Home },
  { to: '/homeowner/passport', label: 'Property Passport', icon: CreditCard },
  { to: '/homeowner/documents', label: 'Document Locker', icon: FolderOpen },
  { to: '/homeowner/upload', label: 'Upload Documents', icon: Upload },
  { to: '/homeowner/bank-requests', label: 'Bank Requests', icon: Shield },
  { to: '/homeowner/consent', label: 'Consent Management', icon: CheckCircle },
  { to: '/homeowner/grants', label: 'Active Access Grants', icon: Shield },
  { to: '/homeowner/activity', label: 'Activity History', icon: Activity },
  { to: '/homeowner/notifications', label: 'Notifications', icon: Bell },
  { to: '/homeowner/settings', label: 'Settings', icon: Settings },
]

export default function HomeownerLayout() {
  return <DashboardLayout nav={nav} />
}
