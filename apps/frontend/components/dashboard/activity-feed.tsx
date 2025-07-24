import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, FolderPlus, RefreshCw, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityItem } from "@/lib/types/dashboard";

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "submission":
      return <Upload className="h-4 w-4" />;
    case "project_created":
      return <FolderPlus className="h-4 w-4" />;
    case "project_updated":
      return <RefreshCw className="h-4 w-4" />;
    case "deliverable_created":
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getStatusBadge(status?: string) {
  if (!status) return null;

  switch (status.toUpperCase()) {
    case "ACCEPTED":
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Acceptée
        </Badge>
      );
    case "PENDING":
      return <Badge variant="secondary">En attente</Badge>;
    case "LATE":
      return <Badge variant="destructive">En retard</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Aucune activité récente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>                
                  {activity.projectName && (
                    <p className="text-xs text-muted-foreground mt-1">Projet: {activity.projectName}</p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.date), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                  {getStatusBadge(activity.status)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
