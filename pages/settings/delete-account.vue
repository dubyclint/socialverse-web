<template>
  <div class="delete-account">
    <h1>Delete your Viorp account</h1>

    <p class="lede">
      Deleting your account permanently removes your profile, posts, messages and connections. This
      cannot be undone.
    </p>

    <ul class="requirements">
      <li>Your wallet balance must be zero — withdraw or spend remaining PEW first.</li>
      <li>All P2P trades and escrows must be released or cancelled.</li>
      <li>Deletion is immediate; you will be signed out on every device.</li>
    </ul>

    <p class="lede">
      You can also request deletion without signing in by emailing
      <a href="mailto:privacy@viorp.com">privacy@viorp.com</a> from your registered address.
    </p>

    <form class="confirm" @submit.prevent="submit">
      <label for="confirm">Type <strong>DELETE</strong> to confirm</label>
      <input id="confirm" v-model="confirm" autocomplete="off" placeholder="DELETE" />

      <label for="reason">Reason (optional)</label>
      <textarea id="reason" v-model="reason" rows="3" maxlength="500"></textarea>

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit" class="danger" :disabled="confirm !== 'DELETE' || busy">
        {{ busy ? 'Deleting…' : 'Delete my account' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const confirm = ref('')
const reason = ref('')
const busy = ref(false)
const error = ref('')

const supabase = useSupabaseClient()
const router = useRouter()

const messageOf = (err: unknown) =>
  typeof err === 'object' && err && 'statusMessage' in err
    ? String((err as { statusMessage?: string }).statusMessage)
    : err instanceof Error
      ? err.message
      : 'Account deletion failed'

const submit = async () => {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/account/delete', {
      method: 'POST',
      body: { confirm: confirm.value, reason: reason.value || undefined }
    })
    await supabase.auth.signOut()
    await router.push('/')
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    busy.value = false
  }
}

useHead({ title: 'Delete Account - Viorp' })
</script>

<style scoped>
.delete-account {
  max-width: 620px;
  margin: 0 auto;
  padding: var(--space-lg, 24px);
  color: var(--text-primary, #f0fffb);
}

h1 {
  font-family: var(--font-heading);
  margin-bottom: var(--space-md, 16px);
}

.lede,
.requirements {
  color: var(--text-muted, #9fb3ad);
  margin-bottom: var(--space-md, 16px);
}

.requirements {
  padding-left: 1.2rem;
  list-style: disc;
}

.confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm, 8px);
  background: var(--bg-card, #0a0f1e);
  border: 1px solid var(--border-subtle, #1f2937);
  border-radius: var(--radius-md, 16px);
  padding: var(--space-lg, 24px);
}

input,
textarea {
  background: var(--bg-app, #121827);
  border: 1px solid var(--border-subtle, #1f2937);
  border-radius: var(--radius-sm, 8px);
  color: inherit;
  padding: 0.6rem 0.75rem;
}

.danger {
  margin-top: var(--space-sm, 8px);
  background: var(--error, #ff2e88);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg, 24px);
  padding: 0.7rem 1rem;
  font-weight: 600;
  cursor: pointer;
}

.danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: var(--error, #ff2e88);
}
</style>
