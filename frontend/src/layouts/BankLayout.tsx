import DashboardLayout from './DashboardLayout'
import {
  LayoutDashboard,
  Search,
  Building2,
  Users,
  FileText,
  Send,
  CheckCircle,
  History,
  Bell,
  Settings,
} from 'lucide-react'
import type { NavItem } from '../types'

const nav: NavItem[] = [
  { to: '/bank/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bank/search-societies', label: 'Search Societies', icon: Search },
  { to: '/bank/directory', label: 'Society Directory', icon: Building2 },
  { to: '/bank/homeowner-search', label: 'Homeowner Search', icon: Users },
  { to: '/bank/request-access', label: 'Request Access', icon: Send },
  { to: '/bank/requests', label: 'My Requests', icon: FileText },
  { to: '/bank/records', label: 'Approved Records', icon: CheckCircle },
  { to: '/bank/history', label: 'Access History', icon: History },
  { to: '/bank/notifications', label: 'Notifications', icon: Bell },
  { to: '/bank/settings', label: 'Settings', icon: Settings },
]

export default function BankLayout() {
  return <DashboardLayout nav={nav} />
}
