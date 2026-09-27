export interface CallingCountry {
  code: string
  name: string
  dial: string
}

/**
 * Countries offered on the phone-number inputs. The dial codes mirror
 * `server/utils/phone.ts` and `public.phone_calling_code()` so a number typed
 * in national form resolves to the same E.164 string everywhere.
 */
export const CALLING_COUNTRIES: CallingCountry[] = [
  { code: 'NG', name: 'Nigeria', dial: '234' },
  { code: 'GH', name: 'Ghana', dial: '233' },
  { code: 'KE', name: 'Kenya', dial: '254' },
  { code: 'ZA', name: 'South Africa', dial: '27' },
  { code: 'EG', name: 'Egypt', dial: '20' },
  { code: 'MA', name: 'Morocco', dial: '212' },
  { code: 'US', name: 'United States', dial: '1' },
  { code: 'CA', name: 'Canada', dial: '1' },
  { code: 'GB', name: 'United Kingdom', dial: '44' },
  { code: 'IE', name: 'Ireland', dial: '353' },
  { code: 'DE', name: 'Germany', dial: '49' },
  { code: 'FR', name: 'France', dial: '33' },
  { code: 'ES', name: 'Spain', dial: '34' },
  { code: 'IT', name: 'Italy', dial: '39' },
  { code: 'NL', name: 'Netherlands', dial: '31' },
  { code: 'BE', name: 'Belgium', dial: '32' },
  { code: 'PT', name: 'Portugal', dial: '351' },
  { code: 'SE', name: 'Sweden', dial: '46' },
  { code: 'NO', name: 'Norway', dial: '47' },
  { code: 'DK', name: 'Denmark', dial: '45' },
  { code: 'FI', name: 'Finland', dial: '358' },
  { code: 'PL', name: 'Poland', dial: '48' },
  { code: 'UA', name: 'Ukraine', dial: '380' },
  { code: 'TR', name: 'Türkiye', dial: '90' },
  { code: 'RU', name: 'Russia', dial: '7' },
  { code: 'IN', name: 'India', dial: '91' },
  { code: 'PK', name: 'Pakistan', dial: '92' },
  { code: 'BD', name: 'Bangladesh', dial: '880' },
  { code: 'PH', name: 'Philippines', dial: '63' },
  { code: 'ID', name: 'Indonesia', dial: '62' },
  { code: 'MY', name: 'Malaysia', dial: '60' },
  { code: 'SG', name: 'Singapore', dial: '65' },
  { code: 'TH', name: 'Thailand', dial: '66' },
  { code: 'VN', name: 'Vietnam', dial: '84' },
  { code: 'CN', name: 'China', dial: '86' },
  { code: 'JP', name: 'Japan', dial: '81' },
  { code: 'KR', name: 'South Korea', dial: '82' },
  { code: 'AU', name: 'Australia', dial: '61' },
  { code: 'NZ', name: 'New Zealand', dial: '64' },
  { code: 'BR', name: 'Brazil', dial: '55' },
  { code: 'MX', name: 'Mexico', dial: '52' },
  { code: 'AR', name: 'Argentina', dial: '54' },
  { code: 'CL', name: 'Chile', dial: '56' },
  { code: 'CO', name: 'Colombia', dial: '57' },
  { code: 'PE', name: 'Peru', dial: '51' },
  { code: 'SA', name: 'Saudi Arabia', dial: '966' },
  { code: 'AE', name: 'United Arab Emirates', dial: '971' },
  { code: 'QA', name: 'Qatar', dial: '974' }
]

export const DEFAULT_CALLING_COUNTRY = 'NG'

export const dialCodeFor = (country: string): string | null =>
  CALLING_COUNTRIES.find(entry => entry.code === country.toUpperCase())?.dial ?? null
