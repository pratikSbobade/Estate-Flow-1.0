
export enum ClientStatus {
  HOT = 'Hot',
  WARM = 'Warm',
  COLD = 'Cold'
}

export enum ClientType {
  BUYER = 'Buyer',
  TENANT = 'Tenant',
  INVESTOR = 'Investor',
  PARTNER = 'Channel Partner'
}

export enum UserRole {
  AGENT = 'Agent',
  SUPER_ADMIN = 'Super Admin',
  CUSTOM = 'Custom'
}

export type ResourceAction = 'Read' | 'Add' | 'Edit' | 'Delete' | 'Assign';
export type ResourceType = 
  | 'Properties' 
  | 'Leads' 
  | 'Site Visits' 
  | 'Reports' 
  | 'Admin: Team' 
  | 'Admin: Roles' 
  | 'Admin: Import' 
  | 'Admin: Templates' 
  | 'WhatsApp';

export interface RolePermissions {
  [resource: string]: {
    [action in ResourceAction]: boolean;
  };
}

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissions;
  isSystem?: boolean;
}

export interface WhatsAppAttachment {
  id: string;
  type: 'image' | 'video' | 'pdf';
  name: string;
  url: string;
  size?: string;
}

export interface WhatsAppTemplate {
  id: string;
  category: 'Clients' | 'Properties' | 'Visits' | 'General';
  name: string;
  message: string;
  attachments?: WhatsAppAttachment[];
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole | string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | 'Deactivated';
  email: string;
  mobile?: string;
  whatsapp?: string;
  reraId?: string;
  territory?: string;
  joinDate?: string;
  password?: string;
  photo?: string;
  region?: string;
  managerId?: string; // Track reporting hierarchy
  createdAt?: string;
}

export interface ClientInteraction {
  id: string;
  clientId: string;
  type: 'Call' | 'WhatsApp' | 'Visit' | 'Email' | 'Note';
  description: string;
  timestamp: string;
  relatedId?: string;
}

export interface Client {
  id: string;
  salutation: string;
  firstName: string;
  lastName: string;
  type: ClientType;
  mobile: string;
  secondaryPhone?: string[];
  email?: string;
  address: string;
  officeLocation?: string;
  companyName?: string;
  designation?: string;
  requirementType: 'Buy' | 'Rent' | 'Invest';
  propertyTypes: string[]; 
  locations: string[]; 
  budgetMin: number;
  budgetMax: number;
  configuration: string[]; 
  purpose: 'Self-use' | 'Investment' | 'Rental Income';
  timeToBuy: '0–3 months' | '3–6 months' | '6–12 months' | 'Just Exploring';
  employmentType: 'Salaried' | 'Self-Employed' | 'Business' | 'NRI';
  incomeRange: string;
  loanRequired: boolean;
  preApproved: boolean;
  source: 'Portal' | 'Website' | 'Referral' | 'Campaign' | 'Cold Call' | 'Walk-in';
  priority: ClientStatus;
  agent: string;
  nurturingScore: number;
  createdAt: string;
  interactions?: ClientInteraction[];
}

export interface SiteVisitHistory {
  status: string;
  date: string;
  note?: string;
}

export interface SiteVisit {
  id: string;
  clientId: string;
  clientName: string;
  propertyId: string;
  propertyName: string;
  scheduledAt: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  history?: SiteVisitHistory[];
  feedback?: {
    notes: string;
    outcome: string;
    rating: number;
    likes: string;
    dislikes: string;
    probability: ClientStatus;
    nextAction: 'Second Visit' | 'Negotiation Meeting' | 'Drop' | 'Deal' | 'Send Details' | 'Send Quotation';
    nextFollowUp: string;
    attachments: string[]; 
    bookingFormUploaded?: boolean;
  };
}

export interface PropertyConfiguration {
  bhk: string;
  carpetArea: number;
  builtUpArea: number;
  superBuiltUpArea: number;
  unit: 'sq ft' | 'sq m';
  pricePerSqUnit: number; 
  bathrooms: number;
  balconies: number;
  parking: 'Covered' | 'Open' | 'None';
  costing: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: string; 
  listingType: string; 
  possessionDate: string;
  location: {
    country: string;
    state: string;
    city: string;
    area: string;
    landmark: string;
    mapLink: string;
  };
  towers: Array<{ name: string; possession: string }>;
  totalUnits: number;
  reraCompletionDate: string;
  configurations: PropertyConfiguration[];
  financials: {
    priceMin: number;
    priceMax: number;
    allInclusive: boolean;
    maintenanceAmount: number;
    maintenanceFrequency: string;
    bookingAmount: number;
    negotiable: boolean;
    expectedRent?: number;
  };
  legal: {
    ownershipType: 'Joint Venture' | 'Sole Owner';
    owners: Array<{ name: string; company: string }>;
    reraId: string;
    reraCertificate?: string;
    occupancyStatus: 'Under Construction' | 'Ready to Move' | 'Occupied' | 'Vacant';
  };
  amenities: string[];
  furnishing: {
    status: 'Unfurnished' | 'Semi-furnished' | 'Fully-furnished';
    interiors: string[];
  };
  views: string[];
  media: {
    photos: string[];
    videoUrl: string;
    floorPlanUrl: string;
    documents: Array<{ name: string; url: string }>;
  };
  source: {
    dedicatedRM: string;
    rmContact: string;
    tat: string;
  };
  status: 'Available' | 'Sold' | 'Reserved' | 'On Hold';
}
