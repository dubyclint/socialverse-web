// nitro.config.ts
export default defineNitroConfig({
  prerender: {
    crawlLinks: false,
    routes: ['/sitemap.xml', '/robots.txt'],
    ignore: ['/admin']
  }
})
