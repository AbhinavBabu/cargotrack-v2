import { useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { TrackingInfo } from '../types';
import TrackingTimeline from '../components/TrackingTimeline';
import { Truck, Search, MapPin, Package, Calendar } from 'lucide-react';

export default function TrackingPage() {
  const { trackingNumber: paramTracking } = useParams<{ trackingNumber: string }>();
  const [input, setInput] = useState(paramTracking || '');
  const [trackingNumber, setTrackingNumber] = useState(paramTracking || '');

  const { data, isLoading, error } = useQuery<TrackingInfo>({
    queryKey: ['tracking', trackingNumber],
    queryFn: async () => {
      const { data } = await api.get(`/tracking/${trackingNumber}`);
      return data;
    },
    enabled: !!trackingNumber,
  });

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setTrackingNumber(input.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Track Your Shipment</h1>
          <p className="text-primary-200 mb-8">Enter your tracking number to see real-time updates</p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., CT-2026-123456"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-white text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
            >
              Track
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        {error && trackingNumber && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-700">Shipment not found</p>
            <p className="text-sm text-slate-500 mt-1">Please check your tracking number and try again</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Shipment Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500">Tracking Number</p>
                  <p className="text-lg font-mono font-bold text-primary-600">{data.trackingNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Shipment Type</p>
                  <p className="text-sm font-medium text-slate-900">{data.shipmentType}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-xs text-slate-500">From</p>
                    <p className="text-sm font-medium text-slate-900">{data.origin}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-xs text-slate-500">To</p>
                    <p className="text-sm font-medium text-slate-900">{data.destination}</p>
                  </div>
                </div>
                {data.estimatedDeliveryDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-slate-500">Est. Delivery</p>
                      <p className="text-sm font-medium text-slate-900">{new Date(data.estimatedDeliveryDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <TrackingTimeline events={data.trackingEvents} currentStatus={data.status} />
          </div>
        )}
      </div>
    </div>
  );
}
