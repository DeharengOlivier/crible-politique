import Link from 'next/link';
import { ArrowRight, ShieldCheck, Eye, GitBranch, Scale } from 'lucide-react';
import { SYNTHETIC_PROFILES } from '@/data/syntheticProfiles';
import { STATEMENTS } from '@/data/statements';
import { PARTIES } from '@/data/parties';
import { MEASURES } from '@/data/measures';
import ProfileGallery from '@/components/home/ProfileGallery';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
      {/* ===== HERO: the identity hook ===== */}
      <header aria-label="Accueil Le Crible Politique" className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 trust-gradient hero-pattern" />

        <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-accent)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-primary)] shadow-sm">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Un miroir, pas un juge
            </div>

            <h1 className="mb-6 font-[family-name:var(--font-heading)] text-balance text-4xl font-bold tracking-tight text-[var(--color-primary)] md:text-6xl">
              Quel est votre profil politique&nbsp;?
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
              {SYNTHETIC_PROFILES.length} grands profils, 7 dimensions. Situez vos convictions
              en 3 minutes et découvrez les courants de pensée et les partis les plus proches
              de vous. Sans compte, sans collecte de données, jamais de consigne de vote.
            </p>

            <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/test"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-[var(--color-primary)] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-[var(--color-primary)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-light)] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <span>Faire le test</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">3 min</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/crible"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--color-border)] bg-white px-8 py-4 font-semibold text-[var(--color-text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <span>Explorer l&apos;observatoire</span>
              </Link>
            </div>

            <p className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <ShieldCheck className="h-4 w-4 text-[var(--color-success)]" aria-hidden="true" />
              Vos réponses ne quittent jamais votre appareil.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* ===== PROFILE GALLERY: the desire trigger ===== */}
        <section aria-labelledby="gallery-title" className="py-12 md:py-16">
          <div className="mb-10 text-center">
            <h2 id="gallery-title" className="mb-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] md:text-4xl">
              Les {SYNTHETIC_PROFILES.length} profils. Lequel êtes-vous&nbsp;?
            </h2>
            <p className="mx-auto max-w-2xl text-[var(--color-text-secondary)]">
              Des résumés pour situer la conversation. Votre profil détaillé, lui, se joue sur
              7 dimensions et se calcule à partir de vos réponses, pas d&apos;une case.
            </p>
          </div>

          <ProfileGallery limit={11} />

          <div className="mt-8 text-center">
            <Link
              href="/test"
              className="inline-flex items-center gap-2 font-semibold text-[var(--color-primary)] hover:underline"
            >
              Découvrir le mien
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ===== REASSURANCE: why trust us (defensive layer, short) ===== */}
        <section aria-labelledby="trust-title" className="py-12">
          <div className="mb-10 text-center">
            <h2 id="trust-title" className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)] md:text-3xl">
              Un test sérieux, pas un quiz
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Eye,
                title: 'Un miroir',
                text: "L'outil reflète vos positions, il ne les corrige pas. Vous validez chaque réponse: aucun algorithme, aucune IA ne décide à votre place."
              },
              {
                icon: GitBranch,
                title: 'Vérifiable',
                text: 'Énoncés, positions des partis et formule de calcul sont publics. La formule est assez simple pour être recalculée à la main.'
              },
              {
                icon: ShieldCheck,
                title: 'Privé par construction',
                text: 'Les opinions politiques sont des données sensibles. Ici tout se calcule dans votre navigateur: rien n\'est collecté ni revendu.'
              }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[var(--color-border-light)] bg-white p-6 shadow-sm">
                <item.icon className="mb-3 h-8 w-8 text-[var(--color-primary)]" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="mb-2 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-text)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Sources banner */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-xl border border-[var(--color-border-light)] bg-white px-8 py-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              Données sourcées
            </span>
            <div className="hidden h-4 w-px bg-[var(--color-border)] sm:block" />
            {['INSEE', 'CHES 2024', 'Haidt MFT', 'CJUE', 'EUR-Lex'].map((source) => (
              <span key={source} className="font-[family-name:var(--font-heading)] text-sm font-semibold tracking-wide text-[var(--color-text-secondary)]">
                {source}
              </span>
            ))}
          </div>
        </section>

        {/* ===== SECOND PILLAR: the observatory ===== */}
        <section aria-labelledby="crible-title" className="py-12 pb-20">
          <div className="overflow-hidden rounded-3xl border border-[var(--color-border-light)] bg-white shadow-sm md:grid md:grid-cols-5">
            <div className="p-8 md:col-span-3 md:p-12">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                <Scale className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h2 id="crible-title" className="mb-3 font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-primary)] md:text-3xl">
                L&apos;observatoire&nbsp;: les programmes au crible du droit
              </h2>
              <p className="mb-6 max-w-xl text-[var(--color-text-secondary)]">
                Retraite à 60 ans, quotas d&apos;immigration, sortie de l&apos;OTAN, déficit sous 3%...
                {' '}{MEASURES.length} mesures phares du débat analysées norme par norme: ce qui est
                établi, ce qui est débattu, les voies possibles. Jamais de verdict.
              </p>
              <Link href="/crible" className="inline-flex items-center gap-2 font-semibold text-[var(--color-accent)] hover:gap-3">
                Explorer les analyses
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
            <div className="hidden bg-[var(--color-bg-hero)] p-12 md:col-span-2 md:flex md:flex-col md:justify-center">
              <dl className="space-y-6">
                <div>
                  <dt className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-primary)]">{STATEMENTS.length}</dt>
                  <dd className="text-sm text-[var(--color-text-muted)]">énoncés sur 7 dimensions</dd>
                </div>
                <div>
                  <dt className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-primary)]">{PARTIES.length}</dt>
                  <dd className="text-sm text-[var(--color-text-muted)]">partis positionnés (France &amp; Belgique)</dd>
                </div>
                <div>
                  <dt className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-primary)]">{MEASURES.length}</dt>
                  <dd className="text-sm text-[var(--color-text-muted)]">mesures au crible du droit</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-8 grid gap-8 md:grid-cols-3">
            <div>
              <h4 className="mb-3 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-primary)]">Le Crible Politique</h4>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Initiative citoyenne indépendante. Vos convictions au crible, les programmes au
                crible du droit. Méthodologie ouverte, aucune consigne de vote.
              </p>
            </div>
            <div>
              <h4 className="mb-3 font-[family-name:var(--font-heading)] font-semibold text-[var(--color-text)]">Nos engagements</h4>
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                {[
                  'Jamais de consigne de vote',
                  'Calcul déterministe, aucune IA dans vos résultats',
                  'Zéro compte, zéro collecte de données',
                  'Positions des partis sourcées et contestables',
                  'Aucun financement partisan ni publicitaire'
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-[family-name:var(--font-heading)] font-semibold text-[var(--color-text)]">Ressources</h4>
              <ul className="mb-4 space-y-2 text-sm">
                <li><Link href="/methodology" className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors">Méthodologie complète</Link></li>
                <li><Link href="/a-propos" className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors">Qui sommes-nous</Link></li>
                <li><Link href="/concepts" className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors">Les profils &amp; concepts</Link></li>
                <li><Link href="/confidentialite" className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors">Confidentialité</Link></li>
                <li><Link href="/partners" className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors">Médias &amp; partenaires</Link></li>
              </ul>
              <h4 className="mb-3 font-[family-name:var(--font-heading)] font-semibold text-[var(--color-text)]">Pays couverts</h4>
              <div className="flex flex-wrap gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 font-medium">France</span>
                <span className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 font-medium">Belgique</span>
              </div>
            </div>
          </div>
          <p className="border-t border-[var(--color-border-light)] pt-8 text-center text-sm text-[var(--color-text-muted)]">
            &copy; 2026 Le Crible Politique &bull;{' '}
            <Link href="/legal" className="underline hover:text-[var(--color-text)]">Mentions légales</Link> &bull;{' '}
            <Link href="/methodology" className="underline hover:text-[var(--color-text)]">Méthodologie</Link> &bull;{' '}
            <Link href="/confidentialite" className="underline hover:text-[var(--color-text)]">Confidentialité</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
