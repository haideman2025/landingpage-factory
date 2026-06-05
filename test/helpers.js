// Fake global fetch: give it a list of response specs and it returns them in order,
// recording each request. response spec = { ok, status, body }; body is auto JSON-stringified.
export function installFetch(handlers) {
  const calls = [];
  const prev = globalThis.fetch;
  let i = 0;
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), opts });
    const h = handlers[i++];
    if (!h) throw new Error('Unexpected fetch call to ' + url);
    const body = typeof h.body === 'string' ? h.body : JSON.stringify(h.body ?? {});
    return {
      ok: h.ok ?? true,
      status: h.status ?? 200,
      async text() { return body; },
      async json() { return JSON.parse(body); },
    };
  };
  return { calls, restore() { globalThis.fetch = prev; } };
}

// Minimal mock of a Vercel Node res object.
export function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(s = '') { this.body = s; this.ended = true; },
  };
}
