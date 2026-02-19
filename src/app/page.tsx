import Link from 'next/link';
import { MapPin, Fish, Shield, Users, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-water-700 via-water-600 to-fish-600 text-white">
        <div className="container mx-auto px-4 py-20 sm:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Trouvez les meilleurs
              <span className="text-fish-300"> spots de pêche</span> en France
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-8">
              Carte interactive, réglementation en temps réel, conditions météo et carnet de prises.
              Rejoignez la communauté des pêcheurs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/map">
                <Button size="lg" className="bg-white text-water-700 hover:bg-white/90 w-full sm:w-auto">
                  <MapPin className="h-5 w-5 mr-2" />
                  Voir la carte
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  Créer un compte gratuit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tout ce dont vous avez besoin pour pêcher sereinement
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: MapPin, title: 'Carte Interactive', desc: 'Des milliers de spots géolocalisés avec filtres avancés et vue satellite.' },
              { icon: Shield, title: 'Réglementation', desc: 'Données réglementaires à jour par département, espèce et cours d\'eau.' },
              { icon: Fish, title: 'Carnet de Prises', desc: 'Loggez vos prises avec photos, conditions météo et statistiques.' },
              { icon: Users, title: 'Communauté', desc: 'Partagez vos spots, avis et échangez avec d\'autres pêcheurs.' },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6 rounded-lg border bg-card">
                <feature.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Prêt à découvrir de nouveaux spots ?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Rejoignez des milliers de pêcheurs qui utilisent FishSpot pour trouver les meilleurs coins.
          </p>
          <Link href="/map">
            <Button size="lg">
              <MapPin className="h-5 w-5 mr-2" />
              Explorer la carte
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FishSpot. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
