export const detectLanguageByIP = (country: string): string => {
  const countryLanguageMap: Record<string, string> = {
    'US': 'en-US',
    'United States': 'en-US',
    'CA': 'en-CA',
    'Canada': 'en-CA',
    'GB': 'en-GB',
    'United Kingdom': 'en-GB',
    'AU': 'en-AU',
    'Australia': 'en-AU',
    'FR': 'fr-FR',
    'France': 'fr-FR',
    'DE': 'de-DE',
    'Germany': 'de-DE',
    'ES': 'es-ES',
    'Spain': 'es-ES',
    'IT': 'it-IT',
    'Italy': 'it-IT',
    'JP': 'ja-JP',
    'Japan': 'ja-JP',
    'CN': 'zh-CN',
    'China': 'zh-CN'
  };

  return countryLanguageMap[country] || 'en-US';
};

