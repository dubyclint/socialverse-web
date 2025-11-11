<template>
  <div>
    <adminuserlist />
    <adminpostmoderation />
    <adminmatchapproval />
    <adminescrowcontrol />
    <adminfeemanager />
  </div>
</template>

<script setup>
import adminuserlist from '@/components/admin/user-list.vue'
import adminpostmoderation from '@/components/admin/post-moderation.vue'
import adminmatchapproval from '@/components/admin/match-approval.vue'
import adminescrowcontrol from '@/components/admin/escrow-control.vue'
import adminfeeManager from '@/components/admin/fee-manager.vue'
</script>
