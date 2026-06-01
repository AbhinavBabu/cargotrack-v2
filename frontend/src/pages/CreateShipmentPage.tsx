import Layout from '../components/Layout';
import ShipmentForm from '../components/ShipmentForm';

export default function CreateShipmentPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create Shipment</h1>
          <p className="text-sm text-slate-500 mt-1">Fill in the details to create a new shipment</p>
        </div>
        <ShipmentForm />
      </div>
    </Layout>
  );
}
