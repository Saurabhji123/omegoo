/// <reference types="react-scripts" />

// For React Scripts (Create React App)
declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_API_URL: string;
    readonly REACT_APP_GOOGLE_CLIENT_ID: string;
    readonly REACT_APP_BACKEND_URL: string;
    readonly REACT_APP_BACKEND_URL_PROD: string;
  }
}
