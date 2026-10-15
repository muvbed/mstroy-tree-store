import { createApp } from "vue";
import { createPinia } from "pinia";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

import App from "./App.vue";

ModuleRegistry.registerModules([AllCommunityModule]);

const app = createApp(App);

app.use(createPinia());

app.mount("#app");
