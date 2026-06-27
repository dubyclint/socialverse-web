<!-- ============================================================================
     FILE: /pages/admin/algorithm.vue
     Algorithmic Recommendation Engine Control Hub & Mathematical Guardrails Panel
     ============================================================================ -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: ['auth'] // Ensure only authenticated administrators can access
})

const supabase = useSupabaseClient()

// Core Reactive States for Tuning Weights
const weights = ref({
  interest_match_weight: 0.50,
  geographic_proximity_weight: 0.25,
  interaction_history_weight: 0.25,
  min_similarity_threshold: 0.60,
  max_recommendation_limit: 20
})

const initialWeights = ref<any>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// HARDENED VALIDATION MATRIX (Guardrails preventing mathematical out-of-bound errors)
const validationErrors = computed(() => {
  const errors: string[] = []
  
  // Rule 1: Multiplier Weights must equal exactly 1.00 when combined (100% distribution allocation)
  const totalWeight = weights.value.interest_match_weight + 
                      weights.value.geographic_proximity_weight + 
                      weights.value.interaction_history_weight
                      
  // Using an epsilon delta check to avoid floating-point approximation bugs
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    errors.push(`Total allocation weights must sum up to exactly 1.00 (Current total: ${totalWeight.toFixed(2)})`)
  }

  // Rule 2: Similarity boundaries must live between 0.0 and 1.0
  if (weights.value.min_similarity_threshold < 0.1 || weights.value.min_similarity_threshold > 0.95) {
    errors.push('Minimum Similarity Threshold must be bounded securely between 0.10 and 0.95 to protect user matching indexing loops.')
  }

  // Rule 3: Recommendation limits must remain stable
  if (weights.value.max_recommendation_limit < 5 || weights.value.max_recommendation_limit > 100) {
    errors.push('Max recommendation limits must remain bounded between 5 and 100 entities per background process batch.')
  }

  return errors
})

const isFormInvalid = computed(() => validationErrors.value.length > 0)

// Fetch active weights out of system settings store table
const fetchAlgorithmConfigurations = async () => {
  try {
    isLoading.value = true
    errorMessage.value = null
    
    const { data, error } = await supabase
      .from('platform_configurations')
      .select('*')
      .eq('config_key', 'algorithmic_matching_weights')
      .single()

    if (error && error.code !== 'PGRST116') throw error // Ignore missing row error to allow initial setup
    
    if (data && data.config_values) {
      weights.value = { ...data.config_values }
      initialWeights.value = { ...data.config_values }
    }
  } catch (err: any) {
    console.error('❌ Failed to pull platform matrix thresholds:', err.message)
    errorMessage.value = 'Failed to accurately retrieve target configurations from database.'
  } finally {
    isLoading.value = false
  }
}

// Persist the verified parameters back down safely
const saveAlgorithmConfigurations = async () => {
  if (isFormInvalid.value) return
  
  isSaving.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const { error } = await supabase
      .from('platform_configurations')
      .upsert({
        config_key: 'algorithmic_matching_weights',
        config_values: weights.value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'config_key' })

    if (error) throw error
    
    successMessage.value = 'Algorithmic matching constraints verified and deployed globally successfully!'
    initialWeights.value = { ...weights.value }
  } catch (err: any) {
    console.error('❌ Insertion constraint error inside config schema:', err.message)
    errorMessage.value = `Failed to commit updates to production rules: ${err.message}`
  } finally {
    isSaving.value = false
  }
}

const resetToPreviousSavedState = () => {
  if (initialWeights.value) {
    weights.value = { ...initialWeights.value }
  }
}

onMounted(() => {
  fetchAlgorithmConfigurations()
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
    <div class="max-w-4xl mx-auto space-y-8">
      
      <!-- Top Section Header Context -->
      <div class="border-b border-slate-800 pb-6">
        <h1 class="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          ⚙️ Algorithmic Weight Configuration Node
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          Tune matching vectors, baseline affinity filters, and systemic recommendation thresholds with structural code-level guardrails.
        </p>
      </div>

      <!-- Loading State Panel -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-12 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div class="w-6 h-6 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
        <p class="font-mono text-[11px] text-slate-500">Mapping working vectors and current matrix parameters...</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Side Form Column Area (Tuning Controls) -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
            <h3 class="text-sm font-black text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
              Linear Matching Multipliers
            </h3>

            <!-- Metric Parameter 1: Interest Vectors -->
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <label class="font-bold text-slate-300">Shared Interest Matching Weight</label>
                <span class="font-mono text-indigo-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {{ (weights.interest_match_weight * 100).toFixed(0) }}%
                </span>
              </div>
              <input 
                v-model.number="weights.interest_match_weight" 
                type="range" min="0" max="1" step="0.05"
                class="w-full accent-indigo-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
              />
              <p class="text-[10px] text-slate-500">Priority scale placed on overlapping system taxonomy categories and preference nodes.</p>
            </div>

            <!-- Metric Parameter 2: Geographic Affinity -->
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <label class="font-bold text-slate-300">Geographic Proximity Multiplier</label>
                <span class="font-mono text-indigo-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {{ (weights.geographic_proximity_weight * 100).toFixed(0) }}%
                </span>
              </div>
              <input 
                v-model.number="weights.geographic_proximity_weight" 
                type="range" min="0" max="1" step="0.05"
                class="w-full accent-indigo-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
              />
              <p class="text-[10px] text-slate-500">Influence score applied to physical localized regional clusters.</p>
            </div>

            <!-- Metric Parameter 3: Interaction Spikes -->
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <label class="font-bold text-slate-300">Historical Interaction Recency Weight</label>
                <span class="font-mono text-indigo-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {{ (weights.interaction_history_weight * 100).toFixed(0) }}%
                </span>
              </div>
              <input 
                v-model.number="weights.interaction_history_weight" 
                type="range" min="0" max="1" step="0.05"
                class="w-full accent-indigo-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
              />
              <p class="text-[10px] text-slate-500">Weights conversion rates and chat interactions discovered over active historical session timelines.</p>
            </div>

            <h3 class="text-sm font-black text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2 pt-2">
              Threshold Bounds & Batch Clamps
            </h3>

            <!-- Threshold Multiplier Input Check -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-slate-400">Min Similarity Score ($T_s$)</label>
                <input 
                  v-model.number="weights.min_similarity_threshold" 
                  type="number" step="0.01" min="0.1" max="0.95"
                  class="w-full bg-slate-950 text-xs font-mono border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-slate-700" 
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-slate-400">Max Recommendation Batch Limit</label>
                <input 
                  v-model.number="weights.max_recommendation_limit" 
                  type="number" step="1" min="5" max="100"
                  class="w-full bg-slate-950 text-xs font-mono border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-slate-700" 
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side Monitoring Widget (Real-time Guardrail Diagnostics Dashboard) -->
        <div class="space-y-4 flex flex-col h-full">
          <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 flex-1">
            <h3 class="text-xs font-black text-slate-200 uppercase tracking-wider tracking-wide">
              System Guardrail Status
            </h3>

            <!-- Status Indicator Badge -->
            <div :class="['p-3 rounded-lg border font-mono text-[11px] font-bold text-center', isFormInvalid ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20']">
              {{ isFormInvalid ? '❌ Guardrail Infraction Detected' : '✅ Configuration Safe' }}
            </div>

            <!-- Dynamic Error Ledger Output -->
            <div v-if="isFormInvalid" class="space-y-2">
              <p class="text-[10px] uppercase font-black tracking-wider text-rose-400">Errors Preventing Commit:</p>
              <ul class="space-y-1.5 list-disc pl-4 text-[11px] text-slate-400 leading-relaxed">
                <li v-for="err in validationErrors" :key="err" class="text-slate-300">
                  {{ err }}
                </li>
              </ul>
            </div>

            <div v-else class="text-[11px] text-slate-500 leading-relaxed font-mono">
              All active variables fall within mathematical parameters. Changes will execute dynamically across search queries upon deployment confirmation.
            </div>

            <!-- Toast-Style Interaction Notice Prompts -->
            <div v-if="successMessage" class="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-lg font-medium">
              {{ successMessage }}
            </div>
            <div v-if="errorMessage" class="bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-lg font-medium">
              {{ errorMessage }}
            </div>

            <!-- Form Action Footer Button Blocks -->
            <div class="pt-4 border-t border-slate-800 space-y-2">
              <button 
                @click="saveAlgorithmConfigurations"
                :disabled="isFormInvalid || isSaving"
                class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-950 disabled:text-slate-700 text-white font-bold text-xs p-3 rounded-lg transition-all shadow"
              >
                {{ isSaving ? 'Committing Changes...' : 'Deploy Configurations' }}
              </button>
              <button 
                @click="resetToPreviousSavedState"
                :disabled="isSaving"
                class="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs p-3 rounded-lg transition-colors"
              >
                Reset Changes
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  </main>
</template>
