import { createRouter, createWebHashHistory } from "vue-router";
import PetView from "./views/PetView.vue";
import SettingsView from "./views/SettingsView.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/pet",
    },
    {
      path: "/pet",
      name: "pet",
      component: PetView,
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
    },
  ],
});
