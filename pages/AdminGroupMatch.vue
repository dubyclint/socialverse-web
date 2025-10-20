<template>
  <div>
    <h3>Admin Group Override</h3>

    <form @submit.prevent="submitOverride">
      <label>Force Match User IDs (comma-separated)</label>
      <input v-model="overrideGroup" placeholder="user123,user456,user789" />

      <button type="submit">Force Match</button>
    </form>

    <div v-if="group">
      <h4>Override Group</h4>
      <p>Group Score: {{ group.groupScore }}</p>
      <div class="members">
        <div v-for="member in group.members" :key="member.id" class="member">
          <img :src="member.avatar" />
          <p>{{ member.username }} ({{ member.rank }}) <span v-if="member.isVerified">✔</span></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const overrideGroup = ref('')
const group = ref(null)

async function submitOverride() {
  const res = await fetch(`/api/match/group?overrideGroup=${overrideGroup.value}`)
  const data = await res.json()
  group.value = data[0]
}
</script>

<style scoped>
.member img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.members {
  display: flex;
  gap: 1rem;
}
</style>
