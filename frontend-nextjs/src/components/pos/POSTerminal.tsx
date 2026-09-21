'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  FileText,
  X,
  CheckCircle,
  Loader2,
  AlertTriangle,
  LogOut,
  BarChart3,
  Smartphone,
  Save,
  Clock,
  Archive,
} from 'lucide-react';

import Badge from '@/components/ui/Badge';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';
import KitComposerModal, { KitProductItem, KitCompositionItem } from './KitComposerModal';
import RapportCaisseModal from './RapportCaisseModal';
import { produitsService, ConditionnementItem } from '@/services/produits.service';
import { ventesService, ModeleKit } from '@/services/ventes.service';
import { caissesService } from '@/services/caisses.service';
import { unitesService, UniteItem } from '@/services/unites.service';
import { useAppConfig } from '@/contexts/ConfigContext';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';
import { Package, Sparkles, Layers } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  prixVente: number;
  prixAchat: number;
  stock: number;
  reference: string;
  tva: number;
  tarifs?: { typeVenteId: string; libelle: string; prix: number }[];
}

interface CartItem extends Product {
  cartItemId: string;
  qty: number;
  nomKit?: string;
  idKitGroupe?: string;
  prixForfaitaireKit?: number;
  selectedUnitId?: number | null;
  selectedUnitMultiple?: number;
}

const categories = ['Tous', 'Kits & Bundles', 'Livres', 'Fournitures', 'Informatique', 'Bureautique'];

export default function POSTerminal() {
  const { config } = useAppConfig();
  const { lastStockUpdate } = useSocket();
  const { user, logout } = useAuth();
  const devise = config?.devise || 'FCFA';
  const tauxTva = config?.tva ?? 0;

  const hasCloturerPerm = user?.role === 'ADMIN' || user?.permissions?.includes('CLOTURER_CAISSE');

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allUnites, setAllUnites] = useState<UniteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [typesVente, setTypesVente] = useState<{ id: string; libelle: string }[]>([]);
  const [selectedTypeVente, setSelectedTypeVente] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [kitModalOpen, setKitModalOpen] = useState(false);
  const [rapportModalOpen, setRapportModalOpen] = useState(false);
  const [rapportMode, setRapportMode] = useState<'details' | 'cloture'>('cloture');
  const [savedKits, setSavedKits] = useState<ModeleKit[]>([]);
  const [loadingKits, setLoadingKits] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<{
    id: string;
    referenceTicket: string;
    total: number;
    mode: string;
    items: { name: string; qty: number; price: number; total: number; nomKit?: string }[];
  } | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    'loading' | 'open' | 'closed' | 'no-caisse' | 'error'
  >('loading');
  const [assignedCaisse, setAssignedCaisse] = useState<any | null>(null);
  const [fondInitial, setFondInitial] = useState('5000');
  const [openingSession, setOpeningSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Brouillons
  const [draftsModalOpen, setDraftsModalOpen] = useState(false);
  const [drafts, setDrafts] = useState<{ id: string, name: string, date: string, cart: CartItem[] }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('pos_cart_drafts');
    if (saved) {
      try { setDrafts(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

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
        tarifs: p.tarifs || [],
        conditionnements: p.conditionnements || [],
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

  const loadTypesVente = useCallback(async () => {
    try {
      const res = await produitsService.getTypesVente();
      setTypesVente(res);
      if (res.length > 0) {
        const detail = res.find((t) => t.libelle.toLowerCase().includes('détail') || t.libelle.toLowerCase().includes('detail'));
        setSelectedTypeVente(detail ? detail.id : res[0].id);
      }
    } catch (err) {}
  }, []);

  const loadUnites = useCallback(async () => {
    try {
      const res = await unitesService.getUnites();
      setAllUnites(res || []);
    } catch (err) {}
  }, []);

  const handleClotureSuccess = () => {
    setRapportModalOpen(false);
    setSessionStatus('closed');
    setActiveSessionId(null);
  };

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedCaisse) return;
    setOpeningSession(true);
    try {
      const session = await caissesService.ouvrirSession(
        assignedCaisse.id,
        Number(fondInitial) || 0
      );
      setActiveSessionId(String(session.id));
      setSessionStatus('open');
      toast.success(
        `Caisse ouverte avec un fond initial de ${Number(fondInitial).toLocaleString('fr-FR')} ${devise}`
      );
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ouverture de la caisse");
    } finally {
      setOpeningSession(false);
    }
  };

  const loadSavedKits = useCallback(async () => {
    try {
      setLoadingKits(true);
      const res = await ventesService.getKits();
      setSavedKits(res || []);
    } catch (err) {
      // Ignorer silencieusement
    } finally {
      setLoadingKits(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadSession();
    loadSavedKits();
    loadTypesVente();
    loadUnites();
  }, [loadProducts, loadSession, loadSavedKits, loadTypesVente, loadUnites]);

  // Mise à jour du stock en temps réel via WebSocket
  useEffect(() => {
    if (!lastStockUpdate) return;
    setAllProducts((prev) =>
      prev.map((p) => {
        if (p.id === lastStockUpdate.produitId) {
          return { ...p, stock: lastStockUpdate.nouvelleQuantite };
        }
        return p;
      })
    );
    // Alerte si un produit du panier devient indisponible
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === lastStockUpdate.produitId && item.qty > lastStockUpdate.nouvelleQuantite) {
          toast.warning(
            `Stock insuffisant pour "${item.name}". Stock restant : ${lastStockUpdate.nouvelleQuantite}`
          );
          return { ...item, stock: lastStockUpdate.nouvelleQuantite };
        }
        return item;
      })
    );
  }, [lastStockUpdate]);

  const filteredProducts = allProducts.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'Tous' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      let foundCondProduct: Product | undefined;
      let foundCond: ConditionnementItem | undefined;

      for (const p of allProducts) {
        const cond = p.conditionnements?.find(c => c.codeBarre && c.codeBarre.toLowerCase() === lowerQuery);
        if (cond) {
          foundCondProduct = p;
          foundCond = cond;
          break;
        }
      }

      if (foundCondProduct && foundCond) {
        const matchingUnite = allUnites.find((u) => u.id_unite === Number(foundCond?.uniteId));
        doAddToCart(foundCondProduct, matchingUnite || null);
        setSearchQuery('');
        return;
      }

      const foundProduct = allProducts.find(p => p.reference.toLowerCase() === lowerQuery);
      if (foundProduct) {
        doAddToCart(foundProduct, null);
        setSearchQuery('');
      } else {
        toast.error('Aucun produit trouvé pour ce code.');
      }
    }
  };

  const doAddToCart = (product: Product, unite: UniteItem | null, qty: number = 1) => {
    if (product.stock === 0) {
      toast.error(`"${product.name}" est en rupture de stock.`);
      return;
    }

    let qtyToAdd = qty;
    let selectedUnitId = unite?.id_unite || null;
    let selectedUnitMultiple = unite?.multiple || 1;
    let displayName = product.name;
    let cartItemId = `item-${product.id}-${selectedUnitId || 'base'}`;

    // Calcul du prix
    let basePrice = product.prixVente;
    if (selectedTypeVente) {
      const tarif = product.tarifs?.find((t) => t.typeVenteId === selectedTypeVente);
      if (tarif) basePrice = tarif.prix;
    }

    let finalPrice = basePrice * selectedUnitMultiple;

    // Vérifier si un conditionnement spécifique existe pour cette unité (prix forfaitaire)
    if (selectedUnitId) {
      const specificCond = product.conditionnements?.find((c) => Number(c.uniteId) === selectedUnitId);
      if (specificCond && specificCond.prixVente && specificCond.prixVente > 0) {
        finalPrice = specificCond.prixVente;
      }
    }

    if (selectedUnitMultiple * qtyToAdd > product.stock) {
      toast.error(`Stock insuffisant pour cette unité. Disponible: ${product.stock}`);
      return;
    }

    setCart((prev) => {
      // Remove old item if it's an update scenario where we change unit and it merges with an existing one?
      // Actually doAddToCart doesn't remove, it just adds or increments.
      const existing = prev.find((i) => i.cartItemId === cartItemId && i.prixVente === finalPrice);
      if (existing) {
        if ((existing.qty + qtyToAdd) * selectedUnitMultiple > product.stock) {
          toast.warning(`Stock insuffisant.`);
          return prev;
        }
        return prev.map((i) =>
          i.cartItemId === existing.cartItemId ? { ...i, qty: i.qty + qtyToAdd } : i
        );
      }
      return [
        ...prev,
        {
          ...product,
          cartItemId,
          name: displayName,
          qty: qtyToAdd,
          prixVente: finalPrice,
          selectedUnitId,
          selectedUnitMultiple,
        },
      ];
    });
  };

  const updateCartItemUnit = (cartItemId: string, uniteId: number | null) => {
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;

    const originalProduct = allProducts.find(p => p.id === item.id);
    if (!originalProduct) return;

    const unit = uniteId ? allUnites.find(u => u.id_unite === uniteId) : null;

    // Remove the old item and add the new one
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
    setTimeout(() => {
      doAddToCart(originalProduct, unit || null, item.qty);
    }, 0);
  };

  /**
   * Ajouter un kit composé au panier en répartissant proportionnellement le prix forfaitaire
   */
  const handleAddKitToCart = (kit: {
    nomKit: string;
    prixForfaitaire: number;
    items: KitCompositionItem[];
  }) => {
    // Vérifier les stocks de chaque composant
    for (const item of kit.items) {
      if (item.product.stock < item.qty) {
        toast.error(
          `Stock insuffisant pour "${item.product.name}" (requis: ${item.qty}, en stock: ${item.product.stock})`
        );
        return;
      }
    }

    const idKitGroupe = `kit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const totalCatalogue = kit.items.reduce(
      (acc, item) => acc + item.product.prixVente * item.qty,
      0
    );
    const ratio = totalCatalogue > 0 ? kit.prixForfaitaire / totalCatalogue : 1;

    let runningTotal = 0;
    const newCartLines: CartItem[] = kit.items.map((item, index) => {
      const isLast = index === kit.items.length - 1;
      let unitPrice: number;
      if (isLast) {
        const remaining = kit.prixForfaitaire - runningTotal;
        unitPrice = Math.max(0, Math.round(remaining / item.qty));
      } else {
        unitPrice = Math.round(item.product.prixVente * ratio);
        runningTotal += unitPrice * item.qty;
      }

      return {
        ...item.product,
        cartItemId: `${idKitGroupe}-${item.product.id}`,
        prixVente: unitPrice,
        qty: item.qty,
        nomKit: kit.nomKit,
        idKitGroupe,
        prixForfaitaireKit: kit.prixForfaitaire,
      };
    });

    setCart((prev) => [...prev, ...newCartLines]);
    toast.success(`Kit "${kit.nomKit}" ajouté au panier !`);
  };

  /**
   * Ajouter un modèle de kit favori pré-enregistré
   */
  const handleAddSavedKitToCart = (savedKit: ModeleKit) => {
    const compositionItems: KitCompositionItem[] = [];
    for (const ligne of savedKit.lignes) {
      const p = allProducts.find((prod) => prod.id === ligne.produitId);
      if (p) {
        compositionItems.push({
          product: p,
          qty: ligne.quantite,
        });
      }
    }

    if (compositionItems.length === 0) {
      toast.error('Impossible de charger les produits de ce kit.');
      return;
    }

    handleAddKitToCart({
      nomKit: savedKit.nomKit,
      prixForfaitaire: savedKit.prixForfaitaire,
      items: compositionItems,
    });
  };

  /**
   * Supprimer un modèle de kit enregistré
   */
  const handleDeleteSavedKit = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le modèle de kit "${name}" ?`)) return;
    try {
      await ventesService.deleteKit(id);
      toast.success(`Modèle "${name}" supprimé`);
      loadSavedKits();
    } catch (err: any) {
      toast.error(`Erreur: ${err.message || 'Impossible de supprimer'}`);
    }
  };

  const updateQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.cartItemId !== cartItemId) return i;
          const newQty = i.qty + delta;
          if (newQty > i.stock) {
            toast.warning(`Stock insuffisant — seulement ${i.stock} disponible(s).`);
            return i;
          }
          return { ...i, qty: newQty };
        })
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const removeKitGroup = (idKitGroupe: string) => {
    setCart((prev) => prev.filter((i) => i.idKitGroupe !== idKitGroupe));
    toast.info('Kit retiré du panier.');
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Panier vidé.');
  };

  const saveDraft = () => {
    if (cart.length === 0) {
      toast.error('Panier vide');
      return;
    }
    const name = prompt('Nom pour ce brouillon ? (ex: Client X)', `Brouillon du ${new Date().toLocaleTimeString()}`);
    if (!name) return;
    const newDrafts = [...drafts, { id: Date.now().toString(), name, date: new Date().toISOString(), cart }];
    setDrafts(newDrafts);
    localStorage.setItem('pos_cart_drafts', JSON.stringify(newDrafts));
    setCart([]);
    toast.success('Panier mis en brouillon');
  };

  const loadDraft = (id: string) => {
    const d = drafts.find(draft => draft.id === id);
    if (d) {
      if (cart.length > 0) {
        if (!confirm('Le panier actuel sera remplacé. Continuer ?')) return;
      }
      setCart(d.cart);
      deleteDraft(id);
      setDraftsModalOpen(false);
      toast.success('Brouillon récupéré');
    }
  };

  const deleteDraft = (id: string) => {
    const newDrafts = drafts.filter(draft => draft.id !== id);
    setDrafts(newDrafts);
    localStorage.setItem('pos_cart_drafts', JSON.stringify(newDrafts));
  };

  // Calculs du panier avec TVA globale
  const sousTotalHt = cart.reduce((s, i) => s + i.prixVente * i.qty, 0);
  const totalTva = cart.reduce((s, i) => {
    const tva = i.tva ?? tauxTva;
    return s + (i.prixVente * i.qty * tva) / 100;
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
        lignes: cart.map((item) => {
          const tva = item.tva ?? tauxTva;
          const multiple = item.selectedUnitMultiple || 1;
          const trueQty = item.qty * multiple;
          const trueUnitPrice = item.prixVente / multiple;

          return {
            produitId: item.id,
            quantite: trueQty,
            prixAchatUnitaireSnapshot: item.prixAchat,
            prixVenteUnitaireHtSnapshot: trueUnitPrice,
            tauxTvaSnapshot: tva,
            margeUnitaire: trueUnitPrice - item.prixAchat,
            totalLigneHt: item.prixVente * item.qty,
            nomKit: item.nomKit,
            idKitGroupe: item.idKitGroupe,
          };
        }),
        paiements: [
          {
            modePaiement:
              mode === 'especes' ? 'ESPECES' : 'MOBILE_MONEY',
            montant: totalTtc,
            referenceTransaction: undefined,
          },
        ],
      };

      const result = await ventesService.createVente(payload as any);

      setLastSaleData({
        id: result.id,
        referenceTicket: result.referenceTicket,
        total: result.totalTtc,
        mode,
        items: cart.map((i) => ({
          name: i.name,
          qty: i.qty,
          price: i.prixVente,
          total: i.prixVente * i.qty,
          nomKit: i.nomKit,
        })),
      });
      setCart([]);
      setPaymentOpen(false);
      setReceiptOpen(true);

      // Rafraîchir les stocks après vente réussie
      await loadProducts();

      toast.success(
        `✅ Vente ${result.referenceTicket} enregistrée — ${result.totalTtc.toLocaleString('fr-FR')} ${devise}`
      );
    } catch (err: any) {
      toast.error(`Erreur : ${err.message || "Impossible d'enregistrer la vente"}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-950 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-sm font-semibold text-slate-400">
          Chargement de la session de caisse...
        </p>
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
              Aucune caisse ne vous est assignée dans le système. Vous devez avoir une caisse
              configurée par un administrateur pour accéder à cette interface.
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
              {assignedCaisse?.emplacement && (
                <span className="block text-xs mt-0.5">({assignedCaisse.emplacement})</span>
              )}
            </p>
          </div>

          <form onSubmit={handleOpenSession} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Fond de caisse initial ({devise})
              </label>
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
                  <>
                    <Loader2 className="animate-spin" size={16} /> Ouverture en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Ouvrir la caisse
                  </>
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
            <div className="relative flex-1 max-w-xl">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Rechercher ou scanner..."
                className="input-field pl-9 text-sm"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setKitModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Package size={14} />
              <span>Composer un Kit</span>
            </button>

            {sessionStatus === 'open' && (
              <div className="flex items-center gap-2">
                {typesVente.length > 0 && (
                  <select
                    value={selectedTypeVente}
                    onChange={(e) => setSelectedTypeVente(e.target.value)}
                    className="input-field text-xs py-1.5 h-auto bg-card max-w-[140px] truncate pr-8"
                    title="Type de Vente (Tarification)"
                  >
                    {typesVente.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.libelle}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200">
                  <CheckCircle size={12} />
                  <span className="font-semibold">Session ouverte</span>
                </div>
                <button
                  onClick={() => {
                    setRapportMode('details');
                    setRapportModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-semibold"
                >
                  <BarChart3 size={14} />
                  <span>Détail</span>
                </button>
                {hasCloturerPerm && (
                  <button
                    onClick={() => {
                      setRapportMode('cloture');
                      setRapportModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-negative/10 text-negative hover:bg-negative hover:text-white transition-colors text-xs font-semibold"
                  >
                    <FileText size={14} />
                    <span>Clôturer</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-2 px-4 py-3 border-b border-border bg-card shrink-0 overflow-x-auto scrollbar-thin">
          {categories.map((cat) => (
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
              {cat === 'Kits & Bundles' ? (
                <span className="ml-1.5 opacity-70">
                  ({savedKits.length})
                </span>
              ) : cat !== 'Tous' ? (
                <span className="ml-1.5 opacity-70">
                  ({allProducts.filter((p) => p.category === cat).length})
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Grille produits / Kits */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {selectedCategory === 'Kits & Bundles' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
              {/* Carte Création de Kit personnalisé */}
              <button
                type="button"
                onClick={() => setKitModalOpen(true)}
                className="card-base p-5 border-2 border-dashed border-purple-400/40 hover:border-purple-500 bg-purple-50/20 dark:bg-purple-950/10 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 flex flex-col items-center justify-center text-center transition-all group min-h-[190px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Package size={24} />
                </div>
                <p className="text-sm font-bold text-foreground mb-1">
                  Composer un Kit sur mesure
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Rassemblez des articles à la volée et appliquez un prix forfaitaire personnalisé.
                </p>
              </button>

              {/* Liste des kits favoris */}
              {savedKits.map((kit) => {
                const totalCatStandard = kit.lignes.reduce(
                  (acc, l) => acc + (l.prixUnitaireCatalogue || 0) * l.quantite,
                  0
                );
                return (
                  <div
                    key={kit.id}
                    className="card-base p-4 flex flex-col justify-between border-purple-500/20 hover:border-purple-500/50 hover:shadow-md transition-all bg-card"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">📦</span>
                          <h4 className="text-sm font-bold text-foreground leading-snug">
                            {kit.nomKit}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedKit(kit.id, kit.nomKit)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                          title="Supprimer ce modèle"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {kit.description && (
                        <p className="text-xs text-muted-foreground mb-3 italic line-clamp-1">
                          {kit.description}
                        </p>
                      )}

                      {/* Composants du kit */}
                      <div className="space-y-1.5 bg-muted/40 p-2.5 rounded-lg border border-border/50 mb-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Contenu du pack ({kit.lignes.length} réf.) :
                        </p>
                        <div className="max-h-24 overflow-y-auto space-y-1 scrollbar-thin pr-1">
                          {kit.lignes.map((ligne) => (
                            <div
                              key={ligne.id}
                              className="flex justify-between text-xs text-foreground"
                            >
                              <span className="truncate pr-2">
                                <span className="font-bold text-purple-600 dark:text-purple-400">
                                  {ligne.quantite}×
                                </span>{' '}
                                {ligne.produitLibelle}
                              </span>
                              <span className="text-muted-foreground shrink-0 tabular-nums">
                                {(ligne.prixUnitaireCatalogue * ligne.quantite).toLocaleString('fr-FR')}{' '}
                                {devise}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <div>
                        {totalCatStandard > kit.prixForfaitaire && (
                          <p className="text-[11px] text-muted-foreground line-through tabular-nums">
                            {totalCatStandard.toLocaleString('fr-FR')} {devise}
                          </p>
                        )}
                        <p className="text-base font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
                          {kit.prixForfaitaire.toLocaleString('fr-FR')} {devise}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddSavedKitToCart(kit)}
                        className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus size={13} /> Ajouter le Kit
                      </button>
                    </div>
                  </div>
                );
              })}

              {savedKits.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
                  Aucun kit favori pour le moment. Cliquez sur « Composer un Kit » pour en créer un.
                </div>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={32} className="text-muted-foreground mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">Aucun produit trouvé</p>
              <p className="text-xs text-muted-foreground">Essayez un autre terme de recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.id === product.id && !i.idKitGroupe);
                const outOfStock = product.stock === 0;
                const lowStock = product.stock > 0 && product.stock < 10;
                return (
                  <button
                    key={product.id}
                    onClick={() => doAddToCart(product, null)}
                    disabled={outOfStock}
                    className={`card-base p-3.5 text-left transition-all duration-150 active:scale-95 ${
                      outOfStock
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-elevated hover:border-primary/30 cursor-pointer'
                    } ${inCart ? 'border-primary/40 bg-primary/5' : ''}`}
                  >
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-muted to-border/50 flex items-center justify-center mb-3 relative">
                      <span className="text-2xl">
                        {product.category === 'Livres'
                          ? '📚'
                          : product.category === 'Informatique'
                            ? '💻'
                            : product.category === 'Bureautique'
                              ? '🗂️'
                              : '✏️'}
                      </span>
                      {inCart && (
                        <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {inCart.qty}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-tight mb-1 line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-2">{product.reference}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {product.prixVente.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                        {devise}
                      </span>
                      {outOfStock ? (
                        <Badge variant="rupture">Rupture</Badge>
                      ) : lowStock ? (
                        <Badge variant="alert">Stock: {product.stock}</Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          {product.stock} en stock
                        </span>
                      )}
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDraftsModalOpen(true)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Archive size={13} /> Brouillons {drafts.length > 0 && `(${drafts.length})`}
            </button>
            {cart.length > 0 && (
              <>
                <button
                  onClick={saveDraft}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Save size={13} /> Attente
                </button>
                <button
                  onClick={clearCart}
                  className="text-xs text-muted-foreground hover:text-negative flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={13} /> Vider
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lignes du panier */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <ShoppingCart size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Panier vide</p>
              <p className="text-xs text-muted-foreground">
                Cliquez sur un produit pour l&apos;ajouter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className={`px-5 py-3 hover:bg-muted/30 transition-colors fade-in ${
                    item.nomKit ? 'bg-purple-50/20 dark:bg-purple-950/10' : ''
                  }`}
                >
                  {item.nomKit && (
                    <div className="flex items-center justify-between mb-2 px-2.5 py-1 rounded-md bg-purple-100/70 dark:bg-purple-900/40 border border-purple-300/60 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Package size={12} /> Pack : {item.nomKit}
                      </span>
                      {item.idKitGroupe && (
                        <button
                          type="button"
                          onClick={() => removeKitGroup(item.idKitGroupe!)}
                          className="text-muted-foreground hover:text-destructive text-[10px] font-normal flex items-center gap-1 transition-colors"
                          title="Retirer ce pack complet du panier"
                        >
                          <Trash2 size={11} /> Retirer le kit
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-sm">
                      {item.category === 'Livres'
                        ? '📚'
                        : item.category === 'Informatique'
                          ? '💻'
                          : item.category === 'Bureautique'
                            ? '🗂️'
                            : '✏️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.reference}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          {!item.nomKit ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => updateQty(item.cartItemId, -1)}
                                  className="w-6 h-6 rounded-md bg-muted hover:bg-border flex items-center justify-center transition-colors text-red-500 font-bold"
                                  aria-label="Diminuer quantité"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="text-xs font-bold tabular-nums w-6 text-center">
                                  {item.qty}
                                </span>
                                <button
                                  onClick={() => updateQty(item.cartItemId, 1)}
                                  className="w-6 h-6 rounded-md bg-muted hover:bg-border flex items-center justify-center transition-colors text-green-600 font-bold"
                                  aria-label="Augmenter quantité"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                              <select
                                value={item.selectedUnitId || ''}
                                onChange={(e) => updateCartItemUnit(item.cartItemId, e.target.value ? Number(e.target.value) : null)}
                                className="text-[11px] py-1 px-2 pr-6 bg-muted/50 border border-border rounded-md text-foreground max-w-[120px]"
                              >
                                <option value="">Pièce (1)</option>
                                {allUnites.map((u) => (
                                  <option key={u.id_unite} value={u.id_unite}>
                                    {u.nom}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground tabular-nums">
                              Qté: {item.qty}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold tabular-nums text-foreground">
                            {(item.prixVente * item.qty).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            {devise}
                          </span>
                          {!item.nomKit && (
                            <button
                              onClick={() => removeItem(item.cartItemId)}
                              className="text-muted-foreground hover:text-negative transition-colors"
                              aria-label={`Supprimer ${item.name}`}
                            >
                              <X size={14} />
                            </button>
                          )}
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
              <span>
                Sous-total HT ({totalItems} article{totalItems > 1 ? 's' : ''})
              </span>
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
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { id: 'pay-especes', label: 'Espèces', icon: Banknote },
              { id: 'pay-wave', label: 'Wave', icon: Smartphone },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  if (cart.length === 0) {
                    toast.error('Ajoutez des produits avant de payer.');
                    return;
                  }
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
              if (cart.length === 0) {
                toast.error('Le panier est vide.');
                return;
              }
              setPaymentOpen(true);
            }}
            disabled={cart.length === 0 || isSaving}
            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <CreditCard size={16} /> Encaisser —{' '}
                {totalTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}
              </>
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
      <KitComposerModal
        open={kitModalOpen}
        onClose={() => setKitModalOpen(false)}
        availableProducts={allProducts}
        devise={devise}
        onAddKitToCart={handleAddKitToCart}
        onKitSaved={loadSavedKits}
      />
      {activeSessionId && (
        <RapportCaisseModal
          open={rapportModalOpen}
          onClose={() => setRapportModalOpen(false)}
          sessionId={activeSessionId}
          devise={devise}
          onCloturer={handleClotureSuccess}
          mode={rapportMode}
        />
      )}
      
      {/* Modale Brouillons */}
      {draftsModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Archive size={18} /> Brouillons en attente
              </h3>
              <button
                onClick={() => setDraftsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {drafts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Archive size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun panier en attente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                      <div>
                        <p className="text-sm font-bold text-foreground">{d.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {d.cart.length} article(s) - {new Date(d.date).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadDraft(d.id)}
                          className="btn-primary py-1 px-3 text-xs"
                        >
                          Reprendre
                        </button>
                        <button
                          onClick={() => deleteDraft(d.id)}
                          className="p-1.5 text-muted-foreground hover:text-negative transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
