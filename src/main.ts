import { createApp } from "vue";
import { createPinia } from "pinia";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { TreeDataModule } from "ag-grid-enterprise";

import App from "./App.vue";

ModuleRegistry.registerModules([AllCommunityModule, TreeDataModule]);

const app = createApp(App);

app.use(createPinia());

app.mount("#app");
