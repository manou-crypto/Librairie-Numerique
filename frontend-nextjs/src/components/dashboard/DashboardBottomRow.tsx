import React from 'react';
import TopProductsTable from './TopProductsTable';
import RecentSalesFeed from './RecentSalesFeed';

export default function DashboardBottomRow() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      <div className="lg:col-span-2"><TopProductsTable /></div>
      <div><RecentSalesFeed /></div>
    </div>
  );
}
