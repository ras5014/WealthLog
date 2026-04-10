import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { store } from './lib/store'
import { Provider } from 'react-redux'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
)
