<template>
  <div class="history-page">
    <h1>📹 Stream History</h1>
    <div class="streams-list">
      <div v-for="stream in streams" :key="stream.id" class="stream-card">
        <img :src="stream.thumbnail_url" :alt="stream.title" />
        <h3>{{ stream.title }}</h3>
        <p>{{ formatDate(stream.started_at) }}</p>
        <p>Duration: {{ formatDuration(stream.duration) }}</p>
        <p>Viewers: {{ stream.viewer_count }}</p>
        <button @click="viewStream(stream.id)">View</button>
      </div>
    </div>
  </div>
</template>
