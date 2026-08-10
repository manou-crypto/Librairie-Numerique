import React from 'react';
import AppLayout from '@/components/AppLayout';
import POSTerminal from '@/components/pos/POSTerminal';

export default function CaissePage() {
  return (
    <AppLayout currentPath="/caisse">
      <POSTerminal />
    </AppLayout>
  );
}
