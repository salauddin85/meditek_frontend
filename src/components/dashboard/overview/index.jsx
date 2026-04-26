"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, UserCheck, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total Employees",
    count: "254",
    icon: <Users className="h-5 w-5 text-primary" />,
    color: "primary",
    trend: "+4.5%",
  },
  {
    title: "Active Projects",
    count: "45",
    icon: <Briefcase className="h-5 w-5 text-success" />,
    color: "success",
    trend: "+12.1%",
  },
  {
    title: "Attendance",
    count: "92%",
    icon: <UserCheck className="h-5 w-5 text-info" />,
    color: "info",
    trend: "-1.2%",
  },
  {
    title: "Net Profit",
    count: "$54,230",
    icon: <TrendingUp className="h-5 w-5 text-warning" />,
    color: "warning",
    trend: "+8.2%",
  },
];

const Overview = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-default-900">Dashboard Overview</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => (
          <Card key={index} className="overflow-hidden border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-default-600">{item.title}</p>
                  <h3 className="mt-2 text-2xl font-bold text-default-900">{item.count}</h3>
                  <p className={`mt-1 text-xs font-medium ${item.trend.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                    {item.trend} <span className="text-default-400">vs last month</span>
                  </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${item.color}/10 shadow-sm transition-transform hover:scale-110`}>
                  {item.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle>Organization Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-default-400">
            {/* Placeholder for a chart component */}
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 opacity-20" />
              <p className="mt-2">Performance Analytics will appear here</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 border-b border-default-100 pb-3 last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-default-100 flex items-center justify-center text-xs font-bold text-default-600">JD</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-default-900">John Doe marked attendance</p>
                    <p className="text-xs text-default-500">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
