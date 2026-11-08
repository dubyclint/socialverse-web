const ASSET_LINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.viorp.app',
      sha256_cert_fingerprints: [
        '0A:74:18:F9:8D:3B:3A:7B:E4:80:9A:2E:A9:C5:12:B6:F6:68:0D:E0:AA:26:FB:03:03:DF:DE:69:72:16:66:14',
        '86:E4:AD:0F:A3:9B:02:18:90:E2:7C:A9:71:5F:9B:D5:53:F0:55:D7:86:64:8B:74:08:4C:F1:FE:DA:83:95:68',
        '9D:09:ED:F3:F5:89:18:CD:61:E8:20:F0:48:98:9F:55:F3:EF:18:6E:CB:C3:26:AE:B2:D3:A2:5C:18:27:9C:31'
      ]
    }
  }
]

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  return JSON.stringify(ASSET_LINKS)
})
