<template>
  <div>
    <h4>Preview</h4>
    <div class="preview mobile">
      <slot name="mobile" />
    </div>
    <div class="preview desktop">
      <slot name="desktop" />
    </div>
  </div>
</template>

<style scoped>
.preview {
  border: 1px solid #ccc;
  margin: 1rem 0;
  padding: 1rem;
}
.mobile {
  width: 375px;
}
.desktop {
  width: 1024px;
}
</style>
