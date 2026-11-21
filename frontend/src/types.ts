import type { LucideIcon } from 'lucide-react'

export type UserRole = 'SOCIETY_ADMIN' | 'HOMEOWNER' | 'BANK_USER'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
}

export interface NavItem {
  to: string
  label: string
  icon?: LucideIcon
}

export interface OfficeBearer {
  id: string
  name: string
  designation: string
  email: string
  phone?: string
}

export interface Society {
  id: string
  societyId: string
  name: string
  registrationNo?: string
  address: string
  city: string
  state: string
  pincode: string
  buildingsCount: number
  totalFlats: number
  contactEmail?: string
  contactPhone?: string
  officeBearers?: OfficeBearer[]
}

export interface PropertyRecord {
  id?: string
  propertyId: string
}

export interface FlatInfo {
  id?: string
  flatNumber: string
  wing?: string
  building?: { name: string }
  property?: PropertyRecord
  homeowners?: Array<{
    id: string
    homeowner?: HomeownerRecord
  }>
}

export interface FlatAssociation {
  id?: string
  flat: FlatInfo
  flatNumber?: string
  wing?: string
}

export interface DocumentVersion {
  id: string
  version: number
  originalName: string
  size: number
  createdAt: string
}

export interface DocumentRecord {
  id: string
  documentId: string
  category: 'PROPERTY' | 'LOAN' | string
  subcategory?: string
  originalName: string
  status: string
  version: number
  createdAt: string
  versions?: DocumentVersion[]
}

export interface HomeownerRecord {
  id: string
  name: string
  email: string
  phone?: string
  ownershipCategory?: string
  status?: string
  society?: Society
  flats?: FlatAssociation[]
  documents?: DocumentRecord[]
  documentCount?: number
  propertyDocCount?: number
  loanDocCount?: number
}

export interface BankProfile {
  id: string
  name: string
  branch?: string
  officialEmail?: string
  contactNumber?: string
  authorisedUser?: string
  designation?: string
}

export interface AccessRequest {
  id: string
  requestId: string
  status: string
  purpose: string
  explanation?: string
  requestedInfo: string
  requestedDocs: string
  expiryDate: string
  createdAt: string
  bank?: BankProfile
  society?: Society
  homeowner?: HomeownerRecord
  societyApproval?: {
    decision: string
    note?: string
  }
  homeownerConsent?: {
    decision: string
    note?: string
  }
}

export interface GrantDocumentItem {
  id: string
  document?: DocumentRecord
}

export interface DisclosedHomeowner {
  name?: string
  propertyId?: string
  flatNumber?: string
  wing?: string
  email?: string
  phone?: string
  address?: string
}

export interface AccessGrant {
  id: string
  grantId: string
  status: string
  expiryDate: string
  createdAt: string
  bank?: BankProfile
  homeowner?: HomeownerRecord
  accessRequest?: AccessRequest
  disclosedHomeowner?: DisclosedHomeowner
  documents?: GrantDocumentItem[]
}

export interface ActivityRecord {
  id: string
  action: string
  entity?: string
  entityId?: string
  metadata?: string
  createdAt: string
}

export interface NotificationRecord {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}
