import { ShipmentStatus, TrackingEvent } from '../types';
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  CREATED: { label: 'Created', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  PICKED_UP: { label: 'Picked Up', icon: Truck, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  IN_TRANSIT: { label: 'In Transit', icon: Truck, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: MapPin, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  DELIVERED: { label: 'Delivered', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  DELAYED: { label: 'Delayed', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-slate-500', bgColor: 'bg-slate-100' },
};

const STATUS_ORDER: ShipmentStatus[] = [
  'CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

interface Props {
  events: TrackingEvent[];
  currentStatus: ShipmentStatus;
}

export default function TrackingTimeline({ events, currentStatus }: Props) {
  const isTerminal = currentStatus === 'CANCELLED' || currentStatus === 'DELAYED';

  return (
    <div className="space-y-6">
      {/* Status progress bar */}
      {!isTerminal && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            {STATUS_ORDER.map((status, index) => {
              const config = STATUS_CONFIG[status];
              const currentIndex = STATUS_ORDER.indexOf(currentStatus);
              const isCompleted = index <= currentIndex;
              const isCurrent = status === currentStatus;

              return (
                <div key={status} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {index > 0 && (
                      <div className={`h-1 flex-1 rounded ${isCompleted ? 'bg-primary-500' : 'bg-slate-200'}`} />
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                          : isCompleted
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <config.icon className="w-4 h-4" />
                    </div>
                    {index < STATUS_ORDER.length - 1 && (
                      <div className={`h-1 flex-1 rounded ${index < currentIndex ? 'bg-primary-500' : 'bg-slate-200'}`} />
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium text-center ${isCurrent ? 'text-primary-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline events */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Tracking History</h3>
        <div className="space-y-0">
          {events.map((event, index) => {
            const config = STATUS_CONFIG[event.status];
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor} ${config.color}`}>
                    <config.icon className="w-5 h-5" />
                  </div>
                  {!isLast && <div className="w-0.5 h-full min-h-[40px] bg-slate-200 my-1" />}
                </div>
                <div className={`pb-6 ${isLast ? '' : ''}`}>
                  <p className="font-medium text-slate-900">{config.label}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{event.description}</p>
                  {event.location && (
                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <config.icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
