 // components/TransferModal.vue   
<template>
  <div class="modal">
    <input v-model="recipient" placeholder="Recipient ID" />
    <input v-model="amount" type="number" placeholder="Amount" />
    <button :disabled="wallet.loading" @click="handleTransfer">
      {{ wallet.loading ? 'Sending...' : 'Confirm Transfer' }}
    </button>
  </div>
</template>

<script setup>
const wallet = useWalletStore()
const amount = ref(0)
const recipient = ref('')

const handleTransfer = async () => {
  try {
    await wallet.performTransfer(recipient.value, amount.value, 'gift')
    // Close modal and show success toast
    emit('close')
  } catch (e) {
    // Error is handled by the store, UI will rollback
    console.error("Transfer failed", e)
  }
}
</script>
