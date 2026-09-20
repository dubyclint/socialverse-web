<!-- components/chat/contact-sync-modal.vue -->
<template>
  <div class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Find PALs from contacts</h3>
        <button class="close-btn" :disabled="syncing" @click="handleClose">
          <Icon name="x" size="20" />
        </button>
      </div>

      <div class="modal-body">
        <div v-if="!completed" class="sync-info">
          <Icon name="users" size="40" class="info-icon" />
          <p class="info-text">
            We match your contacts against Viorp accounts so you can chat with people you
            already know.
          </p>
          <p class="info-subtext">
            Numbers are hashed on our server and the original numbers are never stored.
          </p>

          <button
            v-if="canPick"
            class="btn btn-primary block"
            :disabled="syncing"
            @click="syncDevice"
          >
            {{ syncing ? 'Syncing…' : 'Use my phone contacts' }}
          </button>

          <div class="manual">
            <button class="link-btn" @click="showManual = !showManual">
              {{ showManual ? 'Hide manual entry' : (canPick ? 'Or enter numbers manually' : 'Enter numbers to check') }}
            </button>
            <template v-if="showManual || !canPick">
              <textarea
                v-model="manualInput"
                class="manual-input"
                rows="5"
                placeholder="One per line, e.g.&#10;Ada, +2348012345678&#10;+447700900123"
              ></textarea>
              <button
                class="btn btn-primary block"
                :disabled="syncing || !manualInput.trim()"
                @click="syncManual"
              >
                {{ syncing ? 'Syncing…' : 'Check these numbers' }}
              </button>
            </template>
          </div>

          <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        </div>

        <div v-else class="sync-completed">
          <Icon name="check-circle" size="40" class="success-icon" />
          <p class="success-text">{{ savedCount }} contacts synced</p>
          <p class="success-subtext">
            {{ matchedCount }} {{ matchedCount === 1 ? 'is' : 'are' }} already on Viorp
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button v-if="!completed" class="btn btn-secondary" :disabled="syncing" @click="handleClose">
          Cancel
        </button>
        <button v-else class="btn btn-primary" @click="handleClose">Done</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Icon from '@/components/ui/icon.vue'
import { useContacts } from '~/composables/use-contacts'

const emit = defineEmits<{
  close: []
  synced: [payload: { saved: number, matched: number }]
}>()

const { syncing, pickerAvailable, syncFromDevice, syncFromText } = useContacts()

const canPick = pickerAvailable()
const showManual = ref(false)
const manualInput = ref('')
const completed = ref(false)
const savedCount = ref(0)
const matchedCount = ref(0)
const errorMessage = ref('')

const finish = (result: { saved: number, matched: number }): void => {
  savedCount.value = result.saved
  matchedCount.value = result.matched
  completed.value = true
  emit('synced', result)
}

const run = async (task: () => Promise<{ saved: number, matched: number }>): Promise<void> => {
  errorMessage.value = ''
  try {
    finish(await task())
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Contact sync failed'
  }
}

const syncDevice = (): Promise<void> => run(syncFromDevice)
const syncManual = (): Promise<void> => run(() => syncFromText(manualInput.value))

const handleClose = (): void => {
  if (!syncing.value) emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card, #0A0F1E);
  color: var(--text-primary, #F0FFFB);
  border: 1px solid var(--color-dark-grey, #1F2937);
  border-radius: 16px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-dark-grey, #1F2937);
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
}

.modal-body {
  padding: 24px 20px;
  text-align: center;
}

.sync-info,
.sync-completed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.info-icon,
.success-icon {
  color: var(--accent, #6FFFD4);
}

.info-text {
  margin: 0;
  font-size: 15px;
}

.info-subtext,
.success-subtext {
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
}

.manual {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.manual-input {
  width: 100%;
  resize: vertical;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--color-dark-grey, #1F2937);
  background: var(--bg-app, #121827);
  color: inherit;
  font-size: 14px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent, #6FFFD4);
  cursor: pointer;
  font-size: 13px;
}

.error-text {
  margin: 0;
  font-size: 13px;
  color: var(--color-error, #FF2E88);
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-dark-grey, #1F2937);
  justify-content: flex-end;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn.block {
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent, #6FFFD4);
  color: var(--text-on-accent, #0A0F1E);
}

.btn-secondary {
  background: transparent;
  color: inherit;
  border: 1px solid var(--color-dark-grey, #1F2937);
}
</style>
