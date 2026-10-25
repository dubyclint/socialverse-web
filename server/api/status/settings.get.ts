import { getStatusSettings } from '~/server/utils/status-settings'

export default defineEventHandler(() => getStatusSettings())
