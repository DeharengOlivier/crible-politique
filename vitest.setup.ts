// Runs before every test file. The DOM matchers are only meaningful in the
// files that opt into a jsdom environment; importing them here is harmless in
// the node ones and saves repeating it.
import '@testing-library/jest-dom/vitest';
