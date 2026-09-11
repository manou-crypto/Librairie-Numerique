'use client';
import React from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import DashboardBentoGrid from '@/components/dashboard/DashboardBentoGrid';
import DashboardChartsRow from '@/components/dashboard/DashboardChartsRow';
import DashboardBottomRow from '@/components/dashboard/DashboardBottomRow';
import DashboardStockAlerts from '@/components/dashboard/DashboardStockAlerts';
import DashboardAchatAlerts from '@/components/dashboard/DashboardAchatAlerts';

export default function AdminDashboardPage() {
  return (
    <AppLayout currentPath="/dashboard">
      <Topbar title="Tableau de bord" subtitle="" />
      <div className="px-6 xl:px-8 2xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        <DashboardBentoGrid />
        <DashboardChartsRow />
        <DashboardBottomRow />
        <DashboardStockAlerts />
        <DashboardAchatAlerts />
      </div>
    </AppLayout>
  );
}
