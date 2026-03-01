import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * This tab screen immediately redirects to the catches/new modal.
 * It acts as a bridge so the center FAB tab triggers the modal presentation.
 */
export default function AddCatchTab() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to the modal and then go back so the tab doesn't stay selected
    router.push('/catches/new');
  }, []);

  return null;
}
