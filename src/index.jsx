import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Provider } from 'react-redux';
import App from './App';
import reportWebVitals from './reportWebVitals';
import store from './redux/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Bulletproof suppression of ResizeObserver loop warnings common in Ant Design responsive tables/drawers
if (typeof window !== "undefined") {
  const OriginalResizeObserver = window.ResizeObserver;
  if (OriginalResizeObserver) {
    window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
      constructor(callback) {
        super((entries, observer) => {
          window.requestAnimationFrame(() => {
            try {
              callback(entries, observer);
            } catch (e) {
            }
          });
        });
      }
    };
  }

  const ignoreResizeObserverLoop = (event) => {
    const message = event.message || event.error?.message || "";
    if (
      message.includes("ResizeObserver loop completed with undelivered notifications") ||
      message.includes("ResizeObserver loop limit exceeded")
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  };

  window.addEventListener("error", ignoreResizeObserverLoop, true);
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason?.message || "";
    if (
      message.includes("ResizeObserver loop completed with undelivered notifications") ||
      message.includes("ResizeObserver loop limit exceeded")
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <App />
    </Provider>
  </QueryClientProvider>
);

reportWebVitals();

serviceWorkerRegistration.register();
