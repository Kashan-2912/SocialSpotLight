import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { Home, TrendingUp, Users, MousePointerClick, Clock, Eye } from "lucide-react";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const PROFILE_ID = "default-profile";

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  clicksByHour: number[];
  viewsByDay: Record<string, number>;
  clicksByDay: Record<string, number>;
}

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/profile", PROFILE_ID],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/profile/${PROFILE_ID}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      date: format(date, "MMM dd"),
      views: analytics.viewsByDay[dateStr] || 0,
      clicks: analytics.clicksByDay[dateStr] || 0,
    };
  });

  const hourlyData = analytics.clicksByHour.map((clicks, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    clicks,
  }));

  const peakHour = analytics.clicksByHour.indexOf(Math.max(...analytics.clicksByHour));
  const avgClickRate = analytics.totalViews > 0
    ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-home">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-sm text-muted-foreground">Track your link performance and visitor insights</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-views">
                {analytics.totalViews.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All time page views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-unique-visitors">
                {analytics.uniqueVisitors.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Distinct users tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-clicks">
                {analytics.totalClicks.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{avgClickRate}% click rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-peak-hour">
                {peakHour.toString().padStart(2, "0")}:00
              </div>
              <p className="text-xs text-muted-foreground">Most active time</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Views & Clicks Over Time</CardTitle>
              <CardDescription>Last 7 days of activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    className="text-xs fill-muted-foreground"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Clicks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peak Activity Times</CardTitle>
              <CardDescription>Clicks by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="hour"
                    className="text-xs fill-muted-foreground"
                    stroke="hsl(var(--muted-foreground))"
                    interval={2}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar
                    dataKey="clicks"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Clicks"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Engagement Summary
            </CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Visitor Engagement</p>
                <p className="text-3xl font-bold text-primary">{avgClickRate}%</p>
                <p className="text-xs text-muted-foreground">
                  Visitors who clicked at least one link
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Average Clicks per Visitor</p>
                <p className="text-3xl font-bold text-primary">
                  {analytics.uniqueVisitors > 0
                    ? (analytics.totalClicks / analytics.uniqueVisitors).toFixed(1)
                    : "0"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Links clicked per unique visitor
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Return Visitor Rate</p>
                <p className="text-3xl font-bold text-primary">
                  {analytics.totalViews > 0 && analytics.uniqueVisitors > 0
                    ? ((1 - analytics.uniqueVisitors / analytics.totalViews) * 100).toFixed(1)
                    : "0"}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Visitors who returned to your page
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
