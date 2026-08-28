// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook, render, screen, waitFor } from '@testing-library/react';
import { useShareCodes } from '@/lib/useShareCodes';
import ClearLocalDataButton from '@/components/ClearLocalDataButton';

// The browser half of the privacy path. readShareUrl decides what goes where
// and is tested as a pure function; this file checks that the hook actually
// reads the current location, writes the corrected one back, and keeps up when
// the fragment changes under the page.

// jsdom's default document origin; the assertions below are about the path,
// the query and the fragment, not about the host.
const AT = 'http://localhost:3000';

function visit(path: string) {
  window.history.replaceState(null, '', path);
}

describe('useShareCodes', () => {
  beforeEach(() => visit('/compare'));

  it('reports nothing at all until it has read the location', () => {
    // The server never sees the fragment, so the first render cannot know. A
    // component that read null as "no profile" would flash an error page over
    // a perfectly good link.
    const { result } = renderHook(() => useShareCodes(['a']));
    expect(result.current === null || result.current.a === null).toBe(true);
  });

  it('reads a code out of the fragment', async () => {
    visit('/compare#a=1aaa&b=1bbb');
    const { result } = renderHook(() => useShareCodes(['a', 'b']));
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({ a: '1aaa', b: '1bbb' });
  });

  it('honours a legacy query code and moves it into the fragment', async () => {
    visit('/compare?a=1aaa');
    const { result } = renderHook(() => useShareCodes(['a', 'b']));
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current?.a).toBe('1aaa');
    expect(window.location.href).toBe(`${AT}/compare#a=1aaa`);
    expect(window.location.search).toBe('');
  });

  it('picks up a fragment that changes under the page', async () => {
    visit('/compare#a=1aaa');
    const { result } = renderHook(() => useShareCodes(['a']));
    await waitFor(() => expect(result.current?.a).toBe('1aaa'));

    await act(async () => {
      window.history.replaceState(null, '', '/compare#a=1bbb');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current?.a).toBe('1bbb');
  });

  it('does not restart when the caller passes a fresh array each render', async () => {
    visit('/compare#a=1aaa');
    const { result, rerender } = renderHook(() => useShareCodes(['a']));
    await waitFor(() => expect(result.current).not.toBeNull());
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
  });
});

describe('ClearLocalDataButton', () => {
  it('empties the storages when clicked, and says so', async () => {
    localStorage.setItem('crible_test_v1', '{"stage":"results"}');
    sessionStorage.setItem('crible_compare_ref', '1aaa');

    render(<ClearLocalDataButton />);
    const button = screen.getByRole('button', { name: /effacer mes données locales/i });

    await act(async () => {
      button.click();
    });

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(screen.getByText(/données locales effacées/i)).toBeInTheDocument();
  });
});
