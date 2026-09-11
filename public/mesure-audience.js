/*
 * What the audience measurement is allowed to carry off this site.
 *
 * Umami reports the page address. On this site two addresses ARE the reader's
 * answers, which is precisely what /confidentialite promises never leaves the
 * browser:
 *
 *   /p/<code>              a shared profile: the code decodes to the answers
 *   /compare#a=..&b=..     two codes, in the fragment
 *
 * The tracker keeps the fragment unless told otherwise, and it keeps the path
 * of a same-site referrer, so a reader who opens a shared profile and then
 * clicks anything would have leaked the code twice over.
 *
 * This function is named by `data-before-send` on the tracker tag. Umami calls
 * it with the payload before sending and sends whatever it returns, so the
 * redaction happens before the request exists, not after. The visit is still
 * counted: only the code is replaced, by the shape of the route.
 *
 * Written as a served file rather than inline because the logic is worth
 * reading and worth testing; __tests__/measurementNeverCarriesAProfile.test.ts
 * loads this very file.
 */
(function () {
  function redact(address) {
    if (typeof address !== 'string' || address === '') return address;
    // The fragment is never useful here and is one of the two leaks.
    var hash = address.indexOf('#');
    if (hash !== -1) address = address.slice(0, hash);
    // A shared profile is identified by its shape, not by its code.
    return address.replace(/^(\/p\/)[^/?#]+/, '$1[code]');
  }

  window.cribleMesureAudience = function (type, payload) {
    if (!payload) return payload;
    payload.url = redact(payload.url);
    // Same-site referrers reach us as a bare path, so they leak the same way.
    if (typeof payload.referrer === 'string' && payload.referrer.charAt(0) === '/') {
      payload.referrer = redact(payload.referrer);
    }
    return payload;
  };

  // Exported for the test, which runs this file outside a browser.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { redact: redact, hook: window.cribleMesureAudience };
  }
})();
