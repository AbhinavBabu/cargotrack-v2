import { Link } from 'react-router-dom';
import { Shipment } from '../types';
import { StatusBadge } from './TrackingTimeline';
import { Eye, MapPin, Calendar } from 'lucide-react';

interface Props {
  shipments: Shipment[];
}

export default function ShipmentTable({ shipments }: Props) {
  if (shipments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No shipments found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Tracking #</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Title</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Route</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Date</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shipments.map((shipment) => (
              <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-mono font-medium text-primary-600">{shipment.trackingNumber}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-900">{shipment.title}</p>
                  <p className="text-xs text-slate-500">{shipment.shipmentType} · {shipment.weight} kg</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[120px]">{shipment.origin}</span>
                    <span className="text-slate-400">→</span>
                    <span className="truncate max-w-[120px]">{shipment.destination}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={shipment.status} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-500">{new Date(shipment.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    to={`/shipments/${shipment.id}`}
                    className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {shipments.map((shipment) => (
          <Link key={shipment.id} to={`/shipments/${shipment.id}`} className="block p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-mono font-medium text-primary-600">{shipment.trackingNumber}</span>
              <StatusBadge status={shipment.status} />
            </div>
            <p className="text-sm font-medium text-slate-900">{shipment.title}</p>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <MapPin className="w-3 h-3" />
              {shipment.origin} → {shipment.destination}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
              <Calendar className="w-3 h-3" />
              {new Date(shipment.createdAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
