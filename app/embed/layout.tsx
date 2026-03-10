import type { Metadata } from 'next';
import '../globals.css';

/**
 * Embed layout: minimal chrome, no header/footer.
 * Designed for iframe embedding in partner media sites.
 *
 * Usage: <iframe src="https://criblepolitique.fr/embed" width="100%" height="800" />
 */
export const metadata: Metadata = {
  title: 'Le Crible Politique — Widget',
  description: 'Widget embeddable d\'analyse politique multi-dimensionnelle',
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  // No <html>/<body> here: only the root layout may define them.
  // A nested layout that re-declares them causes a React hydration mismatch.
  return <div className="min-h-screen bg-white antialiased">{children}</div>;
}
