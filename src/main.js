import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// Global Styles
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'
import './styles/global.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
