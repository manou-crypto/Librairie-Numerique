'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2, Shield, CheckSquare, Square, AlertCircle } from 'lucide-react';
import type { RoleItem, PermissionItem } from '@/services/utilisateurs.service';

function PermissionGroup({ 
  moduleName, 
  modulePerms, 
  selectedPerms, 
  isProtectedAdmin, 
  toggleModule, 
  togglePerm 
}: { 
  moduleName: string;
  modulePerms: PermissionItem[];
  selectedPerms: Set<string>;
  isProtectedAdmin: boolean;
  toggleModule: (perms: PermissionItem[]) => void;
  togglePerm: (code: string) => void;
}) {
  const allModuleSelected = modulePerms.every((p) => selectedPerms.has(p.codePermission));

  return (
    <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Section : {moduleName}
        </span>
        {!isProtectedAdmin && (
          <button
            type="button"
            onClick={() => toggleModule(modulePerms)}
            className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
          >
            {allModuleSelected ? 'Désélectionner le module' : 'Sélectionner tout le module'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {modulePerms.map((p) => {
          const isChecked = isProtectedAdmin || selectedPerms.has(p.codePermission);
          return (
            <label
              key={p.codePermission}
              className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs transition-colors cursor-pointer select-none ${
                isChecked
                  ? 'bg-card border-primary/40 text-foreground font-medium shadow-xs'
                  : 'bg-card/50 border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
              } ${isProtectedAdmin ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => togglePerm(p.codePermission)}
                disabled={isProtectedAdmin}
                className="sr-only"
              />
              {isChecked ? (
                <CheckSquare size={16} className="text-primary shrink-0" />
              ) : (
                <Square size={16} className="text-muted-foreground/50 shrink-0" />
              )}
              <span className="truncate">{p.libelle}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

interface RoleModalProps {
  open: boolean;
  onClose: () => void;
  role: RoleItem | null;
  permissions: PermissionItem[];
  onSave: (data: { codeRole: string; libelle: string; permissions: string[] }) => Promise<void>;
}

export default function RoleModal({ open, onClose, role, permissions, onSave }: RoleModalProps) {
  const isEdit = role !== null;
  const isProtectedAdmin = role?.codeRole === 'ADMIN';

  const [libelle, setLibelle] = useState('');
  const [codeRole, setCodeRole] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      if (role) {
        setLibelle(role.libelle);
        setCodeRole(role.codeRole);
        setSelectedPerms(new Set(role.permissions || []));
      } else {
        setLibelle('');
        setCodeRole('');
        setSelectedPerms(new Set());
      }
    }
  }, [open, role]);

  const pagePermissions = permissions.filter(p => p.type === 'PAGE' || !p.type || p.codePermission.startsWith('VIEW_'));
  const actionPermissions = permissions.filter(p => p.type === 'ACTION' && !p.codePermission.startsWith('VIEW_'));

  const groupPermsByModule = (perms: PermissionItem[]) => perms.reduce<Record<string, PermissionItem[]>>((acc, p) => {
    const mod = p.module || 'Général';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const pagePermsByModule = groupPermsByModule(pagePermissions);
  const actionPermsByModule = groupPermsByModule(actionPermissions);
  const togglePerm = (code: string) => {
    if (isProtectedAdmin) return;
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const toggleModule = (modulePerms: PermissionItem[]) => {
    if (isProtectedAdmin) return;
    const allSelected = modulePerms.every((p) => selectedPerms.has(p.codePermission));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      modulePerms.forEach((p) => {
        if (allSelected) {
          next.delete(p.codePermission);
        } else {
          next.add(p.codePermission);
        }
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    if (isProtectedAdmin) return;
    if (selectedPerms.size === permissions.length) {
      setSelectedPerms(new Set());
    } else {
      setSelectedPerms(new Set(permissions.map((p) => p.codePermission)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libelle.trim()) {
      setError('Le libellé du rôle est obligatoire.');
      return;
    }
    if (!isEdit && !codeRole.trim()) {
      setError('Le code du rôle est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave({
        codeRole: codeRole.trim().toUpperCase().replace(/\s+/g, '_'),
        libelle: libelle.trim(),
        permissions: Array.from(selectedPerms),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde du rôle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Modifier le rôle — ${role?.libelle}` : 'Créer un nouveau rôle'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-semibold text-foreground mb-1.5"
              htmlFor="role-libelle"
            >
              Libellé du rôle <span className="text-negative">*</span>
            </label>
            <input
              id="role-libelle"
              type="text"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex: Responsable des Ventes"
              className="input-field"
              required
              autoFocus
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold text-foreground mb-1.5"
              htmlFor="role-code"
            >
              Code technique{' '}
              {isEdit && (
                <span className="text-muted-foreground font-normal">(Non modifiable)</span>
              )}
              {!isEdit && <span className="text-negative">*</span>}
            </label>
            <input
              id="role-code"
              type="text"
              value={codeRole}
              onChange={(e) => setCodeRole(e.target.value)}
              placeholder="Ex: RESP_VENTES"
              className="input-field font-mono uppercase"
              disabled={isEdit}
              required={!isEdit}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Permissions d'accès aux pages
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Cochez les pages visibles dans le menu et accessibles pour ce rôle.
              </p>
            </div>
            {!isProtectedAdmin && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {selectedPerms.size === permissions.length
                  ? 'Tout désélectionner'
                  : 'Tout sélectionner'}
              </button>
            )}
          </div>

          {isProtectedAdmin && (
            <div className="p-3 mb-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary flex items-center gap-2">
              <Shield size={16} className="shrink-0" />
              <span>
                Le rôle <strong>Administrateur</strong> possède automatiquement un accès complet et
                irrévocable à toutes les fonctionnalités.
              </span>
            </div>
          )}

          <div className="space-y-6 max-h-[50vh] overflow-y-auto scrollbar-thin pr-1">
            {/* ACCES AUX PAGES */}
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-border flex-1" />
                1. Accès aux pages
                <span className="w-4 h-px bg-border flex-1" />
              </h5>
              <div className="space-y-4">
                {Object.entries(pagePermsByModule).map(([moduleName, modulePerms]) => (
                  <PermissionGroup 
                    key={`page-${moduleName}`}
                    moduleName={moduleName}
                    modulePerms={modulePerms}
                    selectedPerms={selectedPerms}
                    isProtectedAdmin={isProtectedAdmin}
                    toggleModule={toggleModule}
                    togglePerm={togglePerm}
                  />
                ))}
              </div>
            </div>

            {/* FONCTIONNALITES */}
            {Object.keys(actionPermsByModule).length > 0 && (
              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-border flex-1" />
                  2. Fonctionnalités spécifiques
                  <span className="w-4 h-px bg-border flex-1" />
                </h5>
                <div className="space-y-4">
                  {Object.entries(actionPermsByModule).map(([moduleName, modulePerms]) => (
                    <PermissionGroup 
                      key={`action-${moduleName}`}
                      moduleName={moduleName}
                      modulePerms={modulePerms}
                      selectedPerms={selectedPerms}
                      isProtectedAdmin={isProtectedAdmin}
                      toggleModule={toggleModule}
                      togglePerm={togglePerm}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-negative bg-negative/10 p-2.5 rounded-lg border border-negative/20">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center justify-center gap-2 min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Enregistrement...
              </>
            ) : isEdit ? (
              'Enregistrer'
            ) : (
              'Créer le rôle'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
