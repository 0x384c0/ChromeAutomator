import { createApp, defineComponent, h } from 'vue'
import App from './index.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura';
import '/node_modules/primeflex/primeflex.css'

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
    }
});
app.mount('#app');