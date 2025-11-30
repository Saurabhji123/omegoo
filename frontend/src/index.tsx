import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { registerServiceWorker } from './serviceWorkerRegistration';
import reportWebVitals, { sendToAnalytics } from './reportWebVitals';
import { startVersionChecker } from './utils/versionChecker';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerServiceWorker();

// Start automatic version checker to detect new deployments
startVersionChecker();

// Report web vitals to analytics
reportWebVitals(sendToAnalytics);
