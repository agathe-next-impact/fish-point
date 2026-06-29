import { BrandLogo } from '@/components/layout/BrandLogo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg,#0c4350,#08303a 60%,#06262e)' }}
    >
      <div className="mb-7">
        <BrandLogo textClassName="text-white" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
