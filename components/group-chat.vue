<template>
  <div class="group-chat" v-if="!userProfile.chatDisabled">
    <div class="header">
      <h2>{{ groupMeta?.name || groupId }}</h2>
      <span v-if="groupMeta?.blocked" class="badge blocked">Blocked</span>
      <span v-if="groupMeta?.deleted" class="badge deleted">Deleted</span>
    </div>

    <div class="admin-tools" v-if="isOwner && !groupMeta?.deleted">
      <form @submit.prevent="inviteMember" class="invite-form">
        <input v-model="inviteUserId" placeholder="Invite user ID" />
        <button type="submit">Invite</button>
      </form>
      <div class="members">
        <h4>Members</h4>
        <ul>
          <li v-for="m in members" :key="m">
            {{ m }}
            <button class="remove" @click="removeMember(m)" :disabled="m === ownerId">Remove</button>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="groupMeta?.deleted" class="notice">This group has been deleted.</div>
    <div v-else-if="groupMeta?.blocked" class="notice">This group is blocked by admin.</div>
    <div v-else>
      <ul class="messages">
        <li v-for="msg in messages" :key="msg.id">
          <img v-if="msg.avatar" :src="msg.avatar" class="avatar" />
          <div class="bubble">
            <div class="meta">
              <strong>{{ msg.from }}</strong>
              <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
            </div>
            <div class="content" v-html="renderContent(msg.text)"></div>
          </div>
        </li>
      </ul>

      <form @submit.prevent="sendMessage" class="send-form">
        <textarea v-model="draft" placeholder="Type a message..." />
        <button type="submit" :disabled="sending">Send</button>
      </form>
    </div>
  </div>

  <div v-else class="notice">Your chat privileges have been disabled by an admin.</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';
import MarkdownIt from 'markdown-it';
import EmojiConvertor from 'emoji-js';

const md = new MarkdownIt({ breaks: true, linkify: true });
const emoji = new EmojiConvertor();
emoji.img_set = 'emojione';
emoji.img_sets.emojione.path = 'https://cdn.jsdelivr.net/emojione/assets/4.5/png/64/';

const props = defineProps<{ groupId: string }>();
const groupId = props.groupId;

const { data: session } = useAuth();
const currentUser = session.value?.user?.id;
const isAdmin = computed(() => session.value?.user?.role === 'admin');

const ownerId = ref<string | null>(null);
const groupMeta = ref<any>(null);
const userProfile = ref<any>({});
const members = ref<string[]>([]);
const messages = ref<any[]>([]);
const draft = ref('');
const sending = ref(false);

const inviteUserId = ref('');
const isOwner = computed(() => currentUser && ownerId.value === currentUser);

function formatTime(ts: number) {
  return new Date(ts).toLocaleString();
}

function renderContent(text: string) {
  const html = md.render(text || '');
  return emoji.replace_colons(html);
}

function inviteMember() {
  // Implementation needed
}

function removeMember(memberId: string) {
  // Implementation needed
}

function sendMessage() {
  // Implementation needed
}

onMounted(() => {
  // Load group data
});
</script>

<style scoped>
.group-chat {
  padding: 1rem;
}
.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}
.blocked { background: #ff6b6b; color: white; }
.deleted { background: #868e96; color: white; }
.notice {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  text-align: center;
}
</style>
