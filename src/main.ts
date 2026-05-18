import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./styles.css";

function renderBootMessage(title: string, detail: string) {
  const root = document.querySelector("#app");
  if (!(root instanceof HTMLElement)) {
    return;
  }

  root.innerHTML = `
    <div style="
      min-height: 100vh;
      padding: 24px;
      background: #f5f4ec;
      color: #223024;
      font-family: 'Microsoft YaHei', sans-serif;
    ">
      <div style="
        max-width: 880px;
        margin: 0 auto;
        padding: 24px;
        border-radius: 20px;
        background: rgba(246,250,242,0.96);
        border: 1px solid rgba(75,102,72,0.14);
        box-shadow: 0 20px 50px rgba(41,58,36,0.12);
      ">
        <h1 style="margin: 0 0 12px; font-size: 28px;">${title}</h1>
        <pre style="
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.6;
          font-size: 13px;
          color: #415141;
        ">${detail}</pre>
      </div>
    </div>
  `;
}

window.addEventListener("error", (event) => {
  const message = [
    `message: ${event.message}`,
    `filename: ${event.filename || "(unknown)"}`,
    `lineno: ${event.lineno}`,
    `colno: ${event.colno}`,
    `stack: ${event.error instanceof Error ? event.error.stack ?? "(none)" : "(none)"}`,
    `hash: ${window.location.hash || "(empty)"}`,
  ].join("\n");

  renderBootMessage("启动错误", message);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason =
    event.reason instanceof Error
      ? event.reason.stack ?? event.reason.message
      : String(event.reason);

  renderBootMessage(
    "未处理 Promise 错误",
    [`reason: ${reason}`, `hash: ${window.location.hash || "(empty)"}`].join("\n"),
  );
});

async function bootstrap() {
  renderBootMessage("启动中", `hash: ${window.location.hash || "(empty)"}`);

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(ElementPlus);
  app.mount("#app");
}

void bootstrap().catch((error) => {
  renderBootMessage(
    "应用启动失败",
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
});
