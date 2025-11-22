<template>
  <div>
    <h3>Find a Group</h3>

    <form @submit.prevent="submit">
      <label>Group Size</label>
      <select v-model="filters.size">
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>

      <label>Region</label>
      <select v-model="filters.region">
        <option value="">Any</option>
        <option value="Rivers State">Rivers State</option>
        <option value="Lagos">Lagos</option>
        <option value="Nairobi">Nairobi</option>
      </select>

      <label>Trade Category</label>
      <select v-model="filters.category">
        <option value="">Any</option>
        <option value="electronics">Electronics</option>
        <option value="crypto">Crypto</option>
        <option value="fashion">Fashion</option>
      </select>

      <button type="submit">Find Group</button>
    </form>

    <div v-for="group in groups" :key="group.groupScore" class="group-card">
      <p>Group Score: {{ group.groupScore }}</p>
      <div class="members">
        <div v-for="member in group.members" :key="member.id" class="member">
          <img :src="member.avatar" />
          <p>{{ member.username }} ({{ member.rank }}) <span v-if="member.isVerified">✔</span></p>
        </div>
      </div>
      <button @click="startGroupChat(group.members)">Start Group Chat</button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
 
import { ref } from 'vue'

const filters = ref({ size: 4, region: '', category: '' })
const groups = ref([])

async function submit() {
  const query = new URLSearchParams(filters.value).toString()
  const res = await fetch(`/api/match/group?${query}`)
  groups.value = await res.json()
}

function startGroupChat(members) {
  const ids = members.map(m => m.id).join(',')
  window.location.href = `/chat/group?members=${ids}`
}
</script>

<style scoped>
.group-card {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
}
.members {
  display: flex;
  gap: 1rem;
}
.member img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
</style>
