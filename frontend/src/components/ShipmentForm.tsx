import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Shipment } from '../types';

interface Props {
  shipment?: Shipment;
}

export default function ShipmentForm({ shipment }: Props) {
  const navigate = useNavigate();
  const isEditing = !!shipment;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: shipment?.title || '',
    senderName: shipment?.senderName || '',
    receiverName: shipment?.receiverName || '',
    origin: shipment?.origin || '',
    destination: shipment?.destination || '',
    shipmentType: shipment?.shipmentType || 'Standard',
    weight: shipment?.weight?.toString() || '',
    description: shipment?.description || '',
    estimatedDeliveryDate: shipment?.estimatedDeliveryDate
      ? new Date(shipment.estimatedDeliveryDate).toISOString().split('T')[0]
      : '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        weight: parseFloat(formData.weight),
        estimatedDeliveryDate: formData.estimatedDeliveryDate || undefined,
      };

      if (isEditing) {
        await api.put(`/shipments/${shipment.id}`, payload);
        toast.success('Shipment updated successfully');
      } else {
        const { data } = await api.post('/shipments', payload);
        toast.success(`Shipment created! Tracking: ${data.trackingNumber}`);
      }
      navigate('/shipments');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputClass = "w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="title" className={labelClass}>Title *</label>
          <input id="title" name="title" type="text" required value={formData.title} onChange={handleChange} placeholder="e.g., Electronics Package" className={inputClass} />
        </div>

        <div>
          <label htmlFor="senderName" className={labelClass}>Sender Name *</label>
          <input id="senderName" name="senderName" type="text" required value={formData.senderName} onChange={handleChange} placeholder="Sender name" className={inputClass} />
        </div>

        <div>
          <label htmlFor="receiverName" className={labelClass}>Receiver Name *</label>
          <input id="receiverName" name="receiverName" type="text" required value={formData.receiverName} onChange={handleChange} placeholder="Receiver name" className={inputClass} />
        </div>

        <div>
          <label htmlFor="origin" className={labelClass}>Origin *</label>
          <input id="origin" name="origin" type="text" required value={formData.origin} onChange={handleChange} placeholder="e.g., New York, NY" className={inputClass} />
        </div>

        <div>
          <label htmlFor="destination" className={labelClass}>Destination *</label>
          <input id="destination" name="destination" type="text" required value={formData.destination} onChange={handleChange} placeholder="e.g., Los Angeles, CA" className={inputClass} />
        </div>

        <div>
          <label htmlFor="shipmentType" className={labelClass}>Shipment Type *</label>
          <select id="shipmentType" name="shipmentType" required value={formData.shipmentType} onChange={handleChange} className={inputClass}>
            <option value="Standard">Standard</option>
            <option value="Express">Express</option>
            <option value="Priority">Priority</option>
            <option value="Freight">Freight</option>
            <option value="International">International</option>
          </select>
        </div>

        <div>
          <label htmlFor="weight" className={labelClass}>Weight (kg) *</label>
          <input id="weight" name="weight" type="number" step="0.01" min="0.01" required value={formData.weight} onChange={handleChange} placeholder="0.00" className={inputClass} />
        </div>

        <div>
          <label htmlFor="estimatedDeliveryDate" className={labelClass}>Estimated Delivery Date</label>
          <input id="estimatedDeliveryDate" name="estimatedDeliveryDate" type="date" value={formData.estimatedDeliveryDate} onChange={handleChange} className={inputClass} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className={labelClass}>Description</label>
          <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} placeholder="Optional description..." className={inputClass} />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? 'Saving...' : isEditing ? 'Update Shipment' : 'Create Shipment'}
        </button>
        <button type="button" onClick={() => navigate('/shipments')} className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
