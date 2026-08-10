'use client';
import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Search, Barcode, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, FileText, X, CheckCircle,   } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';
import Icon from '@/components/ui/AppIcon';

interface Product {
  id: string;
  name: string;
  category: string;
  prixVente: number;
  stock: number;
  reference: string;
}

interface CartItem extends Product {
  qty: number;
}

const allProducts: Product[] = [];

const categories = ['Tous', 'Livres', 'Fournitures', 'Informatique', 'Bureautique'];

export default function POSTerminal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; total: number; mode: string } | null>(null);
  const [selectedCaisse, setSelectedCaisse] = useState('Caisse 1');
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredProducts = allProducts.filter((p) => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'Tous' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const addToCart = (product: Product) => {
    if (product.stock === 0) { toast.error(`${product.name} est en rupture de stock.`); return; }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) { toast.warning(`Stock insuffisant — seulement ${product.stock} disponibles.`); return prev; }
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const newQty = i.qty + delta;
      if (newQty > i.stock) { toast.warning(`Stock insuffisant — seulement ${i.stock} disponibles.`); return i; }
      return { ...i, qty: newQty };
    }).filter((i) => i.qty > 0));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => { setCart([]); toast.info('Panier vidé.'); };

  const total = cart.reduce((s, i) => s + i.prixVente * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const handlePaymentSuccess = (mode: string) => {
    const saleId = `VTE-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    setLastSale({ id: saleId, total, mode });
    setCart([]);
    setPaymentOpen(false);
    setReceiptOpen(true);
    toast.success(`Vente ${saleId} enregistrée — ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-0px)] overflow-hidden">
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"><Barcode size={16} className="text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Scanner</span></div>
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un produit ou référence..." className="input-field pl-9 text-sm" autoFocus />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedCaisse} onChange={(e) => setSelectedCaisse(e.target.value)} className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option>Caisse 1</option><option>Caisse 2</option><option>Caisse 3</option>
            </select>
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200"><CheckCircle size={12} /><span className="font-semibold">Ouverte</span></div>
          </div>
        </div>
        <div className="flex gap-2 px-4 py-3 border-b border-border bg-card shrink-0 overflow-x-auto scrollbar-thin">
          {categories.map((cat) => (
            <button key={`cat-filter-${cat}`} onClick={() => setSelectedCategory(cat)} className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
              {cat}{cat !== 'Tous' && <span className="ml-1.5 opacity-70">({allProducts.filter((p) => p.category === cat).length})</span>}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><Search size={32} className="text-muted-foreground mb-3" /><p className="text-sm font-semibold text-foreground mb-1">Aucun produit trouvé</p><p className="text-xs text-muted-foreground">Essayez un autre terme de recherche ou vérifiez la référence.</p></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.id === product.id);
                const outOfStock = product.stock === 0;
                const lowStock = product.stock > 0 && product.stock < 10;
                return (
                  <button key={product.id} onClick={() => addToCart(product)} disabled={outOfStock} className={`card-base p-3.5 text-left transition-all duration-150 active:scale-95 ${outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-elevated hover:border-primary/30 cursor-pointer'} ${inCart ? 'border-primary/40 bg-primary/5' : ''}`}>
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-muted to-border/50 flex items-center justify-center mb-3 relative">
                      <span className="text-2xl">{product.category === 'Livres' ? '📚' : product.category === 'Informatique' ? '💻' : product.category === 'Bureautique' ? '🗂️' : '✏️'}</span>
                      {inCart && <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{inCart.qty}</span>}
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-tight mb-1 line-clamp-2">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">{product.reference}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary tabular-nums">{product.prixVente.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                      {outOfStock ? <Badge variant="rupture">Rupture</Badge> : lowStock ? <Badge variant="alert">Stock: {product.stock}</Badge> : <span className="text-[10px] text-muted-foreground">{product.stock} en stock</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-[420px] xl:w-[440px] 2xl:w-[460px] flex flex-col bg-card border-l border-border shrink-0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Panier de vente</h2>
            {totalItems > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{totalItems}</span>}
          </div>
          {cart.length > 0 && <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-negative flex items-center gap-1 transition-colors"><Trash2 size={13} />Vider</button>}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3"><ShoppingCart size={24} className="text-muted-foreground" /></div>
              <p className="text-sm font-semibold text-foreground mb-1">Panier vide</p>
              <p className="text-xs text-muted-foreground">Cliquez sur un produit ou scannez un code-barres pour l&apos;ajouter.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cart.map((item) => (
                <div key={item.id} className="px-5 py-3 hover:bg-muted/30 transition-colors fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-sm">{item.category === 'Livres' ? '📚' : item.category === 'Informatique' ? '💻' : item.category === 'Bureautique' ? '🗂️' : '✏️'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.reference}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-muted hover:bg-border flex items-center justify-center transition-colors" aria-label="Diminuer quantité"><Minus size={11} /></button>
                          <span className="text-xs font-bold tabular-nums w-6 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-muted hover:bg-border flex items-center justify-center transition-colors" aria-label="Augmenter quantité"><Plus size={11} /></button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold tabular-nums text-foreground">{(item.prixVente * item.qty).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                          <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-negative transition-colors" aria-label={`Supprimer ${item.name} du panier`}><X size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-border px-5 py-4 bg-card shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Sous-total ({totalItems} article{totalItems > 1 ? 's' : ''})</span><span className="tabular-nums font-medium text-foreground">{total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span></div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>TVA (20%)</span><span className="tabular-nums font-medium text-foreground">{(total * 0.2).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span></div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-base font-bold text-foreground"><span>Total TTC</span><span className="tabular-nums text-primary text-xl">{(total * 1.2).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span></div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[{ id: 'pay-especes', label: 'Espèces', icon: Banknote }, { id: 'pay-carte', label: 'Carte', icon: CreditCard }, { id: 'pay-cheque', label: 'Chèque', icon: FileText }].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { if (cart.length === 0) { toast.error('Ajoutez des produits au panier avant de procéder au paiement.'); return; } setPaymentOpen(true); }} disabled={cart.length === 0} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                <Icon size={18} className="text-primary" />
                <span className="text-[10px] font-semibold text-foreground">{label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => { if (cart.length === 0) { toast.error('Le panier est vide. Ajoutez des produits pour procéder.'); return; } setPaymentOpen(true); }} disabled={cart.length === 0} className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
            <CreditCard size={16} />Encaisser — {(total * 1.2).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </button>
        </div>
      </div>

      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} total={total * 1.2} onSuccess={handlePaymentSuccess} />
      {lastSale && <ReceiptModal open={receiptOpen} onClose={() => setReceiptOpen(false)} saleId={lastSale.id} total={lastSale.total} mode={lastSale.mode} caisse={selectedCaisse} />}
    </div>
  );
}
