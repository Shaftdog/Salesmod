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
