/** Shared Ads Manager vocabulary used by the create wizard and the server matcher. */
export type AdObjective = 'ENGAGEMENT' | 'LEADS' | 'SALES'
export type AdGoal = 'AWARENESS' | 'ENGAGEMENT' | 'TRAFFIC' | 'MESSAGES' | 'APP_INSTALLS' | 'INSTANT_FORM' | 'CATALOG_SALES' | 'WEBSITE_CONVERSIONS'
export type ConversionLocation = 'POST' | 'CHAT' | 'WEBSITE' | 'PAGE' | 'APP' | 'INSTANT_FORM' | 'CATALOG'
export type AdPlacement = 'feed' | 'post_detail' | 'profile' | 'page'

export const OBJECTIVES: { value: AdObjective, label: string, description: string, goals: AdGoal[] }[] = [
  { value: 'ENGAGEMENT', label: 'Promotion / Engagement / Traffic', description: 'Likes, comments, gifts, messages, wide viewing and awareness, link clicks and installs.', goals: ['AWARENESS', 'ENGAGEMENT', 'TRAFFIC', 'MESSAGES', 'APP_INSTALLS'] },
  { value: 'LEADS', label: 'Leads', description: 'Collect contact details with an instant form, or get people to message you.', goals: ['INSTANT_FORM', 'MESSAGES'] },
  { value: 'SALES', label: 'Sales', description: 'Drive conversions on your website or sell from a product catalogue.', goals: ['CATALOG_SALES', 'WEBSITE_CONVERSIONS'] }
]

export const GOAL_LABELS: Record<AdGoal, string> = {
  AWARENESS: 'Awareness — reach as many people as possible',
  ENGAGEMENT: 'Post engagement — likes, comments, gifts',
  TRAFFIC: 'Traffic — link clicks',
  MESSAGES: 'Messages — start chats with you',
  APP_INSTALLS: 'App installs',
  INSTANT_FORM: 'Instant form — collect leads in Viorp',
  CATALOG_SALES: 'Catalogue sales',
  WEBSITE_CONVERSIONS: 'Website conversions'
}

export const GOAL_LOCATIONS: Record<AdGoal, ConversionLocation[]> = {
  AWARENESS: ['POST', 'PAGE', 'WEBSITE'],
  ENGAGEMENT: ['POST', 'PAGE'],
  TRAFFIC: ['WEBSITE', 'PAGE', 'POST'],
  MESSAGES: ['CHAT'],
  APP_INSTALLS: ['APP'],
  INSTANT_FORM: ['INSTANT_FORM'],
  CATALOG_SALES: ['CATALOG'],
  WEBSITE_CONVERSIONS: ['WEBSITE']
}

export const LOCATION_LABELS: Record<ConversionLocation, string> = {
  POST: 'On your ad — people interact with a post',
  CHAT: 'Chat message — people message you',
  WEBSITE: 'External website link',
  PAGE: 'A Viorp Page',
  APP: 'App store install link',
  INSTANT_FORM: 'Instant form in Viorp',
  CATALOG: 'Product catalogue'
}

export const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: 'Learn more',
  SHOP_NOW: 'Shop now',
  SIGN_UP: 'Sign up',
  SEND_MESSAGE: 'Send message',
  INSTALL_NOW: 'Install now',
  VIEW_POST: 'View post',
  VISIT_PAGE: 'Visit Page',
  GET_QUOTE: 'Get quote',
  BOOK_NOW: 'Book now',
  CONTACT_US: 'Contact us',
  DOWNLOAD: 'Download',
  ORDER_NOW: 'Order now'
}

export const SPECIAL_CATEGORIES: { value: string, label: string }[] = [
  { value: 'FINANCIAL', label: 'Financial products and services' },
  { value: 'EMPLOYMENT', label: 'Employment' },
  { value: 'HOUSING', label: 'Housing' },
  { value: 'SOCIAL_ISSUES_ELECTIONS_POLITICS', label: 'Social issues, elections or politics' }
]

/** Category A — demographics. */
export const DEMOGRAPHICS: Record<string, { label: string, options: string[] }> = {
  education_levels: { label: 'Education level', options: ['Secondary school', 'Some college', 'Undergraduate', 'Graduate', 'Masters', 'Doctorate'] },
  education_fields: { label: 'Field of study', options: ['Science', 'Engineering', 'Medicine', 'Law', 'Business', 'Arts', 'Education', 'Computing', 'Agriculture', 'Social sciences'] },
  income: { label: 'Income', options: ['Low', 'Middle', 'High'] },
  parents: { label: 'Parents', options: ['Parents of toddlers', 'Parents of teens', 'Parents in their late 40s'] },
  relationship: { label: 'Relationship', options: ['Single', 'Married', 'Divorced', 'In a relationship', 'Engaged', 'Widowed'] },
  job_titles: { label: 'Job title / profession', options: ['Teacher', 'Doctor', 'Nurse', 'Engineer', 'Developer', 'Lawyer', 'Accountant', 'Trader', 'Student', 'Artist', 'Driver', 'Farmer', 'Civil servant', 'Entrepreneur'] },
  industries: { label: 'Employer industry', options: ['Business', 'Technology', 'Health', 'Education', 'Finance', 'Retail', 'Manufacturing', 'Media', 'Government', 'Oil and gas', 'Agriculture', 'Hospitality'] }
}

/** Category B — interests. */
export const INTERESTS: Record<string, string[]> = {
  Activities: ['Sports', 'Football', 'Basketball', 'Games', 'Fitness', 'Wellness', 'Gym', 'Running'],
  'Food and drinks': ['Local foods', 'National dishes', 'Fast food', 'Alcohol', 'Wine', 'Non-alcoholic drinks', 'Fruit and natural drinks', 'Cooking'],
  Hobbies: ['IT', 'Programming', 'Coding', 'Computers', 'Marketing', 'Sales', 'Music', 'Art', 'Travel', 'Cars', 'Luxury', 'Photography', 'Movies'],
  'Shopping and fashion': ['Tech gadgets', 'Luxury wear', 'Local brands', 'Digital gifts', 'Fashion', 'Beauty', 'Sneakers']
}

/** Category C — behaviours. */
export const BEHAVIOURS: { value: string, label: string }[] = [
  { value: 'anniversary_61_90', label: 'Anniversary within 61–90 days' },
  { value: 'high_value_goods', label: 'Prefers high-value goods' },
  { value: 'mid_high_value_goods', label: 'Prefers mid-to-high value goods' },
  { value: 'page_admins', label: 'Viorp Page admins' },
  { value: 'early_adopters', label: 'Early tech adopters' },
  { value: 'console_gamers', label: 'Console gamers' },
  { value: 'canvas_gaming', label: 'Canvas / browser gaming' },
  { value: 'expats', label: 'Expats (live away from home country)' },
  { value: 'engaged_shoppers', label: 'Engaged shoppers (tapped Shop now in the past week)' },
  { value: 'viorp_gifters', label: 'Viorp gifters (sent a gift in the past 30 days)' },
  { value: 'viorp_creators', label: 'Viorp creators (posted in the past 7 days)' },
  { value: 'frequent_travelers', label: 'Frequent travellers' },
  { value: 'international_travelers', label: 'International travellers' },
  { value: 'commuters', label: 'Commuters' }
]

export const DEVICE_OS = ['Android', 'iOS', 'Windows', 'macOS', 'Linux']
export const DEVICE_BRANDS = ['Samsung', 'Tecno', 'Infinix', 'itel', 'Xiaomi', 'Apple', 'Google', 'Oppo', 'Vivo', 'Huawei', 'Nokia']
export const CONNECTIONS = ['wifi', '4g', '5g', '3g']

export interface AdTargeting {
  locations?: string[]
  age_min?: number
  age_max?: number
  genders?: string[]
  demographics?: Record<string, string[]>
  interests?: string[]
  behaviours?: string[]
  os?: string[]
  devices?: string[]
  connections?: string[]
  expand?: boolean
}

export interface AdSchedule {
  days?: number[]
  start_hour?: number
  end_hour?: number
  utc_offset_minutes?: number
}

export interface AdMediaItem {
  url: string
  type: 'image' | 'video'
  headline?: string
  description?: string
  link?: string
}

export interface CatalogItem {
  name: string
  price: string
  image: string
  link: string
}

export interface LeadQuestion {
  label: string
  type: 'text' | 'email' | 'phone' | 'choice'
  options?: string[]
  prefill?: 'full_name' | 'email' | 'phone' | 'location'
}

export interface AdView {
  id: string
  title: string
  advertiser: { id: string, type: 'USER' | 'PAGE', name: string, handle: string, avatar_url: string | null, is_verified: boolean }
  objective: AdObjective
  goal: AdGoal
  conversionLocation: ConversionLocation
  format: 'SINGLE' | 'CAROUSEL'
  media: AdMediaItem[]
  primaryText: string | null
  headline: string | null
  cta: string
  destinationUrl: string | null
  postId: string | null
  pageHandle: string | null
  leadForm: { intro?: string, questions: LeadQuestion[], privacy_url?: string } | null
  catalog: CatalogItem[]
  /** Kept for the legacy feed slot renderer. */
  creativeUrl: string | null
  advertiserId: string
}
