'use client';
import React from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

interface AdminConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isEdit?: boolean;
  isLoading?: boolean;
}

export default function AdminConfirmModal({
  open,
  onClose,
  onConfirm,
  userName,
  isEdit = false,
  isLoading = false,
}: AdminConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmation de sécurité — Rôle Administrateur"
      size="sm"
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3.5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-600">
          <div className="p-2 rounded-xl bg-amber-500/20 shrink-0">
            <ShieldAlert size={24} className="text-amber-500" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">
              {isEdit
                ? 'Attribution du rôle Administrateur'
                : "Création d'un compte Administrateur"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vous êtes sur le point d'accorder le rôle <strong>Administrateur</strong> à{' '}
              <span className="font-semibold text-foreground">{userName || 'cet utilisateur'}</span>
              .
            </p>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
            Privilèges accordés :
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
            <li>Accès total et illimité à l'ensemble du système.</li>
            <li>Gestion complète des utilisateurs, des caisses, des finances et des rapports.</li>
            <li>Ce compte ne pourra plus être désactivé par la suite.</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4"
            disabled={isLoading}
          >
            Annuler / Modifier le rôle
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="btn-primary text-xs py-2 px-4 bg-amber-600 hover:bg-amber-500 border-amber-500/30 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Confirmation...
              </>
            ) : (
              "Confirmer l'enregistrement"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
