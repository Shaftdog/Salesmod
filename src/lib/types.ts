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
  createdAt: string;
  updatedAt: string;
  activeOrders?: number;
  totalRevenue?: number;
  feeSchedule?: any; // jsonb
  preferredTurnaround?: number;
  specialRequirements?: string;
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
  
  // Relations
  client?: Client;
  assignee?: User;
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
  createdAt: string;
  updatedAt: string;
  
  // Relations
  client?: Client;
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
