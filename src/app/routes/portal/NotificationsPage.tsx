import React from "react";
import { useApi } from "@/lib/api/hooks";
import { ApiClient } from "@/lib/api/client";
import { Bell, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NotificationsPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useApi<{ notifications: any[] }>("/notifications");

  const markAsRead = async (id: string) => {
    try {
      await ApiClient.post(`/notifications/${id}/read`);
      refetch();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-white p-4 rounded-xl border border-zinc-200 h-24"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
        <AlertCircle className="w-5 h-5 mr-3" />
        Failed to load notifications: {error.message}
      </div>
    );
  }

  const notifications = data?.notifications || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Notifications</h1>
        <p className="text-zinc-500">Stay updated on your vehicle service and appointments.</p>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
          <Bell className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">You're all caught up!</h3>
          <p className="text-zinc-500 max-w-md mx-auto">
            Important updates about your vehicles, active jobs, and appointments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-5 rounded-xl border transition-colors ${notification.read ? 'bg-white border-zinc-200' : 'bg-blue-50/50 border-blue-200'}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!notification.read && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                    <h3 className={`font-semibold ${notification.read ? 'text-zinc-900' : 'text-blue-900'}`}>
                      {notification.title}
                    </h3>
                  </div>
                  <p className="text-zinc-600 mb-3">{notification.body}</p>
                  <div className="flex items-center text-xs text-zinc-500">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {new Date(notification.createdAt).toLocaleString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                {!notification.read && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => markAsRead(notification.id)}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
