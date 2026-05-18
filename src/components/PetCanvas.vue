<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { PetAsset } from "../types";
import { isVideoAsset, resolveAssetUrl, revokeAssetUrl } from "../lib/media";

const emit = defineEmits<{
  pointerDown: [event: PointerEvent];
}>();

const props = defineProps<{
  asset: PetAsset | null;
  scale: number;
}>();

const source = ref("");

watch(
  () => props.asset,
  async (nextAsset, previousAsset) => {
    if (previousAsset && !previousAsset.isBundled && previousAsset.id !== nextAsset?.id) {
      revokeAssetUrl(previousAsset.id);
    }
    source.value = nextAsset ? await resolveAssetUrl(nextAsset) : "";
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (props.asset && !props.asset.isBundled) {
    revokeAssetUrl(props.asset.id);
  }
});

const isVideo = computed(() => isVideoAsset(props.asset));

function handlePointerDown(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement | null;
  target?.setPointerCapture?.(event.pointerId);
  emit("pointerDown", event);
}
</script>

<template>
  <div class="pet-canvas" :style="{ '--pet-scale': String(scale) }">
    <video
      v-if="asset && isVideo"
      class="pet-media pet-draggable"
      :src="source"
      autoplay
      loop
      playsinline
      muted
      draggable="false"
      @pointerdown.left="handlePointerDown"
    />
    <img
      v-else-if="asset"
      class="pet-media pet-draggable"
      :src="source"
      :alt="asset.name"
      draggable="false"
      @pointerdown.left="handlePointerDown"
    />
    <div v-else class="pet-empty">暂无可播放素材</div>
  </div>
</template>
