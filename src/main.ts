import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// Import CSS files
import './assets/css/reset.css'
import './assets/css/index.css'
import './assets/css/cards.css'
import './assets/css/collection.css'
import './assets/css/run.css'
import './assets/css/settings.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
