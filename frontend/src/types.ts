export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  profilePicture?: string | null;
  createdAt: string;
}

export type ShipmentStatus =
  | 'CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELAYED'
  | 'CANCELLED';

export interface Shipment {
  id: string;
  trackingNumber: string;
  title: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  shipmentType: string;
  weight: number;
  description?: string;
  estimatedDeliveryDate?: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
  trackingEvents?: TrackingEvent[];
  documents?: ShipmentDocument[];
  user?: { id: string; name: string; email: string };
}

export interface TrackingEvent {
  id: string;
  status: ShipmentStatus;
  location?: string;
  description: string;
  timestamp: string;
}

export interface ShipmentDocument {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  uploadedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TrackingInfo {
  trackingNumber: string;
  title: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  shipmentType: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  trackingEvents: TrackingEvent[];
}
