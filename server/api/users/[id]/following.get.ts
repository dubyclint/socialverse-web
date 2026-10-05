import { defineEventHandler } from 'h3'
import { listFollowGraph } from '~/server/utils/follow-list'

export default defineEventHandler(event => listFollowGraph(event, 'following'))
