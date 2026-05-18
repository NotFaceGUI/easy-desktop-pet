<script setup lang="ts">
import type { TodoTimerRuntimeState } from "../types";

defineProps<{
  title: string;
  minutes: number;
  display: string;
  runtime: TodoTimerRuntimeState;
  compact: boolean;
}>();

defineEmits<{
  updateTitle: [value: string];
  updateMinutes: [value: number];
  start: [];
  pause: [];
  reset: [];
  finish: [];
}>();
</script>

<template>
  <div class="pomodoro-bubble" :class="{ compact }">
    <div v-if="!compact" class="pomodoro-meta">
      <span class="pomodoro-kicker">监督设置</span>
      <span class="pomodoro-progress">
        {{ runtime.completed ? "已完成" : runtime.isRunning ? "监督中" : "待命" }}
      </span>
    </div>

    <label v-if="!compact" class="todo-inline-field">
      <span>要做什么</span>
      <input
        class="todo-inline-input"
        :value="title"
        maxlength="40"
        placeholder="例如：写方案 / 背单词 / 回消息"
        @input="$emit('updateTitle', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <div v-if="!compact" class="todo-inline-grid">
      <label class="todo-inline-field">
        <span>分钟</span>
        <input
          class="todo-inline-input"
          type="number"
          min="1"
          max="240"
          :value="minutes"
          @input="$emit('updateMinutes', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <div class="todo-inline-timer">
        <span>倒计时</span>
        <strong>{{ display }}</strong>
      </div>
    </div>

    <div v-else class="todo-compact-body">
      <div class="todo-compact-copy">
        <span class="todo-compact-label">监督中</span>
        <strong class="todo-compact-title">{{ title || "监督任务" }}</strong>
      </div>
      <div class="todo-compact-side">
        <span class="todo-compact-timer">{{ display }}</span>
      </div>
    </div>

    <p v-if="!compact" class="todo-inline-hint">
      开始后猫猫会进入监督动作，结束后自动切回默认动作。
    </p>

    <div class="pomodoro-actions" :class="{ compact }">
      <button v-if="!runtime.isRunning" class="soft-button accent" @click="$emit('start')">
        开始
      </button>
      <button v-else class="soft-button accent" @click="$emit('pause')">暂停</button>
      <button class="soft-button" @click="$emit('finish')">完成</button>
      <button class="soft-button ghost" @click="$emit('reset')">重置</button>
    </div>
  </div>
</template>
