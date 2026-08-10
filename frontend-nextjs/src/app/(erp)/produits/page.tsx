import React from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import ProductManagementClient from './components/ProductManagementClient';

export default function ProductCatalogueManagementPage() {
  return (
    <AppLayout currentPath="/produits">
      <Topbar
        title="Produits & Catalogue"
        subtitle="Gestion des produits, catégories et tarifs"
      />
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <ProductManagementClient />
      </div>
    </AppLayout>
  );
}
