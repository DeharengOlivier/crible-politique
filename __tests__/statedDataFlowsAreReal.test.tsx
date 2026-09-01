// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { cleanup, render } from '@testing-library/react';
import Home from '@/app/page';
import LegalPage from '@/app/legal/page';
import PrivacyPage from '@/app/confidentialite/page';
import PartnersPage from '@/app/partners/page';
import AboutPage from '@/app/a-propos/page';
import MethodologyPage from '@/app/methodology/page';
import { answersStayHereSentence } from '@/lib/resultsAccess';
import { TEST_SESSION_STORAGE_KEY } from '@/lib/testSession';

// Reported 2026-08-31 by the owner, about the site's own privacy discourse:
// "j'ai l'impression que c'est un mensonge". It was, and the worst of it was on
// the legal page, which is the one page whose whole purpose is to be exact.
//
// Measured the same day. `vercel env ls production` shows this deployment sets
// both NEXT_PUBLIC_CRIBLE_API_URL and NEXT_PUBLIC_GOOGLE_CLIENT_ID, so it signs
// readers in with Google, sends a Google ID token to api.crible.eu, stores a
// sealed profile in a D1 database and increments a counter at the end of every
// analysis. Against that build, /legal said:
//
//   "Données collectées: Aucune. Le site n'a ni compte, ni base de données, ni
//    API: il n'existe aucun endroit où une réponse pourrait être enregistrée."
//   "Sans collecte, il n'y a pas de traitement de données personnelles au sens
//    du RGPD, donc pas de base légale à invoquer."
//   "Le site n'appelle aucune API, aucun modèle d'IA et aucune base de données
//    pendant votre visite."
//
// and its processor table named Plausible, which this deployment never loads,
// while omitting Cloudflare and Google, which it does contact. The home page
// opened with "Sans compte, sans collecte de données" on a build that requires
// an account to read results.
//
// The invariant, stated generally: no page denies a data flow this build
// performs, and no page declares one it cannot. Those are one defect with two
// signs. The second sign already had a battery (optionalFeatureExposure.test);
// this is the first, plus the boundary where the two meet.

const API = 'https://api.example';
const GOOGLE_CLIENT = 'client-123.apps.googleusercontent.com';

vi.mock('next/navigation', () => ({
    notFound: () => {
        throw new Error('NEXT_NOT_FOUND');
    },
    usePathname: () => '/'
}));

/** Every public page that makes a claim about what the site does with data. */
const PAGES: Array<[string, () => React.ReactElement]> = [
    ['/', Home],
    ['/legal', LegalPage],
    ['/confidentialite', PrivacyPage],
    ['/partners', PartnersPage],
    ['/a-propos', AboutPage],
    ['/methodology', MethodologyPage]
];

function textOf(page: () => React.ReactElement): string {
    return render(page()).container.textContent ?? '';
}

function enableStatistics(): void {
    vi.stubEnv('NEXT_PUBLIC_CRIBLE_API_URL', API);
}

function enableVault(): void {
    enableStatistics();
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', GOOGLE_CLIENT);
}

afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
});

describe('the legal page under the configuration production actually runs', () => {
    it('does not answer "none" to what it collects', () => {
        enableVault();
        const text = textOf(LegalPage);
        expect(text).not.toMatch(/ni base de données, ni API/);
        expect(text).not.toMatch(/n['’]appelle aucune API/);
        expect(text).not.toMatch(/aucun endroit où une réponse pourrait être enregistrée/);
    });

    it('does not conclude there is nothing to have a legal basis for', () => {
        // The most consequential sentence on the page: it moved from "we hold
        // nothing" to a conclusion about the GDPR, and carried the error into
        // the reader's rights.
        enableVault();
        const text = textOf(LegalPage);
        expect(text).not.toMatch(/Sans collecte, il n['’]y a pas de traitement/);
        expect(text).not.toMatch(/pas de base légale à invoquer/);
        expect(text).not.toMatch(/Il n['’]y en a aucune ici/);
    });

    it('names a legal basis and a way to exercise the rights that follow', () => {
        enableVault();
        const text = textOf(LegalPage);
        expect(text).toMatch(/consentement/);
        // Erasure is not theoretical here: there is a delete button, and the
        // page has to point at it rather than send the reader to an inbox and
        // a month of waiting.
        expect(text).toMatch(/effacement/i);
        expect(text).toMatch(/supprimer mon profil sauvegardé/);
    });

    it('names every third party this build can make the browser contact', () => {
        enableVault();
        const text = textOf(LegalPage);
        expect(text, 'the Worker and its database run on Cloudflare').toMatch(/Cloudflare/);
        expect(text, 'sign-in loads a Google script and sends Google a token').toMatch(/Google/);
        expect(text, 'the pages are served by Vercel').toMatch(/Vercel/);
    });

    it('still says no data is collected on a build that collects none', () => {
        // The opposite sign of the same defect: the default deployment really
        // is the client-only tool, and must not be made to apologise for a
        // database it does not have.
        const text = textOf(LegalPage);
        expect(text).toMatch(/Aucune/);
        expect(text).not.toMatch(/Cloudflare/);
        expect(text).not.toMatch(/compte Google/);
    });

    it('names Cloudflare but not a Google account when only the counter runs', () => {
        enableStatistics();
        const text = textOf(LegalPage);
        expect(text).toMatch(/Cloudflare/);
        expect(text).not.toMatch(/compte Google/);
    });
});

describe('the analytics row is tied to the flag that injects the script', () => {
    it('lists no analytics processor while the script is not injected', () => {
        // NEXT_PUBLIC_PLAUSIBLE_DOMAIN is unset in production (measured
        // 2026-08-31), so app/layout.tsx renders no Plausible script, and
        // declaring the processor announced a transfer that never happens.
        enableVault();
        expect(textOf(LegalPage)).not.toMatch(/Plausible/);
    });

    it('lists it once the domain is configured', () => {
        enableVault();
        vi.stubEnv('NEXT_PUBLIC_PLAUSIBLE_DOMAIN', 'crible.eu');
        expect(textOf(LegalPage)).toMatch(/Plausible/);
    });
});

describe('no page denies what this build does', () => {
    // Written as whole claims rather than fragments on purpose: "sans aucun
    // compte" is TRUE of a shared profile link and has to survive, while
    // "Sans compte, sans collecte de données" as a description of the site is
    // false the moment results need one.
    const DENIALS = [
        /Sans compte, sans collecte de données/,
        /ni base de données, ni API/,
        /n['’]appelle aucune API/,
        /Sans collecte, il n['’]y a pas de traitement/,
        /aucune donnée ne quitte jamais/i,
        // /partners closed its open-data section on it, and a partner reading
        // that page is deciding what to tell their own readers.
        /sans collecte de données\./
    ];

    it.each(PAGES)('%s claims none of them once the vault is configured', (_path, page) => {
        enableVault();
        const text = textOf(page);
        for (const denial of DENIALS) {
            expect(text, `${_path} still claims ${denial}`).not.toMatch(denial);
        }
    });

    it('keeps the home page honest about what reading results now costs', () => {
        enableVault();
        expect(textOf(Home)).toMatch(/compte Google/);
    });

    it('leaves the home page free of any account when none is configured', () => {
        const text = textOf(Home);
        expect(text).not.toMatch(/compte Google/);
        expect(text).toMatch(/sans collecte de données/i);
    });
});

describe('the privacy page counts the calls a reader can actually see', () => {
    it('counts the statistics read the home page makes on arrival', () => {
        // The page invites the reader to open the network tab. Measured on a
        // production build 2026-08-31: loading the home page issues GET
        // https://api.crible.eu/stats before anything is clicked, which the
        // count of "au plus deux appels" never included.
        enableVault();
        const text = textOf(PrivacyPage);
        expect(text).toMatch(/statistiques publiques/i);
        expect(text).toMatch(/trois appels/);
    });

    it('says the browser sends Google nothing until the reader asks', () => {
        enableVault();
        const text = textOf(PrivacyPage);
        expect(text).toMatch(/tant que vous ne cliquez pas/);
    });

    it('says what the Google token carries, not only what the database keeps', () => {
        // The claim that survives an open-source audit: the database holds no
        // address, but the request that reaches the API carries one, because a
        // Google ID token is a JWT holding email, name and picture. Anyone can
        // paste the Authorization header into a JWT decoder and see it. Saying
        // only "la base ne contient pas votre adresse e-mail" was true of the
        // database and silent about the request, which is the half a reader
        // auditing the site would find on their own.
        enableVault();
        const text = textOf(PrivacyPage);
        expect(text).toMatch(/contient votre adresse e-mail/);
        expect(text).toMatch(/notre API reçoit donc/);
    });

    it('says the address of the reader is seen, and what bounds its use', () => {
        // "ni votre adresse IP ne sont enregistrées" was true of what is
        // stored and said nothing of what is seen: Vercel and Cloudflare
        // receive it on every request, and the rate limiter keys a counter on
        // it. Both are ordinary and neither was written down.
        enableVault();
        const text = textOf(PrivacyPage);
        expect(text).toMatch(/voient votre adresse IP/);
    });
});

describe('the questionnaire footer promises no more than the build keeps', () => {
    // "Vos réponses ne quittent jamais votre appareil" is a claim about the
    // future, printed under every statement. It is true of the questionnaire
    // and of a build with no vault, and it stops being true three screens
    // later on a build that offers to save: the answers leave, sealed, when
    // the reader asks. The same over-claim in miniature that made the legal
    // page wrong, so it gets the same treatment.
    it('drops the "jamais" once saving exists', () => {
        const text = answersStayHereSentence(true);
        expect(text).not.toMatch(/ne quittent jamais/);
        expect(text).toMatch(/tant que vous ne le demandez pas/);
    });

    it('keeps it on a build where nothing can ever be sent', () => {
        expect(answersStayHereSentence(false)).toMatch(/ne quittent jamais votre appareil/);
    });

    it.each([
        ['components/test/StatementSurvey.tsx'],
        ['components/test/ClarifySurvey.tsx']
    ])('%s reads the sentence rather than carrying its own copy', (path) => {
        // The two surveys held the same hard-coded line, which is how one of
        // them would come to disagree with the other and with the build.
        const source = readFileSync(path, 'utf8');
        expect(source).toMatch(/answersStayHereSentence/);
        expect(source).not.toMatch(/ne quittent jamais votre appareil/);
    });
});

describe('the storage key a reader is told to look for is the one that is there', () => {
    it('names the key the code actually writes', () => {
        // It said crible_test_v1 on a build storing crible_test_v2 (found
        // 2026-09-01). Of every claim on that page it is the cheapest for a
        // reader to falsify, and a falsified detail discredits the paragraphs
        // around it that they cannot check as easily.
        enableVault();
        expect(textOf(LegalPage)).toContain(TEST_SESSION_STORAGE_KEY);
    });

    it('reads it from the code rather than retyping it', () => {
        const source = readFileSync('app/legal/page.tsx', 'utf8');
        expect(source).toMatch(/TEST_SESSION_STORAGE_KEY/);
        // The literal may appear in a comment recording what went wrong; what
        // must never come back is a hand-typed copy in the markup.
        expect(source).not.toMatch(/<code>crible_test_v/);
    });
});

describe('the repository says the same thing as the pages', () => {
    it('does not tell a developer the project has no database', () => {
        // README.md is the project's front page for anyone auditing it, and
        // api/ has held a D1 database since 2026-08-29.
        const readme = readFileSync('README.md', 'utf8');
        expect(readme).not.toMatch(/there is no database and no/);
    });

    it('does not tell a developer the application calls no third-party API', () => {
        const example = readFileSync('.env.local.example', 'utf8');
        expect(example).not.toMatch(/no server-side integration and calls no third-party API/);
    });
});
