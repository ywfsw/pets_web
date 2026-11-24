const apiOrigin = 'https://pets-why3.onrender.com';

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const headers = new Headers(request.headers);
    const origin = headers.get('Origin');
    if (origin && origin !== url.origin) {
      return new Response('Forbidden', { status: 403 });
    }

    // 同源请求转发到 Render 时，避免触发后端的跨域检查。
    headers.delete('Origin');
    headers.delete('Host');

    const upstream = new URL(apiOrigin);
    upstream.pathname = url.pathname;
    upstream.search = url.search;
    return fetch(new Request(upstream, request), {
      headers,
      redirect: 'manual',
      cache: 'no-store',
    });
  },
};
