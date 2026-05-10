import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ThemeProvider } from './hooks/useTheme.jsx';
import { Buffer } from 'buffer';

// Monkey patch Buffer to fix "Bytes or str expected, not Buffer" error in GramJS
// This happens when there are multiple Buffer polyfills in the bundle and instanceof fails.
if (typeof Buffer !== 'undefined') {
  Object.defineProperty(Buffer, Symbol.hasInstance, {
    value: function (obj) {
      return !!(
        obj != null &&
        (obj._isBuffer ||
          (obj.constructor &&
            typeof obj.constructor.isBuffer === 'function' &&
            obj.constructor.isBuffer(obj)))
      );
    },
  });
}

window.Buffer = Buffer;
globalThis.Buffer = Buffer;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
