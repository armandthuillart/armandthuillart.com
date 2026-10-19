import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *
Disallow:

Content-Signal: search=yes, ai-input=yes, ai-train=yes

Sitemap: ${new URL('sitemap-index.xml', site).href}
`);
