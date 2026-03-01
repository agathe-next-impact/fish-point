import { notFound } from 'next/navigation';
import { getDepartmentByCode } from '@/config/departments';
import { SeasonCalendar } from '@/components/regulations/SeasonCalendar';
import { FishSizeTable } from '@/components/regulations/FishSizeTable';
import type { Metadata } from 'next';

interface RegulationDeptPageProps {
  params: Promise<{ department: string }>;
}

export async function generateMetadata({ params }: RegulationDeptPageProps): Promise<Metadata> {
  const { department } = await params;
  const dept = getDepartmentByCode(department);
  if (!dept) return { title: 'Département introuvable' };
  return { title: `Réglementation pêche - ${dept.name} (${dept.code})` };
}

export default async function RegulationDepartmentPage({ params }: RegulationDeptPageProps) {
  const { department } = await params;
  const dept = getDepartmentByCode(department);
  if (!dept) notFound();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">Réglementation - {dept.name} ({dept.code})</h1>
      <p className="text-muted-foreground mb-6">{dept.region}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SeasonCalendar title="1ère catégorie" openMonths={[3, 4, 5, 6, 7, 8, 9]} />
        <SeasonCalendar title="2ème catégorie" openMonths={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} />
      </div>

      <FishSizeTable />
    </div>
  );
}
