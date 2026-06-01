import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Shipment } from '../types';
import Layout from '../components/Layout';
import TrackingTimeline, { StatusBadge } from '../components/TrackingTimeline';
import DocumentUpload from '../components/DocumentUpload';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Edit,
  XCircle,
  MapPin,
  Weight,
  Calendar,
  User,
  Package,
  Copy,
} from 'lucide-react';

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: shipment, isLoading } = useQuery<Shipment>({
    queryKey: ['shipment', id],
    queryFn: async () => {
      const { data } = await api.get(`/shipments/${id}`);
      return data;
    },
  });

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this shipment?')) return;
    try {
      await api.delete(`/shipments/${id}`);
      toast.success('Shipment cancelled');
      queryClient.invalidateQueries({ queryKey: ['shipment', id] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel shipment');
    }
  };

  const copyTracking = () => {
    if (shipment) {
      navigator.clipboard.writeText(shipment.trackingNumber);
      toast.success('Tracking number copied!');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!shipment) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-slate-500">Shipment not found</p>
        </div>
      </Layout>
    );
  }

  const canEdit = !['DELIVERED', 'CANCELLED'].includes(shipment.status);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button onClick={() => navigate('/shipments')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Shipments
            </button>
            <h1 className="text-2xl font-bold text-slate-900">{shipment.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={copyTracking} className="flex items-center gap-1.5 text-sm font-mono text-primary-600 hover:text-primary-700">
                {shipment.trackingNumber}
                <Copy className="w-3 h-3" />
              </button>
              <StatusBadge status={shipment.status} />
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button onClick={handleCancel} className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Shipment Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Shipment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Sender</p>
                <p className="text-sm font-medium text-slate-900">{shipment.senderName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Receiver</p>
                <p className="text-sm font-medium text-slate-900">{shipment.receiverName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Type</p>
                <p className="text-sm font-medium text-slate-900">{shipment.shipmentType}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Origin</p>
                <p className="text-sm font-medium text-slate-900">{shipment.origin}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Destination</p>
                <p className="text-sm font-medium text-slate-900">{shipment.destination}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Weight className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Weight</p>
                <p className="text-sm font-medium text-slate-900">{shipment.weight} kg</p>
              </div>
            </div>
            {shipment.estimatedDeliveryDate && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Estimated Delivery</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="text-sm font-medium text-slate-900">{new Date(shipment.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          {shipment.description && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-700">{shipment.description}</p>
            </div>
          )}
        </div>

        {/* Tracking Timeline */}
        {shipment.trackingEvents && shipment.trackingEvents.length > 0 && (
          <TrackingTimeline events={shipment.trackingEvents} currentStatus={shipment.status} />
        )}

        {/* Documents */}
        <DocumentUpload
          shipmentId={shipment.id}
          documents={shipment.documents || []}
          onUploaded={() => queryClient.invalidateQueries({ queryKey: ['shipment', id] })}
        />
      </div>
    </Layout>
  );
}
