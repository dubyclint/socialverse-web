<template>
  <div>
    <AdminUserList />
    <AdminPostModeration />
    <AdminMatchApproval />
    <AdminEscrowControl />
    <AdminFeeManager />
  </div>
</template>

<script setup>
import AdminUserList from '@/components/AdminUserList.vue'
import AdminPostModeration from '@/components/AdminPostModeration.vue'
import AdminMatchApproval from '@/components/AdminMatchApproval.vue'
import AdminEscrowControl from '@/components/AdminEscrowControl.vue'
import AdminFeeManager from '@/components/AdminFeeManager.vue'
</script>
