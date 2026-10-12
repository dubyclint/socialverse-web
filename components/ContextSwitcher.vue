<template>
  <div class="ctx">
    <button type="button" class="ctx-trigger" :aria-label="`Acting as ${active?.name ?? 'you'}`" @click="open = !open">
      <img :src="active?.avatar || '/default-avatar.svg'" alt="" class="ctx-avatar" />
      <span v-if="context.isPage" class="ctx-badge">PAGE</span>
    </button>
    <div v-if="open" class="ctx-backdrop" @click="open = false" />
    <div v-if="open" class="ctx-menu" role="menu">
      <p class="ctx-title">Act as</p>
      <button v-if="context.user" type="button" class="ctx-item" :class="{ on: !context.isPage }" @click="pick(null)">
        <img :src="context.user.avatar" alt="" class="ctx-avatar" />
        <span class="ctx-name">{{ context.user.name }}<small>Personal profile</small></span>
      </button>
      <button v-for="page in context.managedPages" :key="page.id" type="button" class="ctx-item" :class="{ on: active?.id === page.id }" @click="pick(page.id)">
        <img :src="page.avatar_url || '/default-avatar.svg'" alt="" class="ctx-avatar" />
        <span class="ctx-name">{{ page.name }}<small>{{ page.role.toLowerCase() }} · @{{ page.handle }}</small></span>
      </button>
      <NuxtLink to="/pages" class="ctx-link" @click="open = false">Manage Pages</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContextStore } from '~/stores/context'

const context = useContextStore()
const open = ref(false)
const active = computed(() => context.activeActor)

const pick = (pageId: string | null) => {
  if (pageId) context.switchToPage(pageId)
  else context.switchTo(null)
  open.value = false
}
</script>

<style scoped>
.ctx { position: relative; }
.ctx-trigger { position: relative; background: none; border: none; padding: 0; cursor: pointer; display: flex; }
.ctx-avatar { width: 34px; height: 34px; border-radius: 999px; object-fit: cover; flex-shrink: 0; }
.ctx-badge { position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); background: #f59e0b; color: #111; font-size: 8px; font-weight: 800; border-radius: 4px; padding: 0 3px; }
.ctx-backdrop { position: fixed; inset: 0; z-index: 90; }
.ctx-menu { position: absolute; right: 0; top: 44px; z-index: 91; width: 260px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 8px; box-shadow: 0 12px 30px rgba(0,0,0,.4); }
.ctx-title { color: #94a3b8; font-size: 12px; padding: 4px 8px; }
.ctx-item { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 48px; background: none; border: none; color: #e2e8f0; text-align: left; padding: 6px 8px; border-radius: 8px; cursor: pointer; }
.ctx-item.on, .ctx-item:hover { background: #334155; }
.ctx-name { display: flex; flex-direction: column; min-width: 0; font-weight: 600; font-size: 14px; }
.ctx-name small { color: #94a3b8; font-weight: 400; font-size: 12px; }
.ctx-link { display: block; text-align: center; color: #60a5fa; padding: 8px; font-size: 13px; }
</style>
