// Global browser/runtime augmentations that are not covered by library types.
export {}

declare global {
  interface Window {
    ethereum?: import('ethers').Eip1193Provider
    Hls?: unknown
    __appPluginReady?: boolean
  }

  // Media capture extensions used by mobile camera streaming (torch/flash).
  interface MediaTrackCapabilities {
    torch?: boolean
  }

  interface MediaTrackConstraintSet {
    torch?: boolean
  }
}
