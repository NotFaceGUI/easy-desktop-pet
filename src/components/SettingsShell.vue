<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <div class="settings-shell">
    <header class="settings-header">
      <div>
        <p class="eyebrow">Easy Desktop Pet</p>
        <h1>{{ title || "桌面宠物设置" }}</h1>
      </div>
      <slot name="header-extra" />
    </header>
    <main class="settings-content">
      <slot />
    </main>
  </div>
</template>
