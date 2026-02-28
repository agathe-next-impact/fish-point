'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { FishingCardForm } from '@/components/profile/FishingCardForm';
import { FishingCardDisplay } from '@/components/profile/FishingCardDisplay';
import { useMyFishingCards, useCreateFishingCard, useUpdateFishingCard, useDeleteFishingCard } from '@/hooks/useFishingCards';
import { useNotificationStore } from '@/store/notification.store';
import { Plus, CreditCard } from 'lucide-react';
import Link from 'next/link';
import type { FishingCard } from '@/types/fishing-card';
import type { CreateFishingCardFormInput } from '@/validators/fishing-card.schema';

export default function FishingCardsPage() {
  const { data: session } = useSession();
  const addToast = useNotificationStore((s) => s.addToast);

  const { data: cardsResponse, isLoading } = useMyFishingCards();
  const createMutation = useCreateFishingCard();
  const updateMutation = useUpdateFishingCard();
  const deleteMutation = useDeleteFishingCard();

  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<FishingCard | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const cards = cardsResponse?.data ?? [];

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Connectez-vous pour acceder a vos cartes de peche.</p>
        <Link href="/login"><Button>Se connecter</Button></Link>
      </div>
    );
  }

  const handleCreate = async (data: CreateFishingCardFormInput) => {
    try {
      await createMutation.mutateAsync(data);
      addToast({ type: 'success', title: 'Carte de peche ajoutee' });
      setShowForm(false);
    } catch {
      addToast({ type: 'error', title: "Erreur lors de l'ajout de la carte" });
    }
  };

  const handleUpdate = async (data: CreateFishingCardFormInput) => {
    if (!editingCard) return;
    try {
      await updateMutation.mutateAsync({ id: editingCard.id, data });
      addToast({ type: 'success', title: 'Carte de peche mise a jour' });
      setEditingCard(null);
    } catch {
      addToast({ type: 'error', title: 'Erreur lors de la mise a jour' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: 'success', title: 'Carte de peche supprimee' });
      setDeleteConfirmId(null);
    } catch {
      addToast({ type: 'error', title: 'Erreur lors de la suppression' });
    }
  };

  const handleEditClick = (card: FishingCard) => {
    setEditingCard(card);
    setShowForm(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mes cartes de peche</h1>
        <Button onClick={() => { setShowForm(true); setEditingCard(null); }}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter une carte
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Nouvelle carte de peche</h2>
            <FishingCardForm
              onSubmit={handleCreate}
              isSubmitting={createMutation.isPending}
            />
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setShowForm(false)}
            >
              Annuler
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit modal */}
      <Modal open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Modifier la carte de peche</ModalTitle>
            <ModalDescription>Modifiez les informations de votre carte de peche.</ModalDescription>
          </ModalHeader>
          {editingCard && (
            <FishingCardForm
              initialData={editingCard}
              onSubmit={handleUpdate}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </ModalContent>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer la suppression</ModalTitle>
            <ModalDescription>
              Etes-vous sur de vouloir supprimer cette carte de peche ? Cette action est irreversible.
            </ModalDescription>
          </ModalHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Supprimer
            </Button>
          </div>
        </ModalContent>
      </Modal>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cards list */}
      {!isLoading && cards.length > 0 && (
        <div className="space-y-4">
          {(cards as FishingCard[]).map((card) => (
            <FishingCardDisplay
              key={card.id}
              card={card}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cards.length === 0 && !showForm && (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Aucune carte de peche enregistree</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une carte
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
