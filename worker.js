// Sends www.sigenticlabs.com to the bare domain; everything else is a static file.
// Assets use html_handling "none" (pages live at /privacy.html and so on), so a
// directory path like / is mapped to its index.html here.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.endsWith('/')) {
      url.pathname += 'index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};
