<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Escrow Dispute Dashboard</h1>
    
    <div v-for="dispute in disputes" :key="dispute.id" class="border p-4 mb-4 rounded-lg">
      <p><strong>Reason:</strong> {{ dispute.reason }}</p>
      <div class="mt-4 flex gap-2">
        <button @click="resolve(dispute, 'released')" class="bg-green-600 text-white px-4 py-2 rounded">Release to Seller</button>
        <button @click="resolve(dispute, 'refunded')" class="bg-red-600 text-white px-4 py-2 rounded">Refund Buyer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'admin' })
  
const supabase = useSupabaseClient()
const disputes = ref([])
  
onMounted(() => {
  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'escrow_disputes' },
      (payload) => {
        // Automatically add the new dispute to the list
        disputes.value.push(payload.new)
      }
    )
    .subscribe()

  // Cleanup on unmount
  onUnmounted(() => {
    supabase.removeChannel(channel)
  })
})

// Fetch open disputes
const { data } = await supabase.from('escrow_disputes').select('*').eq('status', 'open')
disputes.value = data

// Call the secure Edge Function for resolution
async function resolve(dispute, action) {
  const { data, error } = await $fetch('/api/admin/resolve-dispute', {
    method: 'POST',
    body: { 
      transactionId: dispute.transaction_id, 
      disputeId: dispute.id, 
      action 
    }
  })
  if (!error) alert('Dispute resolved successfully!')
}
</script>
