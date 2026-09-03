'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, Barcode, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, FileText, X, CheckCircle, Loader2, AlertTriangle, LogOut } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';
import { produitsService } from '@/services/produits.service';
import { ventesService } from '@/services/ventes.service';
import { caissesService } from '@/services/caisses.service';
import { useAppConfig } from '@/contexts/ConfigContext';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

interface Product {
  id: string;
  name: string;
  category: string;
  prixVente: number;
  prixAchat: number;
  stock: number;
  reference: string;
  tva: number;
}

interface CartItem extends Product {
  qty: number;
}

const categories = ['Tous', 'Livres', 'Fournitures', 'Informatique', 'Bureautique'];

export default function POSTerminal() {
  const { config } = useAppConfig();
  const { lastStockUpdate } = useSocket();
  const { logout } = useAuth();
  const devise = config?.devise || 'FCFA';
  const tauxTva = config?.tva ?? 0;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<{ id: string; referenceTicket: string; total: number; mode: string; items: { name: string; qty: number; price: number; total: number }[] } | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'open' | 'closed' | 'no-caisse' | 'error'>('loading');
  const [assignedCaisse, setAssignedCaisse] = useState<any | null>(null);
  const [fondInitial, setFondInitial] = useState('5000');
  const [openingSession, setOpeningSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Charger les produits depuis l'API
  const loadProducts = useCallback(async () => {
    try {
      const res = await produitsService.getAll();
      const mappedProducts: Product[] = res.data.map((p: any) => ({
        id: p.id,
        name: p.libelle,
        category: p.categoryName || 'Autres',
        prixVente: p.prixVente,
        prixAchat: p.prixAchat || 0,
        stock: p.stock ?? 0,
        reference: p.reference,
        tva: p.tauxTva ?? tauxTva,
      }));
      setAllProducts(mappedProducts);
    } catch (err) {
      toast.error('Erreur lors du chargement des produits');
    }
  }, [tauxTva]);

  // Charger la session de caisse active et vérifier la caisse assignée
  const loadSession = useCallback(async () => {
    try {
      // 1. Récupérer la caisse assignée
      const caisse = await caissesService.getMyCaisse();
      if (!caisse) {
        setSessionStatus('no-caisse');
        return;
      }
      setAssignedCaisse(caisse);

      // 2. Récupérer la session active
      const session = await caissesService.getActiveSession();
      if (session) {
        setActiveSessionId(String(session.id));
        setSessionStatus('open');
      } else {
        setSessionStatus('closed');
      }
    } catch (err) {
      setSessionStatus('error');
      toast.error('Erreur lors du chargement de la session de caisse');
    }
  }, []);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedCaisse) return;
    setOpeningSession(true);
    try {
      const session = await caissesService.ouvrirSession(assignedCaisse.id, Number(fondInitial) || 0);
      setActiveSessionId(String(session.id));
      setSessionStatus('open');
      toast.success(`Caisse ouverte avec un fond initial de ${Number(fondInitial).toLocaleString('fr-FR')} ${devise}`);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ouverture de la caisse");
    } finally {
      setOpeningSession(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSession();
  }, [loadProducts, loadSession]);

  // Mise à jour du stock en temps réel via WebSocket
  useEffect(() => {
    if (!lastStockUpdate) return;
    setAllProducts(prev => prev.map(p => {
      if (p.id === lastStockUpdate.produitId) {
        return { ...p, stock: lastStockUpdate.nouvelleQuantite };
      }
      return p;
    }));
    // Alerte si un produit du panier devient indisponible
    setCart(prev => prev.map(item => {
      if (item.id === lastStockUpdate.produitId && item.qty > lastStockUpdate.nouvelleQuantite) {
        toast.warning(`Stock insuffisant pour "${item.name}". Stock restant : ${lastStockUpdate.nouvelleQuantite}`);
        return { ...item, stock: lastStockUpdate.nouvelleQuantite };
      }
      return item;
    }));
  }, [lastStockUpdate]);

  const filteredProducts = allProducts.filter(p => {
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'Tous' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const addToCart = (product: Product) => {
    if (product.stock === 0) { toast.error(`"${product.name}" est en rupture de stock.`); return; }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.warning(`Stock insuffisant — seulement ${product.stock} disponible(s).`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = i.qty + delta;
      if (newQty > i.stock) {
        toast.warning(`Stock insuffisant — seulement ${i.stock} disponible(s).`);
        return i;
      }
      return { ...i, qty: newQty };
    }).filter(i => i.qty > 0));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => { setCart([]); toast.info('Panier vidé.'); };

  // Calculs du panier avec TVA globale
  const sousTotalHt = cart.reduce((s, i) => s + i.prixVente * i.qty, 0);
  const totalTva = cart.reduce((s, i) => {
    const tva = i.tva ?? tauxTva;
    return s + (i.prixVente * i.qty * tva / 100);
  }, 0);
  const totalTtc = sousTotalHt + totalTva;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  /**
   * Traitement du paiement — Appel réel à l'API backend.
   * Cette fonction est appelée depuis PaymentModal après confirmation.
   */
  const handlePaymentSuccess = async (mode: string, montantRecu: number) => {
    if (cart.length === 0) return;
    setIsSaving(true);

    try {
      const payload = {
        sessionId: activeSessionId,
        lignes: cart.map(item => {
          const tva = item.tva ?? tauxTva;
          return {
            produitId: item.id,
            quantite: item.qty,
            prixAchatUnitaireSnapshot: item.prixAchat,
            prixVenteUnitaireHtSnapshot: item.prixVente,
            tauxTvaSnapshot: tva,
            margeUnitaire: item.prixVente - item.prixAchat,
            totalLigneHt: item.prixVente * item.qty,
          };
        }),
        paiements: [{
          modePaiement: mode === 'especes' ? 'ESPECES'
            : mode === 'carte' ? 'CARTE_BANCAIRE'
            : 'CHEQUE',
          montant: totalTtc,
          referenceTransaction: undefined,
        }],
      };

      const result = await ventesService.createVente(payload as any);

      setLastSaleData({
        id: result.id,
        referenceTicket: result.referenceTicket,
        total: result.totalTtc,
        mode,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.prixVente, total: i.prixVente * i.qty })),
      });
      setCart([]);
      setPaymentOpen(false);
      setReceiptOpen(true);

      // Rafraîchir les stocks après vente réussie
      await loadProducts();

      toast.success(`✅ Vente ${result.referenceTicket} enregistrée — ${result.totalTtc.toLocaleString('fr-FR')} ${devise}`);
    } catch (err: any) {
      toast.error(`Erreur : ${err.message || 'Impossible d\'enregistrer la vente'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-950 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-semibold text-slate-400">Chargement de la session de caisse...</p>
      </div>
    );
  }

  if (sessionStatus === 'no-caisse') {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-slate-950 px-4">
        <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="text-amber-500" size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Accès Restreint</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Aucune caisse ne vous est assignée dans le système. Vous devez avoir une caisse configurée par un administrateur pour accéder à cette interface.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={logout}
              className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-semibold text-sm rounded-xl border border-red-500/30 shadow-lg shadow-red-600/15 transition-all duration-150 flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'closed') {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-slate-950 px-4">
        <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-2">
              <CreditCard className="text-primary" size={32} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Ouverture de caisse</h1>
            <p className="text-sm text-slate-400">
              Caisse assignée : <strong className="text-white">{assignedCaisse?.codeCaisse}</strong>
              {assignedCaisse?.emplacement && <span className="block text-xs mt-0.5">({assignedCaisse.emplacement})</span>}
            </p>
          </div>

          <form onSubmit={handleOpenSession} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Fond de caisse initial ({devise})</label>
              <input
                type="number"
                placeholder="ex: 5000"
                value={fondInitial}
                onChange={(e) => setFondInitial(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                required
                autoFocus
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={openingSession}
                className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary/15 transition-all duration-150 flex items-center justify-center gap-2"
              >
                {openingSession ? (
                  <><Loader2 className="animate-spin" size={16} /> Ouverture en cours...</>
                ) : (
                  <><CheckCircle size={16} /> Ouvrir la caisse</>
                )}
              </button>
              
              <button
                type="button"
                onClick={logout}
                className="w-full py-3 bg-transparent hover:bg-slate-900 text-slate-400 hover:text-white font-semibold text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Se déconnecter
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-0px)] overflow-hidden">
      {/* ─── Zone Produits ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* Topbar POS */}
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <Barcode size={16} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Scanner</span>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit ou référence..."
                className="input-field pl-9 text-sm"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sessionStatus === 'open' && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200">
                <CheckCircle size={12} />
                <span className="font-semibold">Session ouverte</span>
              </div>
            )}
            {sessionStatus === 'closed' && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                <AlertTriangle size={12} />
                <span className="font-semibold">Aucune session</span>
              </div>
            )}
          </div>
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-2 px-4 py-3 border-b border-border bg-card shrink-0 overflow-x-auto scrollbar-thin">
          {categories.map(cat => (
            <button
              key={`cat-filter-${cat}`}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              {cat}
              {cat !== 'Tous' && (
                <span className="ml-1.5 opacity-70">
                  ({allProducts.filter(p => p.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grille produits */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={32} className="text-muted-foreground mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">Aucun produit trouvé</p>
              <p className="text-xs text-muted-foreground">Essayez un autre terme de recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => {
                const inCart = cart.find(i => i.id === product.id);
                const outOfStock = product.stock === 0;
                const lowStock = product.stock > 0 && product.stock < 10;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    className={`card-base p-3.5 text-left transition-all duration-150 active:scale-95 ${
                      outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-elevated hover:border-primary/30 cursor-pointer'
                    } ${inCart ? 'border-primary/40 bg-primary/5' : ''}`}
                  >
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-muted to-border/50 flex items-center justify-center mb-3 relative">
                      <span className="text-2xl">
                        {product.category === 'Livres' ? '📚' : product.category === 'Informatique' ? '💻' : product.category === 'Bureautique' ? '🗂️' : '✏️'}
                      </span>
                      {inCart && (
                        <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {inCart.qty}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-tight mb-1 line-clamp-2">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">{product.reference}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {product.prixVente.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}
                      </span>
                      {outOfStock
                        ? <Badge variant="rupture">Rupture</Badge>
                        : lowStock
                          ? <Badge variant="alert">Stock: {product.stock}</Badge>
                          : <span className="text-[10px] text-muted-foreground">{product.stock} en stock</span>
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Zone Panier ──────────────────────────────────────── */}
      <div className="w-full lg:w-[420px] xl:w-[440px] 2xl:w-[460px] flex flex-col bg-card border-l border-border shrink-0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Panier de vente</h2>
            {totalItems > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {totalItems}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-negative flex items-center gap-1 transition-colors">
              <Trash2 size={13} /> Vider
            </button>
          )}
        </div>

        {/* Lignes du panier */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <ShoppingCart size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Panier vide</p>
              <p className="text-xs text-muted-foreground">Cliquez sur un produit pour l&apos;ajouter.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cart.map(item => (
                <div key={item.id} className="px-5 py-3 hover:bg-muted/30 transition-colors fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-sm">
                      {item.category === 'Livres' ? '📚' : item.category === 'Informatique' ? '💻' : item.category === 'Bureautique' ? '🗂️' : '✏️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.reference}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-muted hover:bg-border flex items-center justify-center transition-colors" aria-label="Diminuer quantité">
                            <Minus size={11} />
                          </button>
                          <span className="text-xs font-bold tabular-nums w-6 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-muted hover:bg-border flex items-center justify-center transition-colors" aria-label="Augmenter quantité">
                            <Plus size={11} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold tabular-nums text-foreground">
                            {(item.prixVente * item.qty).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}
                          </span>
                          <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-negative transition-colors" aria-label={`Supprimer ${item.name}`}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totaux & Bouton encaisser */}
        <div className="border-t border-border px-5 py-4 bg-card shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sous-total HT ({totalItems} article{totalItems > 1 ? 's' : ''})</span>
              <span className="tabular-nums font-medium text-foreground">
                {sousTotalHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>TVA ({tauxTva}%)</span>
              <span className="tabular-nums font-medium text-foreground">
                {totalTva.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-base font-bold text-foreground">
              <span>Total TTC</span>
              <span className="tabular-nums text-primary text-xl">
                {totalTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}
              </span>
            </div>
          </div>

          {/* Modes de paiement rapides */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { id: 'pay-especes', label: 'Espèces', icon: Banknote },
              { id: 'pay-carte', label: 'Carte', icon: CreditCard },
              { id: 'pay-cheque', label: 'Chèque', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  if (cart.length === 0) { toast.error('Ajoutez des produits avant de payer.'); return; }
                  setPaymentOpen(true);
                }}
                disabled={cart.length === 0}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <Icon size={18} className="text-primary" />
                <span className="text-[10px] font-semibold text-foreground">{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (cart.length === 0) { toast.error('Le panier est vide.'); return; }
              setPaymentOpen(true);
            }}
            disabled={cart.length === 0 || isSaving}
            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <><Loader2 size={16} className="animate-spin" /> Enregistrement...</>
            ) : (
              <><CreditCard size={16} /> Encaisser — {totalTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}</>
            )}
          </button>
        </div>
      </div>

      {/* Modales */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={totalTtc}
        devise={devise}
        onSuccess={handlePaymentSuccess}
        isLoading={isSaving}
      />
      {lastSaleData && (
        <ReceiptModal
          open={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          saleId={lastSaleData.id}
          referenceTicket={lastSaleData.referenceTicket}
          total={lastSaleData.total}
          mode={lastSaleData.mode}
          items={lastSaleData.items}
          caisse={assignedCaisse?.codeCaisse || 'Caisse'}
          devise={devise}
        />
      )}
    </div>
  );
}
