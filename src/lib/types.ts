import { PartyRoleCode } from './roles/mapPartyRole';

// Production Kanban stages - aligned with database constraint
export const orderStatuses = [
  'INTAKE',
  'SCHEDULING',
  'SCHEDULED',
  'INSPECTED',
  'FINALIZATION',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CORRECTION',
  'REVISION',
  'WORKFILE',
  'cancelled',
  'on_hold'
] as const;
export type OrderStatus = typeof orderStatuses[number];

// Human-readable labels for order statuses
export const orderStatusLabels: Record<OrderStatus, string> = {
  INTAKE: "Intake",
  SCHEDULING: "Scheduling",
  SCHEDULED: "Scheduled",
  INSPECTED: "Inspected",
  FINALIZATION: "Finalization",
  READY_FOR_DELIVERY: "Ready for Delivery",
  DELIVERED: "Delivered",
  CORRECTION: "Correction",
  REVISION: "Revision",
  WORKFILE: "Workfile",
  cancelled: "Cancelled",
  on_hold: "On Hold",
};

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
  primaryContact: string | null;
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

  // Billing contact fields
  billingContactId?: string | null;
  billingEmailConfirmed: boolean;

  // Relations
  role?: PartyRole;
  billingContact?: Contact;
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
  tags?: string[];
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
  gmailMessageId?: string;
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

export interface ContactTag {
  contactId: string;
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

export const caseStatuses = [
  'new',
  'working',
  'in_production',
  'correction',
  'impeded',
  'workshop_meeting',
  'review',
  'deliver',
  'completed',
  'process_improvement'
] as const;
export type CaseStatus = typeof caseStatuses[number];

// Labels for display
export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  new: 'New',
  working: 'Working',
  in_production: 'In Production',
  correction: 'Correction',
  impeded: 'Impeded',
  workshop_meeting: 'Workshop Meeting',
  review: 'Review',
  deliver: 'Deliver',
  completed: 'Completed',
  process_improvement: 'Process Improvement',
};

// Colors for each status column
export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  new: 'bg-slate-50 border-slate-200',
  working: 'bg-blue-50 border-blue-200',
  in_production: 'bg-purple-50 border-purple-200',
  correction: 'bg-orange-50 border-orange-200',
  impeded: 'bg-red-50 border-red-200',
  workshop_meeting: 'bg-yellow-50 border-yellow-200',
  review: 'bg-indigo-50 border-indigo-200',
  deliver: 'bg-teal-50 border-teal-200',
  completed: 'bg-green-50 border-green-200',
  process_improvement: 'bg-pink-50 border-pink-200',
};

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

// =============================================
// FIELD SERVICES MODULE
// =============================================

// Skill Types
export const skillCategories = ['certification', 'property_type', 'specialization', 'software', 'equipment'] as const;
export type SkillCategory = typeof skillCategories[number];

export interface SkillType {
  id: string;
  name: string;
  description?: string;
  category?: SkillCategory;
  isRequired: boolean;
  isActive: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

// Service Territories
export const territoryTypes = ['primary', 'secondary', 'extended'] as const;
export type TerritoryType = typeof territoryTypes[number];

export interface ServiceTerritory {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  territoryType: TerritoryType;
  zipCodes?: string[];
  counties?: string[];
  cities?: string[];
  radiusMiles?: number;
  centerLat?: number;
  centerLng?: number;
  boundaryPolygon?: any; // GeoJSON
  baseTravelTimeMinutes: number;
  mileageRate: number;
  travelFee: number;
  isActive: boolean;
  colorHex: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

// Bookable Resources
export const resourceTypes = ['appraiser', 'equipment', 'vehicle', 'facility'] as const;
export type ResourceType = typeof resourceTypes[number];

export const employmentTypes = ['staff', 'contractor', 'vendor'] as const;
export type EmploymentType = typeof employmentTypes[number];

export interface WorkingHours {
  enabled: boolean;
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

export interface DefaultWorkingHours {
  monday: WorkingHours;
  tuesday: WorkingHours;
  wednesday: WorkingHours;
  thursday: WorkingHours;
  friday: WorkingHours;
  saturday: WorkingHours;
  sunday: WorkingHours;
}

export interface BookableResource {
  id: string;
  resourceType: ResourceType;
  employmentType?: EmploymentType;
  isBookable: boolean;
  bookingBufferMinutes: number;
  maxDailyAppointments: number;
  maxWeeklyHours: number;
  primaryTerritoryId?: string;
  serviceTerritoryIds?: string[];
  hourlyRate?: number;
  overtimeRate?: number;
  perInspectionRate?: number;
  splitPercentage?: number;
  assignedEquipmentIds?: string[];
  licenseNumber?: string;
  licenseState?: string;
  licenseExpiry?: string;
  errorsAndOmissionsCarrier?: string;
  errorsAndOmissionsExpiry?: string;
  errorsAndOmissionsAmount?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredContactMethod: 'email' | 'sms' | 'phone';
  avgInspectionDurationMinutes?: number;
  avgDriveTimeMinutes?: number;
  completionRate?: number;
  avgCustomerRating?: number;
  totalInspectionsCompleted: number;
  defaultWorkingHours: DefaultWorkingHours;
  timezone: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;

  // Relations
  profile?: User;
  primaryTerritory?: ServiceTerritory;
  skills?: ResourceSkill[];
  availability?: ResourceAvailability[];
}

// Resource Skills
export const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export type ProficiencyLevel = typeof proficiencyLevels[number];

export interface ResourceSkill {
  id: string;
  resourceId: string;
  skillTypeId: string;
  proficiencyLevel: ProficiencyLevel;
  certificationNumber?: string;
  certifiedDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  skillType?: SkillType;
  resource?: BookableResource;
  verifier?: User;
}

// Resource Availability
export const availabilityTypes = ['working_hours', 'time_off', 'blocked', 'override'] as const;
export type AvailabilityType = typeof availabilityTypes[number];

export const availabilityStatuses = ['pending', 'approved', 'rejected'] as const;
export type AvailabilityStatus = typeof availabilityStatuses[number];

export interface ResourceAvailability {
  id: string;
  resourceId: string;
  availabilityType: AvailabilityType;
  startDatetime: string;
  endDatetime: string;
  isAvailable: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  reason?: string;
  notes?: string;
  isAllDay: boolean;
  status: AvailabilityStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  resource?: BookableResource;
  approver?: User;
  creator?: User;
}

// Equipment Catalog
export const equipmentTypes = ['camera', 'drone', 'measuring_device', 'laptop', 'tablet', 'vehicle', 'software_license', 'other'] as const;
export type EquipmentType = typeof equipmentTypes[number];

export const equipmentStatuses = ['available', 'in_use', 'maintenance', 'retired', 'lost', 'damaged'] as const;
export type EquipmentStatus = typeof equipmentStatuses[number];

export interface Equipment {
  id: string;
  orgId: string;
  name: string;
  equipmentType: EquipmentType;
  serialNumber?: string;
  assetTag?: string;
  make?: string;
  model?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseCost?: number; // Alias for purchasePrice
  currentValue?: number;
  depreciationSchedule?: string;
  status: EquipmentStatus;
  condition?: EquipmentCondition; // Current condition
  assignedTo?: string;
  assignedDate?: string;
  location?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceIntervalDays?: number;
  maintenanceSchedule?: string;
  maintenanceNotes?: string;
  notes?: string; // General notes
  warrantyExpiry?: string;
  insurancePolicy?: string;
  insuranceExpiry?: string;
  isActive: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;

  // Relations
  assignedResource?: BookableResource;
  currentAssignment?: EquipmentAssignment[];
  assignments?: EquipmentAssignment[];
}

// Equipment Assignments
export const equipmentConditions = ['excellent', 'good', 'fair', 'poor'] as const;
export type EquipmentCondition = typeof equipmentConditions[number];

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  resourceId: string;
  assignedDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  conditionAtCheckout?: EquipmentCondition;
  conditionAtReturn?: EquipmentCondition;
  checkoutNotes?: string;
  returnNotes?: string;
  damageReported: boolean;
  damageDescription?: string;
  damageCost?: number;
  assignedBy: string;
  returnedTo?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  equipment?: Equipment;
  resource?: BookableResource;
  assigner?: User;
  receiver?: User;
}

// =============================================
// PHASE 2: SCHEDULING & DISPATCH
// =============================================

// Bookings
export const bookingTypes = ['inspection', 'follow_up', 'reinspection', 'consultation', 'maintenance', 'training', 'other'] as const;
export type BookingType = typeof bookingTypes[number];

export const bookingStatuses = ['requested', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'] as const;
export type BookingStatus = typeof bookingStatuses[number];

export interface Booking {
  id: string;
  orgId: string;
  orderId?: string;
  resourceId: string;
  territoryId?: string;
  bookingNumber: string;
  bookingType: BookingType;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  durationMinutes?: number;
  actualDurationMinutes?: number;
  status: BookingStatus;
  propertyAddress: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  latitude?: number;
  longitude?: number;
  accessInstructions?: string;
  specialInstructions?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  estimatedTravelTimeMinutes?: number;
  actualTravelTimeMinutes?: number;
  estimatedMileage?: number;
  actualMileage?: number;
  routeData?: any;
  originalBookingId?: string;
  rescheduledBookingId?: string;
  rescheduleReason?: string;
  rescheduleCount: number;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  completedAt?: string;
  completionNotes?: string;
  customerSignature?: string;
  customerRating?: number;
  customerFeedback?: string;
  confirmationSentAt?: string;
  reminderSentAt?: string;
  reminderCount: number;
  assignedBy?: string;
  assignedAt?: string;
  autoAssigned: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;

  // Relations
  order?: Order;
  resource?: BookableResource;
  territory?: ServiceTerritory;
  assigner?: User;
  canceller?: User;
  originalBooking?: Booking;
  rescheduledBooking?: Booking;
}

// Booking Conflicts
export const conflictTypes = ['time_overlap', 'travel_time', 'double_booked', 'capacity_exceeded', 'territory_mismatch', 'skill_missing'] as const;
export type ConflictType = typeof conflictTypes[number];

export const conflictSeverities = ['info', 'warning', 'error'] as const;
export type ConflictSeverity = typeof conflictSeverities[number];

export interface BookingConflict {
  id: string;
  bookingId1: string;
  bookingId2: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  overlapMinutes?: number;
  requiredTravelMinutes?: number;
  details?: any;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt: string;

  // Relations
  booking1?: Booking;
  booking2?: Booking;
  resolver?: User;
}

// Time Entries
export const timeEntryTypes = ['clock_in', 'clock_out', 'break_start', 'break_end', 'travel_start', 'travel_end'] as const;
export type TimeEntryType = typeof timeEntryTypes[number];

export interface TimeEntry {
  id: string;
  bookingId: string;
  resourceId: string;
  entryType: TimeEntryType;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  locationAccuracyMeters?: number;
  deviceType?: string;
  deviceId?: string;
  ipAddress?: string;
  notes?: string;
  metadata?: any;
  createdAt: string;

  // Computed/derived fields (may be added by API)
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  isBillable?: boolean;

  // Relations
  booking?: Booking;
  resource?: BookableResource;
}

// Route Plans
export const routeOptimizationStatuses = ['pending', 'optimizing', 'optimized', 'failed'] as const;
export type RouteOptimizationStatus = typeof routeOptimizationStatuses[number];

export interface RoutePlan {
  id: string;
  resourceId: string;
  planDate: string;
  optimizationStatus: RouteOptimizationStatus;
  optimizedAt?: string;
  totalDistanceMiles?: number;
  totalDriveTimeMinutes?: number;
  totalOnSiteTimeMinutes?: number;
  totalBreaksMinutes?: number;
  bookingIds?: string[];
  waypoints?: any;
  routePolyline?: string;
  routeData?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;

  // Relations
  resource?: BookableResource;
  bookings?: Booking[];
}

// Phase 4: Route Optimization & Mobile Support

// Mileage Logs
export const mileagePurposes = ['business', 'personal', 'commute'] as const;
export type MileagePurpose = typeof mileagePurposes[number];

export interface MileageLog {
  id: string;
  orgId: string;
  resourceId: string;
  bookingId?: string;
  routePlanId?: string;
  logDate: string;
  startTime?: string;
  endTime?: string;
  startLocation?: string;
  endLocation?: string;
  startCoordinates?: { lat: number; lng: number };
  endCoordinates?: { lat: number; lng: number };
  distanceMiles?: number;
  distanceKm?: number;
  purpose: MileagePurpose;
  isBillable: boolean;
  vehicleId?: string;
  odometerStart?: number;
  odometerEnd?: number;
  ratePerMile?: number;
  reimbursementAmount?: number;
  isReimbursed: boolean;
  reimbursedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  resource?: BookableResource;
  booking?: Booking;
  routePlan?: RoutePlan;
  vehicle?: Equipment;
}

// GPS Tracking
export interface GpsTracking {
  id: string;
  resourceId: string;
  bookingId?: string;
  timestamp: string;
  coordinates: { lat: number; lng: number; accuracy?: number };
  speed?: number;
  heading?: number;
  altitude?: number;
  batteryLevel?: number;
  isOnline: boolean;
  createdAt: string;

  // Relations
  resource?: BookableResource;
  booking?: Booking;
}

// Route Waypoints
export interface RouteWaypoint {
  id: string;
  routePlanId: string;
  bookingId?: string;
  sequenceOrder: number;
  locationName?: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  arrivalTime?: string;
  departureTime?: string;
  durationMinutes?: number;
  distanceFromPrevious?: number;
  travelTimeMinutes?: number;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  routePlan?: RoutePlan;
  booking?: Booking;
}

// Offline Sync Queue
export const syncOperations = ['create', 'update', 'delete'] as const;
export type SyncOperation = typeof syncOperations[number];

export interface OfflineSyncQueue {
  id: string;
  resourceId: string;
  entityType: string;
  entityId?: string;
  operation: SyncOperation;
  data: any;
  isSynced: boolean;
  syncedAt?: string;
  syncError?: string;
  createdAt: string;
  deviceId?: string;

  // Relations
  resource?: BookableResource;
}
