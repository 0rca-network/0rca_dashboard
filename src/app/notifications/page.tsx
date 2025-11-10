import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

export default function NotificationsPage() {
  // Mock notifications data
  const notifications = [
    {
      id: '1',
      type: 'success',
      title: 'Execution Completed',
      message: 'Your data analysis task has been completed successfully.',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      type: 'warning',
      title: 'Budget Alert',
      message: 'You have used 85% of your monthly budget limit.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      id: '3',
      type: 'info',
      title: 'New Agent Available',
      message: 'A new NLP agent "Advanced Text Analyzer" is now available in the marketplace.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true
    },
    {
      id: '4',
      type: 'error',
      title: 'Execution Failed',
      message: 'Your image processing task failed due to insufficient funds.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true
    },
    {
      id: '5',
      type: 'success',
      title: 'Payment Received',
      message: 'Your agent "Data Processor" earned $12.45 from recent executions.',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      read: true
    },
    {
      id: '6',
      type: 'info',
      title: 'Weekly Summary',
      message: 'Your weekly activity summary is ready. You completed 15 executions this week.',
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      read: true
    }
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <X className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-[#64f2d1]" />
    }
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your agent activities and system alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {unreadCount} unread
          </Badge>
          <Button variant="outline" size="sm">
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Notification Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-[#64f2d1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type === 'warning' || n.type === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground">Warnings & errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type === 'success').length}
            </div>
            <p className="text-xs text-muted-foreground">Completed tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Recent Notifications
          </CardTitle>
          <CardDescription>Your latest system notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-4 p-4 rounded-lg border ${
                  !notification.read ? 'bg-[#64f2d1]/10 border-[#64f2d1]/30' : 'bg-background'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{notification.title}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getBadgeVariant(notification.type)}>
                        {notification.type}
                      </Badge>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-[#64f2d1] rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                    <div className="flex space-x-2">
                      {!notification.read && (
                        <Button variant="ghost" size="sm">
                          Mark Read
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                You'll see execution updates, alerts, and system notifications here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Quick access to manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Manage Preferences</h4>
              <p className="text-sm text-muted-foreground">
                Control what notifications you receive and how you receive them
              </p>
            </div>
            <Button variant="outline">
              Go to Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}