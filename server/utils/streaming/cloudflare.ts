interface CloudflareLiveInput {
  uid: string
  webRTC?: { url: string }
  webRTCPlayback?: { url: string }
}

interface CloudflareResponse {
  success: boolean
  errors?: { message: string }[]
  result?: CloudflareLiveInput
}

export interface LiveInput {
  inputId: string
  ingestUrl: string
  playbackUrl: string
}

/**
 * Creates a Cloudflare Stream live input, which returns the WHIP ingest and
 * WHEP playback endpoints the browser talks to directly. Cloudflare fans the
 * stream out from there, so audience size is bounded by their edge, not by the
 * broadcaster's uplink.
 */
export const createCloudflareLiveInput = async (
  accountId: string,
  apiToken: string,
  name: string
): Promise<LiveInput> => {
  const response = await $fetch<CloudflareResponse>(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}` },
      body: {
        meta: { name },
        recording: { mode: 'automatic', requireSignedURLs: false }
      }
    }
  )

  const input = response.result
  if (!response.success || !input?.webRTC?.url || !input.webRTCPlayback?.url) {
    throw new Error(response.errors?.[0]?.message || 'Cloudflare did not return a WebRTC live input')
  }

  return {
    inputId: input.uid,
    ingestUrl: input.webRTC.url,
    playbackUrl: input.webRTCPlayback.url
  }
}

export const deleteCloudflareLiveInput = async (
  accountId: string,
  apiToken: string,
  inputId: string
): Promise<void> => {
  await $fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs/${inputId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${apiToken}` } }
  )
}
