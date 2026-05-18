<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import {
  LogicalSize,
  PhysicalPosition,
  cursorPosition,
  getCurrentWindow,
} from "@tauri-apps/api/window";
import { useAppStore } from "../stores/app";
import PetCanvas from "../components/PetCanvas.vue";
import PetMenu from "../components/PetMenu.vue";
import PomodoroWidget from "../components/PomodoroWidget.vue";
import {
  listenConfigUpdated,
  listenTodoTimerChanged,
  listenTrayAction,
} from "../lib/events";

const store = useAppStore();
const menuPinned = ref(false);
const todoPanelVisible = ref(false);
const todoTitleDraft = ref("");
const todoMinutesDraft = ref(25);
const unlisteners: Array<() => void> = [];
const dragState = {
  active: false,
  pointerOffsetX: 0,
  pointerOffsetY: 0,
  lastX: 0,
  lastY: 0,
};
let dragTimer: number | null = null;
let hitTestTimer: number | null = null;
let ignoreCursorEvents = false;

const menuVisible = computed(
  () => menuPinned.value && !todoPanelVisible.value && !store.todoTimer.isRunning,
);
const todoCompact = computed(() => store.todoTimer.isRunning);

watch(
  () => store.config.todoTimer,
  (todoTimer) => {
    if (!store.todoTimer.isRunning) {
      todoTitleDraft.value = todoTimer.title;
      todoMinutesDraft.value = todoTimer.minutes;
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => store.config.settings.scale,
  (scale) => {
    void syncPetWindowSize(scale);
  },
);

async function openSettings() {
  await invoke("open_settings");
}

async function syncPetWindowSize(scale: number) {
  const currentWindow = getCurrentWindow();
  if (currentWindow.label !== "pet") {
    return;
  }

  const width = Math.round(320 + scale * 180);
  const height = Math.round(280 + scale * 180);
  await currentWindow.setSize(new LogicalSize(width, height));
}

function closeMenu() {
  menuPinned.value = false;
  if (!store.todoTimer.isRunning) {
    todoPanelVisible.value = false;
  }
}

async function handlePetPointerDown(event: PointerEvent) {
  if (event.button !== 0) {
    return;
  }

  const currentWindow = getCurrentWindow();
  const [position, cursor] = await Promise.all([
    currentWindow.outerPosition(),
    cursorPosition(),
  ]);
  dragState.active = true;
  dragState.pointerOffsetX = cursor.x - position.x;
  dragState.pointerOffsetY = cursor.y - position.y;
  dragState.lastX = position.x;
  dragState.lastY = position.y;
  closeMenu();

  if (dragTimer !== null) {
    window.clearInterval(dragTimer);
  }

  dragTimer = window.setInterval(() => {
    void dragPetWindow();
  }, 16);

  window.addEventListener("pointerup", handlePointerUp, { once: true });
  window.addEventListener("blur", handlePointerUp, { once: true });
}

async function dragPetWindow() {
  if (!dragState.active) {
    return;
  }

  const currentWindow = getCurrentWindow();
  const cursor = await cursorPosition();
  const nextPosition = {
    x: cursor.x - dragState.pointerOffsetX,
    y: cursor.y - dragState.pointerOffsetY,
  };

  dragState.lastX = nextPosition.x;
  dragState.lastY = nextPosition.y;
  await currentWindow.setPosition(new PhysicalPosition(nextPosition.x, nextPosition.y));
}

function handlePointerUp() {
  dragState.active = false;
  if (dragTimer !== null) {
    window.clearInterval(dragTimer);
    dragTimer = null;
  }
  window.removeEventListener("blur", handlePointerUp);
  void store.setPetPosition(dragState.lastX, dragState.lastY);
}

async function syncPetPosition() {
  const position = await getCurrentWindow().outerPosition();
  await store.setPetPosition(position.x, position.y);
}

async function handleTrayAction(action: string) {
  if (action === "todo-start") {
    await store.startTodoTimer();
    return;
  }
  if (action === "todo-pause") {
    store.pauseTodoTimer();
    return;
  }
  if (action === "todo-reset") {
    await store.resetTodoTimer();
    return;
  }
  if (action === "toggle-pet") {
    const currentWindow = getCurrentWindow();
    if (await currentWindow.isVisible()) {
      await currentWindow.hide();
    } else {
      await currentWindow.show();
    }
    return;
  }
  if (action === "toggle-autostart") {
    await store.applyLaunchAtStartup(!store.config.settings.launchAtStartup);
    return;
  }
  if (action === "check-update") {
    await store.checkForUpdates();
  }
}

function toggleContextMenu() {
  if (todoPanelVisible.value && !store.todoTimer.isRunning) {
    todoPanelVisible.value = false;
    menuPinned.value = true;
    return;
  }

  if (menuPinned.value) {
    closeMenu();
    return;
  }

  menuPinned.value = true;
}

function toggleTodoPanel() {
  menuPinned.value = false;
  todoPanelVisible.value = !todoPanelVisible.value;
}

async function startTodoTimer() {
  await store.saveTodoTimerSettings(todoTitleDraft.value, todoMinutesDraft.value);
  todoPanelVisible.value = true;
  menuPinned.value = false;
  await store.startTodoTimer();
}

function pauseTodoTimer() {
  store.pauseTodoTimer();
}

async function finishTodoTimer() {
  await store.finishTodoTimer();
  todoPanelVisible.value = false;
}

async function resetTodoTimer() {
  todoTitleDraft.value = store.config.todoTimer.title;
  todoMinutesDraft.value = store.config.todoTimer.minutes;
  await store.resetTodoTimer();
  todoPanelVisible.value = false;
}

function updateTodoMinutes(value: number) {
  if (!Number.isFinite(value)) {
    todoMinutesDraft.value = 25;
    return;
  }

  todoMinutesDraft.value = Math.min(240, Math.max(1, Math.round(value)));
}

function isPointInElement(
  element: Element,
  cursorX: number,
  cursorY: number,
  windowX: number,
  windowY: number,
  scaleFactor: number,
  padding = 0,
) {
  const rect = element.getBoundingClientRect();
  const left = windowX + (rect.left - padding) * scaleFactor;
  const top = windowY + (rect.top - padding) * scaleFactor;
  const right = windowX + (rect.right + padding) * scaleFactor;
  const bottom = windowY + (rect.bottom + padding) * scaleFactor;

  return cursorX >= left && cursorX <= right && cursorY >= top && cursorY <= bottom;
}

async function setWindowCursorPassthrough(enabled: boolean) {
  if (ignoreCursorEvents === enabled) {
    return;
  }

  ignoreCursorEvents = enabled;
  await getCurrentWindow().setIgnoreCursorEvents(enabled);
}

async function syncHitRegions() {
  if (dragState.active) {
    await setWindowCursorPassthrough(false);
    return;
  }

  const mediaElement = document.querySelector(".pet-media, .pet-empty");
  if (!mediaElement) {
    await setWindowCursorPassthrough(false);
    return;
  }

  const interactiveElements = Array.from(
    document.querySelectorAll(".pet-media, .pet-empty, .pet-subtool-button, .pet-float-button, .pomodoro-bubble"),
  );

  const currentWindow = getCurrentWindow();
  const [cursor, innerPosition, scaleFactor] = await Promise.all([
    cursorPosition(),
    currentWindow.innerPosition(),
    currentWindow.scaleFactor(),
  ]);

  const overInteractive = interactiveElements.some((element) =>
    isPointInElement(
      element,
      cursor.x,
      cursor.y,
      innerPosition.x,
      innerPosition.y,
      scaleFactor,
      8,
    ),
  );

  await setWindowCursorPassthrough(!overInteractive);
}

onMounted(async () => {
  await store.initialize();
  await syncPetWindowSize(store.config.settings.scale);
  await store.movePetWindowToSavedPosition();
  if (store.todoTimer.isRunning) {
    todoPanelVisible.value = true;
  }
  await syncHitRegions();
  hitTestTimer = window.setInterval(() => {
    void syncHitRegions();
  }, 80);

  const currentWindow = getCurrentWindow();
  unlisteners.push(
    await currentWindow.onMoved(async () => {
      await syncPetPosition();
    }),
  );

  unlisteners.push(
    await listenConfigUpdated(async (config) => {
      await store.syncConfig(config);
    }),
  );

  unlisteners.push(
    await listenTodoTimerChanged(async (payload) => {
      store.todoTimer.remainingSeconds = payload.remainingSeconds;
      store.todoTimer.completed = payload.completed;
      await store.setActiveAction(payload.actionId);
    }),
  );

  unlisteners.push(
    await listenTrayAction(async (payload) => {
      await handleTrayAction(payload.action);
    }),
  );
});

onBeforeUnmount(() => {
  handlePointerUp();
  if (hitTestTimer !== null) {
    window.clearInterval(hitTestTimer);
    hitTestTimer = null;
  }
  unlisteners.forEach((unlisten) => unlisten());
});
</script>

<template>
  <div class="pet-screen" @click.self="closeMenu" @contextmenu.prevent="toggleContextMenu">
    <div class="pet-shell">
      <div class="pet-stage">
        <div v-if="todoPanelVisible" class="pet-overlay">
          <PomodoroWidget
            :title="todoTitleDraft"
            :minutes="todoMinutesDraft"
            :display="store.formattedTodoTimer"
            :runtime="store.todoTimer"
            :compact="todoCompact"
            @update-title="todoTitleDraft = $event"
            @update-minutes="updateTodoMinutes"
            @start="startTodoTimer"
            @pause="pauseTodoTimer"
            @finish="finishTodoTimer"
            @reset="resetTodoTimer"
          />
        </div>

        <PetCanvas
          :asset="store.currentAsset"
          :scale="store.config.settings.scale"
          @pointer-down="handlePetPointerDown"
        />

        <div class="pet-toolbar">
          <transition name="pet-toolbar-fade">
            <div
              v-if="menuPinned && !todoPanelVisible && !store.todoTimer.isRunning"
              class="pet-subtools"
            >
              <button class="pet-subtool-button" @click.stop="toggleTodoPanel">
                监督设置
              </button>
              <button class="pet-subtool-button warm" @click.stop="openSettings">
                打开设置
              </button>
            </div>
          </transition>
        </div>

        <PetMenu
          :visible="menuVisible"
          :actions="store.quickActions"
          :active-action-id="store.activeActionId"
          @choose-action="store.setActiveAction"
        />
      </div>
    </div>
  </div>
</template>
