import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { ShipmentDocument } from '../types';
import { Upload, File, Download, Trash2 } from 'lucide-react';

interface Props {
  shipmentId: string;
  documents: ShipmentDocument[];
  onUploaded: () => void;
}

const DOC_TYPES = [
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'SHIPPING_LABEL', label: 'Shipping Label' },
  { value: 'PROOF_OF_DELIVERY', label: 'Proof of Delivery' },
  { value: 'CUSTOMS', label: 'Customs Document' },
];

export default function DocumentUpload({ shipmentId, documents, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('INVOICE');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      await api.post(`/documents/shipment/${shipmentId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Document uploaded');
      onUploaded();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (doc: ShipmentDocument) => {
    try {
      const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Documents</h3>

      {/* Upload */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload File'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <p className="text-sm text-slate-500">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{doc.originalName}</p>
                  <p className="text-xs text-slate-500">
                    {DOC_TYPES.find((t) => t.value === doc.documentType)?.label} · {formatFileSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
