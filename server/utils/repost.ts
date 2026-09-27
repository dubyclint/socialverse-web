/**
 * A repost is a normal post row that points at the post it republishes. The
 * reference is carried in `posts.title` as `repost:<uuid>` because the table
 * has no dedicated column; `buildRepostRef`/`parseRepostRef` are the only
 * places that encoding is known, so moving it to a real column later is a
 * change to these two functions.
 */
const REPOST_PREFIX = 'repost:'

export const buildRepostRef = (postId: string): string => `${REPOST_PREFIX}${postId}`

export const parseRepostRef = (title: string | null | undefined): string | null => {
  if (!title || !title.startsWith(REPOST_PREFIX)) return null
  const id = title.slice(REPOST_PREFIX.length).trim()
  return id.length ? id : null
}
