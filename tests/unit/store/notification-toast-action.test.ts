import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from '@/store/notification.store';

/**
 * Critère sous-tranche 7 : le toast de confirmation d'« Enregistrer » doit pouvoir
 * porter une action « Annuler » (label + callback) — l'undo n'est plus seulement un
 * reclic du bouton. Le champ `action` est optionnel (non-breaking) : un toast sans
 * action reste valide.
 */
describe('store notification — toast avec action « Annuler »', () => {
  beforeEach(() => {
    useNotificationStore.getState().clearToasts();
  });

  it('conserve l’action (label + onClick) passée à addToast', () => {
    const onClick = vi.fn();

    // duration: 0 → pas de setTimeout planifié, le toast persiste pour l'assertion.
    useNotificationStore.getState().addToast({
      type: 'success',
      title: 'Enregistré',
      action: { label: 'Annuler', onClick },
      duration: 0,
    });

    const [toast] = useNotificationStore.getState().toasts;
    expect(toast.action?.label).toBe('Annuler');

    // Le callback reste le même : l'invoquer (clic « Annuler ») déclenche bien le retrait.
    toast.action?.onClick();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('laisse `action` indéfini quand aucune n’est fournie (non-breaking)', () => {
    useNotificationStore.getState().addToast({
      type: 'info',
      title: 'Retiré des enregistrés',
      duration: 0,
    });

    const [toast] = useNotificationStore.getState().toasts;
    expect(toast.action).toBeUndefined();
  });

  it('attribue un id unique à chaque toast (action ou non)', () => {
    const { addToast } = useNotificationStore.getState();
    addToast({ type: 'success', title: 'Enregistré', action: { label: 'Annuler', onClick: vi.fn() }, duration: 0 });
    addToast({ type: 'info', title: 'Retiré des enregistrés', duration: 0 });

    const { toasts } = useNotificationStore.getState();
    expect(toasts).toHaveLength(2);
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });
});
