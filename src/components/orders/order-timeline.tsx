
import {
    CircleUser,
    File,
    History,
    Package,
    UserCheck,
  } from "lucide-react"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
  import { formatDistanceToNow } from "date-fns";
import { subDays, subHours } from "date-fns";

const now = new Date();

  const timelineEvents = [
    { icon: Package, text: "Order created", by: "Admin", time: subDays(now, 2) },
    { icon: UserCheck, text: "Assigned to John Doe", by: "Admin", time: subDays(now, 2) },
    { icon: History, text: "Status changed to 'Assigned'", from: "New", to: "Assigned", by: "System", time: subDays(now, 2) },
    { icon: File, text: "Report.pdf uploaded", by: "John Doe", time: subDays(now, 1) },
    { icon: History, text: "Status changed to 'Completed'", from: "In Progress", to: "Completed", by: "John Doe", time: subHours(now, 3) },
  ];
  
  export function OrderTimeline() {
    return (
      <div className="pt-6">
        <ul className="space-y-4">
          {timelineEvents.map((event, index) => (
            <li key={index} className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <event.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{event.text}</p>
                <p className="text-xs text-muted-foreground">
                  by {event.by} &bull; {formatDistanceToNow(event.time, { addSuffix: true })}
                </p>
                {event.from && event.to && (
                  <p className="text-xs text-muted-foreground">
                    From: <span className="font-semibold">{event.from}</span> &rarr; To: <span className="font-semibold">{event.to}</span>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  
