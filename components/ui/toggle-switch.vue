<!-- components/ui/ToggleSwitch.vue -->
<template>
  <label class="toggle-switch">
    <input 
      type="checkbox" 
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span class="toggle-slider"></span>
  </label>
</template>

<script setup>
// Props
const props = defineProps({
  modelValue: Boolean
})

// Emits
const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.2s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #1976d2;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

input:focus + .toggle-slider {
  box-shadow: 0 0 1px #1976d2;
}
</style>
