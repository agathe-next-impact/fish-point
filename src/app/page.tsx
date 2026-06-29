import Link from 'next/link';
import { Map, Fish, Shield, Users, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const STATS = [
  { value: '12 400+', label: 'spots cartographiés' },
  { value: '98', label: 'départements' },
  { value: '45 000', label: 'pêcheurs actifs' },
];

const FEATURES = [
  { icon: Map, title: 'Carte Interactive', desc: 'Des milliers de spots géolocalisés avec filtres avancés et vue satellite.' },
  { icon: Shield, title: 'Réglementation', desc: 'Données réglementaires à jour par département, espèce et cours d’eau.' },
  { icon: Fish, title: 'Carnet de Prises', desc: 'Loggez vos prises avec photos, conditions météo et statistiques.' },
  { icon: Users, title: 'Communauté', desc: 'Partagez vos spots, avis et échangez avec d’autres pêcheurs.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(160deg,#0c4350,#08303a 60%,#06262e)' }}
      >
        {/* decorative water grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#5fc9b8 1px, transparent 1px), linear-gradient(90deg, #5fc9b8 1px, transparent 1px)',
            backgroundSize: '46px 46px',
            maskImage: 'linear-gradient(90deg, transparent, #000 60%)',
          }}
        />
        <div className="container relative px-6 py-[76px] pb-[86px] sm:px-14">
          <div className="max-w-[640px]">
            <span className="anim-rise inline-flex items-center gap-2 rounded-full bg-aqua/15 px-3.5 py-1.5 text-[13px] font-semibold text-aqua">
              <span className="h-1.5 w-1.5 rounded-full bg-aqua" />
              Spots autorisés vérifiés en France
            </span>
            <h1 className="fs-dsp anim-rise mt-5 text-[2.6rem] font-extrabold leading-[1.04] sm:text-[3.375rem]" style={{ animationDelay: '0.05s' }}>
              Trouvez les meilleurs spots de pêche en France
            </h1>
            <p className="anim-rise mt-5 max-w-xl text-lg leading-relaxed text-white/75" style={{ animationDelay: '0.1s' }}>
              Carte interactive, réglementation en temps réel, conditions météo et carnet de prises.
              Rejoignez la communauté des pêcheurs.
            </p>
            <div className="anim-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '0.15s' }}>
              <Link href="/map" className="fs-btn fs-btn-primary">
                <Map className="h-5 w-5" />
                Voir la carte
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register" className="fs-btn fs-btn-ghost">
                Créer un compte gratuit
              </Link>
            </div>

            <div className="anim-rise mt-12 flex flex-wrap gap-x-12 gap-y-6" style={{ animationDelay: '0.2s' }}>
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <div className="fs-dsp text-[1.75rem] font-extrabold text-aqua">{stat.value}</div>
                  <div className="text-sm text-white/55">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container px-6 py-20 sm:px-14">
        <h2 className="fs-dsp mx-auto max-w-2xl text-center text-[2rem] font-extrabold text-ink sm:text-4xl">
          Tout ce dont vous avez besoin pour pêcher sereinement
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="anim-rise rounded-fs-lg bg-card px-[22px] py-[26px] shadow-fs-sm"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-fs-md bg-aqua-soft text-teal-deep">
                <feature.icon className="h-6 w-6" strokeWidth={1.9} />
              </div>
              <h3 className="fs-dsp mt-4 text-[19px] font-bold text-ink">{feature.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-fs-muted">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="container px-6 pb-20 sm:px-14">
        <div
          className="relative overflow-hidden rounded-fs-xl px-8 py-14 text-center text-white"
          style={{ background: 'linear-gradient(120deg, var(--fs-teal-deep), var(--fs-teal))' }}
        >
          <Fish
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 text-white/10"
            strokeWidth={1.2}
          />
          <h2 className="fs-dsp relative text-[1.75rem] font-extrabold sm:text-[2.125rem]">
            Prêt à découvrir de nouveaux spots ?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">
            Rejoignez des milliers de pêcheurs qui utilisent FishSpot pour trouver les meilleurs coins.
          </p>
          <Link
            href="/map"
            className="fs-btn relative mt-7 bg-white text-teal-deep hover:bg-white/90"
          >
            <Map className="h-5 w-5" />
            Explorer la carte
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
