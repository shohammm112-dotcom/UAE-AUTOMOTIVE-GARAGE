import React, { useState, useEffect } from "react";
import { useApi } from "@/lib/api/hooks";
import { ApiClient } from "@/lib/api/client";
import { User, AlertCircle, CheckCircle2, Save, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProfilePage: React.FC = () => {
  const { data, isLoading, error, refetch } = useApi<{ profile: any }>("/customers/profile");
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    emirate: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (data?.profile) {
      setFormData({
        fullName: data.profile.fullName || "",
        phone: data.profile.phone || "",
        emirate: data.profile.emirate || ""
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setSubmitError("");
      setSubmitSuccess(false);
      
      await ApiClient.patch("/customers/profile", formData);
      
      setSubmitSuccess(true);
      setIsEditing(false);
      refetch();
      
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-zinc-100 rounded w-1/4"></div>
        <div className="h-64 bg-zinc-100 rounded-xl"></div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center">
        <AlertCircle className="w-5 h-5 mr-3" />
        Failed to load profile.
      </div>
    );
  }

  const profile = data.profile;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">My Profile</h1>
        <p className="text-zinc-500">Manage your personal information and contact preferences.</p>
      </div>

      {submitSuccess && (
        <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-3" />
          Profile updated successfully.
        </div>
      )}

      {submitError && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3" />
          {submitError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Personal Information</h2>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 block">Email Address (Read-only)</label>
              <input 
                type="text" 
                value={profile.email} 
                disabled 
                className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-md text-zinc-500 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500">Your email is managed by your authentication provider.</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-zinc-700 block">Full Name</label>
              <input 
                id="fullName"
                type="text" 
                value={formData.fullName} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-zinc-700 block">Phone Number</label>
              <input 
                id="phone"
                type="tel" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+971 50 123 4567"
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="emirate" className="text-sm font-medium text-zinc-700 block">Emirate</label>
              <select
                id="emirate"
                value={formData.emirate}
                onChange={(e) => setFormData({...formData, emirate: e.target.value})}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-white"
              >
                <option value="">Select an Emirate...</option>
                <option value="Dubai">Dubai</option>
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Sharjah">Sharjah</option>
                <option value="Ajman">Ajman</option>
                <option value="Fujairah">Fujairah</option>
                <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                <option value="Umm Al Quwain">Umm Al Quwain</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-100">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Full Name</p>
                <p className="font-semibold text-zinc-900">{profile.fullName || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Email Address</p>
                <p className="font-semibold text-zinc-900">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Phone Number</p>
                <p className="font-semibold text-zinc-900">{profile.phone || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Emirate</p>
                <p className="font-semibold text-zinc-900">{profile.emirate || "Not provided"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
