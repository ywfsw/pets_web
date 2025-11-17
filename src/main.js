import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// General Fonts
import 'vfonts/Lato.css'
// Monospace Fonts
import 'vfonts/FiraCode.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
