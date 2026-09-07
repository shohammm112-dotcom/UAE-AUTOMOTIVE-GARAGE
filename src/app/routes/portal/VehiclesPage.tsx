import React, { useState } from "react";
import { useApi } from "@/lib/api/hooks";
import type { VehicleResponseDto } from "@/application/dto/AppDtos";
import { ApiClient } from "@/lib/api/client";
import { Car, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const VehiclesPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useApi<{ vehicles: VehicleResponseDto[] }>("/vehicles");
  const vehicles = data?.vehicles || [];
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAddError("");
    const formData = new FormData(e.currentTarget);
    const payload = {
      make: formData.get("make"),
      model: formData.get("model"),
      year: formData.get("year"),
      vin: formData.get("vin"),
      plateCode: formData.get("plateCode"),
      plateNumber: formData.get("plateNumber"),
      emirate: formData.get("emirate"),
    };

    try {
      await ApiClient.post("/vehicles", payload);
      setIsAdding(false);
      refetch();
    } catch (err: any) {
      setAddError(err.message || "Failed to add vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">My Vehicles</h1>
          <p className="text-zinc-500">Manage your registered vehicles.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3" />
          Failed to load vehicles. {error.message}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Add New Vehicle</h2>
          {addError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {addError}
            </div>
          )}
          <form onSubmit={handleAddVehicle} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input id="make" name="make" placeholder="Toyota" required disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" placeholder="Camry" required disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input id="year" name="year" type="number" placeholder="2022" required disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emirate">Emirate</Label>
                <select id="emirate" name="emirate" className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50" required disabled={isSubmitting}>
                  <option value="Dubai">Dubai</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Sharjah">Sharjah</option>
                  <option value="Ajman">Ajman</option>
                  <option value="Umm Al Quwain">Umm Al Quwain</option>
                  <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                  <option value="Fujairah">Fujairah</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateCode">Plate Code</Label>
                <Input id="plateCode" name="plateCode" placeholder="A" required disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Plate Number</Label>
                <Input id="plateNumber" name="plateNumber" type="number" placeholder="12345" required disabled={isSubmitting} />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="vin">VIN (17 Characters)</Label>
                <Input id="vin" name="vin" placeholder="1HGCM82633A004..." required disabled={isSubmitting} />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Vehicle
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-zinc-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-zinc-200 shadow-sm">
                    <Car className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{v.year} {v.make}</h3>
                    <p className="text-sm text-zinc-500">{v.model}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Plate</p>
                    <p className="font-medium">{v.plate.displayString}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Mileage</p>
                    <p className="font-medium">{v.odometerReadingKm?.toLocaleString() ?? 0} km</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">VIN</p>
                    <p className="font-medium text-xs font-mono bg-zinc-100 p-2 rounded">{v.vin}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
            <Car className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 mb-2">No vehicles found</h3>
            <p className="text-zinc-500 max-w-md mx-auto mb-6">
              You haven't added any vehicles to your account yet. Add your first vehicle to book appointments and track service history.
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        )
      )}
    </div>
  );
};
