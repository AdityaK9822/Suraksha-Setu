import DashboardLayout from './DashboardLayout'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  FolderOpen,
  Shield,
  Bell,
  Activity,
  Settings,
  PlusCircle,
  UserCog,
} from 'lucide-react'
import type { NavItem } from '../types'

const nav: NavItem[] = [
  { to: '/society/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/society/create', label: 'Create / Manage Society', icon: PlusCircle },
  { to: '/society/profile', label: 'Society Profile', icon: Building2 },
  { to: '/society/office-bearers', label: 'Office Bearers', icon: UserCog },
  { to: '/society/register-homeowners', label: 'Register Homeowners', icon: UserPlus },
  { to: '/society/directory', label: 'Homeowner Directory', icon: Users },
  { to: '/society/documents', label: 'Document Overview', icon: FolderOpen },
  { to: '/society/bank-requests', label: 'Bank Access Requests', icon: Shield },
  { to: '/society/notifications', label: 'Notifications', icon: Bell },
  { to: '/society/activity', label: 'Activity History', icon: Activity },
  { to: '/society/settings', label: 'Settings', icon: Settings },
]

export default function SocietyLayout() {
  return <DashboardLayout nav={nav} />
}
