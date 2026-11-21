import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'

// Public
import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Society
import SocietyLayout from './layouts/SocietyLayout'
import SocietyDashboard from './pages/society/Dashboard'
import CreateSociety from './pages/society/CreateSociety'
import SocietyProfile from './pages/society/Profile'
import OfficeBearers from './pages/society/OfficeBearers'
import RegisterHomeowners from './pages/society/RegisterHomeowners'
import HomeownerDirectory from './pages/society/HomeownerDirectory'
import DocOverview from './pages/society/DocOverview'
import BankAccessRequests from './pages/society/BankAccessRequests'
import SocietyNotifications from './pages/society/Notifications'
import SocietyActivity from './pages/society/Activity'
import SocietySettings from './pages/society/Settings'

// Homeowner
import HomeownerLayout from './layouts/HomeownerLayout'
import HomeownerDashboard from './pages/homeowner/Dashboard'
import MyProperty from './pages/homeowner/MyProperty'
import PropertyPassport from './pages/homeowner/PropertyPassport'
import DocumentLocker from './pages/homeowner/DocumentLocker'
import UploadDocuments from './pages/homeowner/UploadDocuments'
import HomeownerBankRequests from './pages/homeowner/BankRequests'
import ConsentManagement from './pages/homeowner/ConsentManagement'
import ActiveGrants from './pages/homeowner/ActiveGrants'
import HomeownerActivity from './pages/homeowner/Activity'
import HomeownerNotifications from './pages/homeowner/Notifications'
import HomeownerSettings from './pages/homeowner/Settings'

// Bank
import BankLayout from './layouts/BankLayout'
import BankDashboard from './pages/bank/Dashboard'
import SearchSocieties from './pages/bank/SearchSocieties'
import SocietyDirectory from './pages/bank/SocietyDirectory'
import HomeownerSearch from './pages/bank/HomeownerSearch'
import RequestAccess from './pages/bank/RequestAccess'
import MyRequests from './pages/bank/MyRequests'
import ApprovedRecords from './pages/bank/ApprovedRecords'
import AccessHistory from './pages/bank/AccessHistory'
import BankNotifications from './pages/bank/Notifications'
import BankSettings from './pages/bank/Settings'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/society"
          element={
            <ProtectedRoute roles={['SOCIETY_ADMIN']}>
              <SocietyLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SocietyDashboard />} />
          <Route path="create" element={<CreateSociety />} />
          <Route path="profile" element={<SocietyProfile />} />
          <Route path="office-bearers" element={<OfficeBearers />} />
          <Route path="register-homeowners" element={<RegisterHomeowners />} />
          <Route path="directory" element={<HomeownerDirectory />} />
          <Route path="documents" element={<DocOverview />} />
          <Route path="bank-requests" element={<BankAccessRequests />} />
          <Route path="notifications" element={<SocietyNotifications />} />
          <Route path="activity" element={<SocietyActivity />} />
          <Route path="settings" element={<SocietySettings />} />
        </Route>

        <Route
          path="/homeowner"
          element={
            <ProtectedRoute roles={['HOMEOWNER']}>
              <HomeownerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<HomeownerDashboard />} />
          <Route path="property" element={<MyProperty />} />
          <Route path="passport" element={<PropertyPassport />} />
          <Route path="documents" element={<DocumentLocker />} />
          <Route path="upload" element={<UploadDocuments />} />
          <Route path="bank-requests" element={<HomeownerBankRequests />} />
          <Route path="consent" element={<ConsentManagement />} />
          <Route path="grants" element={<ActiveGrants />} />
          <Route path="activity" element={<HomeownerActivity />} />
          <Route path="notifications" element={<HomeownerNotifications />} />
          <Route path="settings" element={<HomeownerSettings />} />
        </Route>

        <Route
          path="/bank"
          element={
            <ProtectedRoute roles={['BANK_USER']}>
              <BankLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<BankDashboard />} />
          <Route path="search-societies" element={<SearchSocieties />} />
          <Route path="directory" element={<SocietyDirectory />} />
          <Route path="homeowner-search" element={<HomeownerSearch />} />
          <Route path="request-access" element={<RequestAccess />} />
          <Route path="requests" element={<MyRequests />} />
          <Route path="records" element={<ApprovedRecords />} />
          <Route path="history" element={<AccessHistory />} />
          <Route path="notifications" element={<BankNotifications />} />
          <Route path="settings" element={<BankSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
