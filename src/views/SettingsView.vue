<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { MagicStick, Setting, Upload } from "@element-plus/icons-vue";
import { open } from "@tauri-apps/plugin-dialog";
import SettingsShell from "../components/SettingsShell.vue";
import { useAppStore } from "../stores/app";

const store = useAppStore();
const newActionName = ref("");
const scaleDraft = ref(1);

const defaultActionOptions = computed(() => store.config.actions);
const defaultActionId = computed({
  get: () => store.config.settings.defaultActionId,
  set: (value: string) => {
    void store.setDefaultAction(value);
  },
});
const launchAtStartupEnabled = computed({
  get: () => store.config.settings.launchAtStartup,
  set: (value: boolean) => {
    void toggleLaunchAtStartup(value);
  },
});

function getActionAssetIds(actionId: string) {
  return store.config.actions.find((action) => action.id === actionId)?.assetIds ?? [];
}

function updateActionAssets(actionId: string, value: string[]) {
  void store.setActionAssets(actionId, value);
}

async function importFiles() {
  const selected = await open({
    multiple: true,
    filters: [
      {
        name: "Pet Media",
        extensions: ["gif", "apng", "webm"],
      },
    ],
  });

  if (!selected) {
    return;
  }

  const paths = Array.isArray(selected) ? selected : [selected];
  const result = await store.importUserAssets(paths);
  ElMessage.success(`已导入 ${result.imported.length} 个素材`);
}

async function toggleLaunchAtStartup(enabled: string | number | boolean) {
  const result = await store.applyLaunchAtStartup(Boolean(enabled));
  if (!result.ok) {
    ElMessage.error(result.message);
  }
}

async function addCustomAction() {
  const result = await store.addAction(newActionName.value);
  if (!result.ok) {
    ElMessage.warning(result.message);
    return;
  }

  newActionName.value = "";
  ElMessage.success("动作已添加");
}

async function commitScale(value: number | [number, number]) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return;
  }

  if (value === store.config.settings.scale) {
    return;
  }

  await store.setScale(value);
}

onMounted(async () => {
  await store.initialize();
  scaleDraft.value = store.config.settings.scale;
});
</script>

<template>
  <SettingsShell title="桌宠控制台">
    <template #header-extra>
      <el-button type="primary" @click="importFiles">
        <el-icon><Upload /></el-icon>
        导入素材
      </el-button>
    </template>

    <div class="settings-grid">
      <el-card shadow="hover" class="settings-card">
        <template #header>
          <div class="card-title">
            <el-icon><Setting /></el-icon>
            <span>基础设置</span>
          </div>
        </template>

        <div class="field-stack">
          <label class="field-label">默认动作</label>
          <el-select v-model="defaultActionId">
            <el-option
              v-for="action in defaultActionOptions"
              :key="action.id"
              :label="action.name"
              :value="action.id"
            />
          </el-select>

          <label class="field-label">缩放比例</label>
          <el-slider
            v-model="scaleDraft"
            :min="0.4"
            :max="2"
            :step="0.1"
            @change="commitScale"
          />

          <el-switch
            v-model="launchAtStartupEnabled"
            active-text="开机启动"
            inactive-text="手动启动"
          />

          <label class="field-label">新增自定义动作</label>
          <div class="inline-actions">
            <el-input v-model="newActionName" placeholder="例如：吃饭 / 发呆 / 写代码" />
            <el-button type="primary" @click="addCustomAction">添加动作</el-button>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="settings-card wide">
        <template #header>
          <div class="card-title">
            <el-icon><MagicStick /></el-icon>
            <span>动作映射</span>
          </div>
        </template>

        <div class="field-stack" v-for="action in store.config.actions" :key="action.id">
          <label class="field-label">{{ action.name }}</label>
          <el-select
            :model-value="getActionAssetIds(action.id)"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="为动作选择一个或多个素材"
            @update:model-value="(value: string[]) => updateActionAssets(action.id, value)"
          >
            <el-option
              v-for="asset in store.config.assets"
              :key="asset.id"
              :label="asset.name"
              :value="asset.id"
            />
          </el-select>
        </div>
      </el-card>

      <el-card shadow="hover" class="settings-card wide">
        <template #header>
          <div class="card-title">
            <el-icon><Upload /></el-icon>
            <span>素材库</span>
          </div>
        </template>

        <div class="asset-list">
          <div v-for="asset in store.config.assets" :key="asset.id" class="asset-row">
            <div>
              <strong>{{ asset.name }}</strong>
              <p>{{ asset.kind.toUpperCase() }} · {{ asset.fileName }}</p>
            </div>
            <span class="asset-tag">{{ asset.isBundled ? "内置" : "用户导入" }}</span>
          </div>
        </div>

        <div class="inline-actions">
          <el-button @click="importFiles">导入新素材</el-button>
        </div>
      </el-card>
    </div>
  </SettingsShell>
</template>
