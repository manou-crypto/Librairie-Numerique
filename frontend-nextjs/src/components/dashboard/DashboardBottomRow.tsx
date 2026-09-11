'use client';
import React, { useState, useEffect } from 'react';
import TopProductsTable from './TopProductsTable';
import RecentSalesFeed from './RecentSalesFeed';
import { financesService, DashboardFeedResponse } from '@/services/finances.service';
import { Loader2 } from 'lucide-react';

export default function DashboardBottomRow() {
  const [feed, setFeed] = useState<DashboardFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financesService
      .getDashboardFeed()
      .then((data) => setFeed(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <TopProductsTable products={feed?.topProducts || []} />
      </div>
      <div>
        <RecentSalesFeed sales={feed?.recentSales || []} />
      </div>
    </div>
  );
}
