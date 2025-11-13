import { PartyRoleCode } from './roles/mapPartyRole';

export const orderStatuses = ['new', 'assigned', 'scheduled', 'in_progress', 'in_review', 'revisions', 'completed', 'delivered', 'cancelled'] as const;
export type OrderStatus = typeof orderStatuses[number];

export const orderPriorities = ['rush', 'high', 'normal', 'low'] as const;
export type OrderPriority = typeof orderPriorities[number];

export const orderTypes = ['purchase', 'refinance', 'home_equity', 'estate', 'divorce', 'tax_appeal', 'other'] as const;
export type OrderType = typeof orderTypes[number];

export const propertyTypes = ['single_family', 'condo', 'multi_family', 'commercial', 'land', 'manufactured'] as const;
export type PropertyType = typeof propertyTypes[number];

export const documentTypes = ['contract', 'report', 'invoice', 'photo', 'comparable', 'other'] as const;
export type DocumentType = typeof documentTypes[number];


export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  // Role from profiles table (e.g., 'admin', 'user')
  role?: string;
  availability?: boolean;
  geographicCoverage?: string;
  workload?: number;
  rating?: number;
}

export interface Client {
  id: string;
  companyName: string;
  primaryContact: string;
  email: string;
  phone: string;
  address: string;
  billingAddress: string;
  paymentTerms: number;
  isActive: boolean;
  primaryRoleCode?: PartyRoleCode | null;
  createdAt: string;
  updatedAt: string;
  activeOrders?: number;
  totalRevenue?: number;
  feeSchedule?: any; // jsonb
  preferredTurnaround?: number;
  specialRequirements?: string;
  
  // Relations
  role?: PartyRole;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  priority: OrderPriority;
  orderType: OrderType;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  propertyType: PropertyType;
  propertyId?: string; // Link to canonical property (building-level)
  propertyUnitId?: string; // Link to specific unit (optional, for fee-simple properties)
  loanNumber?: string;
  loanType?: string;
  loanAmount?: number;
  clientId: string;
  lenderName?: string;
  loanOfficer?: string;
  loanOfficerEmail?: string;
  loanOfficerPhone?: string;
  processorName?: string;
  processorEmail?: string;
  processorPhone?: string;
  borrowerName: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  propertyContactName?: string;
  propertyContactPhone?: string;
  propertyContactEmail?: string;
  accessInstructions?: string;
  specialInstructions?: string;
  dueDate: string;
  orderedDate: string;
  completedDate?: string;
  deliveredDate?: string;
  feeAmount: number;
  techFee?: number;
  totalAmount: number;
  assignedTo?: string; // user id
  assignedDate?: string;
  createdBy: string; // user id
  createdAt: string;
  updatedAt: string;
  metadata?: any; // jsonb
  
  // Appraisal Workflow Fields (added 2025-10-24)
  scopeOfWork?: 'desktop' | 'exterior_only' | 'interior' | 'inspection_only' | 'desk_review' | 'field_review';
  intendedUse?: string; // Refinance, Purchase, FHA, etc. (30+ values)
  reportFormType?: string; // 1004, 1073, 2055, 1025, etc.
  additionalForms?: string[]; // Array: ['1007', 'REO Addendum', etc.]
  billingMethod?: 'online' | 'bill' | 'cod';
  salesCampaign?: string; // client_selection, bid_request, etc.
  serviceRegion?: string; // ORL-SW-PRIMARY, TAMPA-NE-EXTENDED, etc.
  siteInfluence?: 'none' | 'water' | 'commercial' | 'woods' | 'golf_course';
  isMultiunit?: boolean;
  multiunitType?: 'adu_apartment_inlaw' | 'two_unit' | 'three_unit' | 'four_unit' | 'five_plus_commercial';
  isNewConstruction?: boolean;
  newConstructionType?: 'community_builder' | 'spec_custom' | 'refinance_newly_constructed';
  zoningType?: 'residential' | 'planned_unit_development' | 'two_unit' | 'three_unit' | 'four_unit' | 'mixed_use' | 'agricultural' | 'commercial';
  inspectionDate?: string;
  
  props?: {
    // Custom fields from imports
    unit?: string; // Unit number if extracted from address
    uspap?: {
      prior_work_3y: number;
      as_of: string;
    };
    [key: string]: any; // Other custom fields
  };
  
  // Relations
  client?: Client;
  assignee?: User;
  property?: Property;
  propertyUnit?: PropertyUnit;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  action: string;
  fromValue?: string;
  toValue?: string;
  changedById: string; // user id
  notes?: string;
  createdAt: string;
  
  // Relations
  changedBy?: User;
}

export interface OrderDocument {
  id: string;
  orderId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedById: string; // user id
  uploadedAt: string;

  // Relations
  uploadedBy?: User;
}

export interface OrderNote {
  id: string;
  orderId: string;
  note: string;
  isInternal: boolean;
  createdById: string; // user id
  createdAt: string;

  // Relations
  createdBy?: User;
}

// =============================================
// CRM TYPES
// =============================================

export interface Contact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  isPrimary: boolean;
  department?: string;
  notes?: string;
  primaryRoleCode?: PartyRoleCode | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  client?: Client;
  role?: PartyRole;
}

export interface PartyRole {
  code: PartyRoleCode;
  label: string;
  description?: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export const activityTypes = ['call', 'email', 'meeting', 'note', 'task'] as const;
export type ActivityType = typeof activityTypes[number];

export const activityStatuses = ['scheduled', 'completed', 'cancelled'] as const;
export type ActivityStatus = typeof activityStatuses[number];

export interface Activity {
  id: string;
  clientId?: string;
  contactId?: string;
  orderId?: string;
  dealId?: string;
  activityType: ActivityType;
  subject: string;
  description?: string;
  status: ActivityStatus;
  scheduledAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  outcome?: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  client?: Client;
  contact?: Contact;
  order?: Order;
  deal?: Deal;
  creator?: User;
  assignee?: User;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface ClientTag {
  clientId: string;
  tagId: string;
  createdAt: string;
  
  // Relations
  tag?: Tag;
}

// =============================================
// PHASE 2: DEALS & TASKS
// =============================================

export const dealStages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
export type DealStage = typeof dealStages[number];

export interface Deal {
  id: string;
  clientId: string;
  contactId?: string;
  title: string;
  description?: string;
  value?: number;
  probability: number; // 0-100
  stage: DealStage;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  lostReason?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  client?: Client;
  contact?: Contact;
  assignee?: User;
  creator?: User;
}

export const taskStatuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export type TaskStatus = typeof taskStatuses[number];

export const taskPriorities = ['low', 'normal', 'high', 'urgent'] as const;
export type TaskPriority = typeof taskPriorities[number];

export interface Task {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  contactId?: string;
  orderId?: string;
  dealId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  client?: Client;
  contact?: Contact;
  order?: Order;
  deal?: Deal;
  assignee?: User;
  creator?: User;
}

// =============================================
// CASE MANAGEMENT
// =============================================

export const caseStatuses = ['new', 'open', 'pending', 'in_progress', 'resolved', 'closed', 'reopened'] as const;
export type CaseStatus = typeof caseStatuses[number];

export const casePriorities = ['low', 'normal', 'high', 'urgent', 'critical'] as const;
export type CasePriority = typeof casePriorities[number];

export const caseTypes = ['support', 'billing', 'quality_concern', 'complaint', 'service_request', 'technical', 'feedback', 'other'] as const;
export type CaseType = typeof caseTypes[number];

export interface Case {
  id: string;
  caseNumber: string;
  subject: string;
  description?: string;
  caseType: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  clientId?: string;
  contactId?: string;
  orderId?: string;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  
  // Relations
  client?: Client;
  contact?: Contact;
  order?: Order;
  assignee?: User;
  creator?: User;
}

export interface CaseComment {
  id: string;
  caseId: string;
  comment: string;
  isInternal: boolean;
  createdBy: string;
  createdAt: string;
  
  // Relations
  creator?: User;
}

// =============================================
// GOALS & TARGETS
// =============================================

export const goalMetricTypes = [
  'order_volume',
  'revenue', 
  'new_clients',
  'completion_rate',
  'deal_value',
  'deals_closed'
] as const;
export type GoalMetricType = typeof goalMetricTypes[number];

export const periodTypes = ['monthly', 'quarterly', 'yearly'] as const;
export type PeriodType = typeof periodTypes[number];

export interface Goal {
  id: string;
  metricType: GoalMetricType;
  targetValue: number;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  assignedTo?: string; // User ID or null for team goal
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  assignee?: User;
  creator?: User;
}

export interface GoalProgress {
  goal: Goal;
  currentValue: number;
  progress: number; // percentage (0-100+)
  isOnTrack: boolean;
  daysRemaining: number;
  periodProgressPct: number; // how far through the period we are
}

// =============================================
// PROPERTIES SYSTEM
// =============================================

export interface Property {
  id: string;
  orgId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string; // 2-letter uppercase
  postalCode: string; // 5 or 9 digits
  country: string;
  propertyType: PropertyType;
  apn?: string; // assessor parcel number
  latitude?: number;
  longitude?: number;
  gla?: number; // gross living area
  lotSize?: number;
  yearBuilt?: number;
  addrHash: string; // normalized key for deduplication
  validationStatus?: string; // Address validation status
  verificationSource?: string; // Source of address verification (e.g., 'google_geocode', 'usps')
  props?: any; // jsonb for flexible storage
  createdAt: string;
  updatedAt: string;

  // Computed fields
  priorWork3y?: number; // USPAP prior work count (3 years)

  // Relations
  orders?: Order[]; // Related orders
  units?: PropertyUnit[]; // Related units (for fee-simple properties)
}

export interface PropertyUnit {
  id: string;
  propertyId: string; // FK to properties
  unitIdentifier: string; // User-facing: "Apt 2B", "305", "Unit A"
  unitNorm: string | null; // Normalized key for dedupe: "2B", "305", "A"
  unitType?: string; // 'condo', 'apartment', 'townhouse', 'office', etc.
  props?: any; // jsonb for flexible storage (bed/bath, sqft, owner, etc.)
  createdAt: string;
  updatedAt: string;
  
  // Computed fields
  priorWork3y?: number; // USPAP prior work count (3 years) for this unit
  orderCount?: number; // Total orders for this unit
  
  // Relations
  property?: Property;
  orders?: Order[];
}

export interface PropertyFilters {
  search?: string;
  city?: string;
  state?: string;
  zip?: string;
  propertyType?: PropertyType;
  page?: number;
  limit?: number;
}

export interface BackfillResult {
  scanned: number;
  propertiesCreated: number;
  ordersLinked: number;
  skipped: number;
  warnings: Array<{
    type: string;
    message: string;
    data?: any;
  }>;
}
