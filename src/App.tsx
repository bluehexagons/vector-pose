import {createRoot} from 'react-dom/client';
import {AppRoot} from './AppRoot';
import {ErrorBoundary} from './components/ErrorBoundary';

const root = createRoot(document.body);
root.render(
  <ErrorBoundary>
    <AppRoot />
  </ErrorBoundary>
);
