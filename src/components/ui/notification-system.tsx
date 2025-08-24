import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityItem, useRealtimeActivity } from '@/hooks/useRealtimeActivity';

interface NotificationSystemProps {
  className?: string;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ className }) => {
  const { activities, loading } = useRealtimeActivity();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState<string>(
    localStorage.getItem('lastNotificationRead') || new Date().toISOString()
  );

  // Calculate unread notifications
  useEffect(() => {
    const unread = activities.filter(activity => 
      new Date(activity.created_at) > new Date(lastReadTime)
    ).length;
    setUnreadCount(unread);
  }, [activities, lastReadTime]);

  const markAsRead = () => {
    const now = new Date().toISOString();
    setLastReadTime(now);
    localStorage.setItem('lastNotificationRead', now);
    setUnreadCount(0);
  };

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  const getStatusIcon = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return 'ℹ';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative p-2 ${className}`}
          onClick={markAsRead}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        side="bottom"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Recent Activity
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading activities...
                </div>
              ) : activities.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-1">
                  {activities.map((activity, index) => {
                    const isUnread = new Date(activity.created_at) > new Date(lastReadTime);
                    
                    return (
                      <div 
                        key={activity.id} 
                        className={`p-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors ${
                          isUnread ? 'bg-accent/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-1 text-xs ${getStatusColor(activity.status)}`}>
                            {getStatusIcon(activity.status)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-tight">
                              {activity.action}
                              {isUnread && (
                                <span className="ml-1 inline-block w-2 h-2 bg-primary rounded-full"></span>
                              )}
                            </p>
                            {activity.details && (
                              <p className="text-xs text-muted-foreground">
                                {activity.details}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};