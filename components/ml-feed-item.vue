<template>
  <div 
    class="ml-feed-item"
    :data-item-id="item.id"
    :data-item-type="item.type"
    @click="handleClick"
    v-intersection-observer="handleVisibility"
  >
    <!-- Content Item -->
    <div v-if="item.type === 'content'" class="content-item">
      <PostCard 
        :post="item" 
        @like="handleLike"
        @comment="handleComment"
        @share="handleShare"
      />
    </div>

    <!-- Ad Item -->
    <div v-else-if="item.type === 'ad'" class="ad-item">
      <AdCard 
        :ad="item"
        @click="handleAdClick"
        @impression="handleAdImpression"
        @conversion="handleAdConversion"
      />
    </div>

    <!-- ML Metadata (dev mode only) -->
    <div v-if="showMLMetadata" class="ml-metadata">
      <div class="metadata-item">
        <span>Score:</span>
        <span>{{ item.score?.toFixed(3) }}</span>
      </div>
      <div class="metadata-item">
        <span>Source:</span>
        <span>{{ item.source }}</span>
      </div>
      <div v-if="item.explorationMode" class="metadata-item exploration">
        <span>🔬 Exploration Mode</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  feedGenerationId: {
    type: String
  }
})

const { trackInteraction } = useMLFeed()
const showMLMetadata = ref(process.dev)

const viewStartTime = ref(null)
const isVisible = ref(false)

onMounted(() => {
  viewStartTime.value = Date.now()
})

const handleVisibility = (entries) => {
  const entry = entries[0]
  isVisible.value = entry.isIntersecting
  
  if (entry.isIntersecting && !viewStartTime.value) {
    viewStartTime.value = Date.now()
    
    // Track impression
    trackInteraction({
      itemId: props.item.id,
      itemType: props.item.type,
      type: 'view',
      position: props.position,
      feedGenerationId: props.feedGenerationId,
      banditContext: props.item.banditContext,
      campaignId: props.item.campaignId,
      experimentId: props.item.experimentId,
      experimentAssignment: props.item.experimentAssignment
    })
  }
}

const handleClick = () => {
  const duration = viewStartTime.value ? Date.now() - viewStartTime.value : 0
  
  trackInteraction({
    itemId: props.item.id,
    itemType: props.item.type,
    type: 'click',
    duration,
    position: props.position,
    feedGenerationId: props.feedGenerationId,
    banditContext: props.item.banditContext
  })
}

const handleLike = () => {
  const duration = viewStartTime.value ? Date.now() - viewStartTime.value : 0
  
  trackInteraction({
    itemId: props.item.id,
    itemType: props.item.type,
    type: 'like',
    duration,
    position: props.position,
    feedGenerationId: props.feedGenerationId
  })
}

const handleComment = () => {
  trackInteraction({
    itemId: props.item.id,
    itemType: props.item.type,
    type: 'comment',
    position: props.position,
    feedGenerationId: props.feedGenerationId
  })
}

const handleShare = () => {
  trackInteraction({
    itemId: props.item.id,
    itemType: props.item.type,
    type: 'share',
    position: props.position,
    feedGenerationId: props.feedGenerationId
  })
}

const handleAdClick = () => {
  const duration = viewStartTime.value ? Date.now() - viewStartTime.value : 0
  
  trackInteraction({
    itemId: props.item.id,
    itemType: 'ad',
    type: 'click',
    duration,
    position: props.position,
    feedGenerationId: props.feedGenerationId,
    campaignId: props.item.campaignId,
    cpc: props.item.actualPrice,
    experimentId: props.item.experimentId,
    experimentAssignment: props.item.experimentAssignment
  })
}

const handleAdImpression = () => {
  // Already handled in handleVisibility for ads
}

const handleAdConversion = (conversionValue) => {
  trackInteraction({
    itemId: props.item.id,
    itemType: 'ad',
    type: 'conversion',
    position: props.position,
    feedGenerationId: props.feedGenerationId,
    campaignId: props.item.campaignId,
    conversionValue,
    experimentId: props.item.experimentId,
    experimentAssignment: props.item.experimentAssignment
  })
}

// Track dwell time when component is unmounted
onUnmounted(() => {
  if (viewStartTime.value && isVisible.value) {
    const duration = Date.now() - viewStartTime.value
    
    // Only track if user spent significant time
    if (duration > 1000) { // 1 second minimum
      trackInteraction({
        itemId: props.item.id,
        itemType: props.item.type,
        type: 'dwell',
        duration,
        position: props.position,
        feedGenerationId: props.feedGenerationId
      })
    }
  }
})
</script>

<style scoped>
.ml-feed-item {
  margin-bottom: 16px;
  position: relative;
}

.ml-metadata {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.metadata-item.exploration {
  color: #fbbf24;
  font-weight: bold;
}

.ad-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.content-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}
</style>
