import { createApp, defineComponent, h } from 'vue';
import App from './index.vue';
import { setupLogic } from './logic.js';
import './index.css';

const appComponent = defineComponent({
    setup: setupLogic,
    render: () => h(App)
});

const app = createApp(appComponent);
app.mount('#app');