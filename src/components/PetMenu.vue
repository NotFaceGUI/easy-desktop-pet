<script setup lang="ts">
import type { PetAction } from "../types";

defineProps<{
  visible: boolean;
  actions: PetAction[];
  activeActionId: string;
}>();

defineEmits<{
  chooseAction: [actionId: string];
}>();

function actionStyle(index: number, total: number) {
  const radius = total > 4 ? 136 : 122;
  const start = 214;
  const end = 326;
  const angle = total === 1 ? 270 : start + ((end - start) / (total - 1)) * index;
  const radians = (angle * Math.PI) / 180;
  const offsetX = Math.cos(radians) * radius;
  const offsetY = Math.sin(radians) * radius;

  return {
    "--offset-x": `${offsetX}px`,
    "--offset-y": `${offsetY}px`,
    "--hidden-offset-x": `${offsetX * 0.74}px`,
    "--hidden-offset-y": `${offsetY * 0.74}px`,
    "--delay": `${index * 28}ms`,
  };
}
</script>

<template>
  <div class="pet-menu-panel" :class="{ visible }">
    <button
      v-for="(action, index) in actions"
      :key="action.id"
      class="pet-float-button"
      :class="{ active: activeActionId === action.id }"
      :style="actionStyle(index, actions.length)"
      @click="$emit('chooseAction', action.id)"
    >
      {{ action.name }}
    </button>
  </div>
</template>
