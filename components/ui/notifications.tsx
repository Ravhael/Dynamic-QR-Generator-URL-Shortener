"use client";

import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  BellIcon as BellSolidIcon
} from '@heroicons/react/24/solid';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  action?: string;
}

// Inline API client for notifications
const notificationsAPI = {
  async getNotifications() {
    const response = await fetch('/api/notifications');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async markAsRead(id: string) {
    // Updated to use consolidated read endpoint
    const response = await fetch(`/api/notifications/read`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async deleteNotification(id: string) {
    // Endpoint not yet implemented in modern API; perform optimistic local removal only
    // Optionally could call future /api/notifications/dismiss
    return Promise.resolve({ id });
  }
};

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationsAPI.getNotifications();
        // Normalize legacy vs new shape: new API returns { items: [...], meta: {...} }
        const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data?.notifications) ? data.notifications : [];
        // Map to local Notification interface (fallbacks)
        const mapped: Notification[] = arr.map((n: any) => ({
          id: n.id,
          title: n.title || n.message?.slice(0,40) || 'Notification',
          message: n.message || n.description || '',
          type: (n.type || n.category || 'info') as any,
            // Prefer createdAt / created_at / timestamp
          timestamp: n.createdAt || n.created_at || n.timestamp || new Date().toISOString(),
          read: !!(n.isRead ?? n.read ?? n.is_read),
          action: n.actionUrl || n.action_url || undefined,
        }));
        setNotifications(mapped);
      } catch (_error) {
        console.error('Error fetching notifications:', _error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => (prev || []).map(notif => notif.id === id ? { ...notif, read: true } : notif));
    } catch (_error) {
      console.error('Error marking notification as read:', _error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsAPI.deleteNotification(id);
      setNotifications(prev => (prev || []).filter(notif => notif.id !== id));
    } catch (_error) {
      console.error('Error deleting notification:', _error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const filteredNotifications = filter === 'all' 
    ? safeNotifications 
    : safeNotifications.filter(n => !n.read);

  const unreadCount = safeNotifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          {[1, 2, 3].map((i) => (
            <div key={`item-${i}`} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BellSolidIcon className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? 'All caught up! You have no unread notifications.' 
                : 'You haven\'t received any notifications yet.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white border-l-4 ${
                notification.read ? 'border-gray-200' : 'border-blue-500'
              } rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getIcon(notification.type)}
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      notification.read ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h3>
                    <p className={`mt-1 text-sm ${
                      notification.read ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Mark as read"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete notification"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
