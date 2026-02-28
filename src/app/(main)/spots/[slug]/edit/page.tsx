import { SpotForm } from '@/components/spots/SpotForm';

export default function EditSpotPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Modifier le spot</h1>
      <SpotForm />
    </div>
  );
}
