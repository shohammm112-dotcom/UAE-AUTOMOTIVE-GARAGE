import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiClient } from "@/lib/api/client";
import { hasCapability } from "@/lib/auth/StaffCapabilities";

export const StaffEstimateCreatePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [jobId, setJobId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPriceFils: 0, isMandatory: true, type: "part" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !hasCapability(user.roles, "estimates:create")) {
    return (
      <div className="p-8 text-center text-red-600">
        You do not have permission to create estimates.
      </div>
    );
  }

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPriceFils: 0, isMandatory: true, type: "part" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChangeItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        jobId,
        customerId,
        items: items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPriceFils: Math.round(Number(item.unitPriceFils)) // Ensure integer fils
        }))
      };
      
      const response = await ApiClient.post<{ estimate: { id: string } }>('/internal/estimates', payload);
      navigate(`/staff/estimates/${response.estimate.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create estimate");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/staff/estimates")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Create Estimate</h1>
            <p className="text-zinc-500">Draft a new repair estimate for a customer.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white border border-zinc-200 rounded-xl">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Job ID</label>
            <input 
              type="text" 
              required
              value={jobId} 
              onChange={e => setJobId(e.target.value)} 
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. job-123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Customer ID</label>
            <input 
              type="text" 
              required
              value={customerId} 
              onChange={e => setCustomerId(e.target.value)} 
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. cust-456"
            />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
            <h3 className="font-semibold text-zinc-900">Line Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          <div className="p-4 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                  <input 
                    type="text" 
                    required
                    value={item.description} 
                    onChange={e => handleChangeItem(index, 'description', e.target.value)} 
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Type</label>
                  <select 
                    value={item.type} 
                    onChange={e => handleChangeItem(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
                  >
                    <option value="part">Part</option>
                    <option value="labor">Labor</option>
                    <option value="consumable">Consumable</option>
                  </select>
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Qty</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={item.quantity} 
                    onChange={e => handleChangeItem(index, 'quantity', e.target.value)} 
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Unit Price (Fils)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={item.unitPriceFils} 
                    onChange={e => handleChangeItem(index, 'unitPriceFils', e.target.value)} 
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
                    title="Enter exact integer fils (e.g. 50000 for 500 AED)"
                  />
                </div>
                <div className="w-28 flex items-center h-9 mb-1">
                  <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={item.isMandatory} 
                      onChange={e => handleChangeItem(index, 'isMandatory', e.target.checked)} 
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    Mandatory
                  </label>
                </div>
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-red-500 mb-1">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate("/staff/estimates")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || items.length === 0}>
            {isSubmitting ? "Creating..." : "Create Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
};
