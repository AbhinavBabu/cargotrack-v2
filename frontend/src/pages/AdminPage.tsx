import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { PaginatedResponse, Shipment, ShipmentStatus } from '../types';
import Layout from '../components/Layout';
import { StatusBadge } from '../components/TrackingTimeline';
import toast from 'react-hot-toast';
import { Search, Shield, MapPin, User, Eye, ChevronDown } from 'lucide-react';

const STATUSES: ShipmentStatus[] = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'CANCELLED'];

export default function AdminPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Shipment>>({
    queryKey: ['admin-shipments', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/admin/shipments?${params}`);
      return data;
    },
  });

  const handleUpdateStatus = async (shipmentId: string, newStatus: ShipmentStatus) => {
    setUpdatingId(shipmentId);
    try {
      await api.put(`/admin/shipments/${shipmentId}/status`, {
        status: newStatus,
        description: `Status updated to ${newStatus.replace(/_/g, ' ')}`,
      });
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['admin-shipments'] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-500">Manage all shipments across the platform</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search shipments..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setSearch(searchInput), setPage(1))}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button onClick={() => { setSearch(searchInput); setPage(1); }} className="px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200">
              Search
            </button>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Tracking #</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Title</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">User</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Route</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.data || []).map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-medium text-primary-600">{shipment.trackingNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900">{shipment.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="text-sm text-slate-600">{shipment.user?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[100px]">{shipment.origin}</span>
                            <span className="text-slate-400">→</span>
                            <span className="truncate max-w-[100px]">{shipment.destination}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={shipment.status} />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value=""
                            onChange={(e) => handleUpdateStatus(shipment.id, e.target.value as ShipmentStatus)}
                            disabled={updatingId === shipment.id}
                            className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            <option value="" disabled>Change status...</option>
                            {STATUSES.map((s) => (
                              <option key={s} value={s} disabled={s === shipment.status}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(!data?.data || data.data.length === 0) && (
                <div className="p-12 text-center">
                  <p className="text-slate-500">No shipments found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50">
                    Previous
                  </button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.totalPages} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
