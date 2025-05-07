import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import App from './App.jsx';
import { Provider } from 'react-redux';
import { persistor, store } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import 'regenerator-runtime/runtime';
import './styles/global.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AppWithRouter = () => {
  const navigate = useNavigate();
  return (
    <>
      <App navigate={navigate} />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Suspense fallback={<div>Loading...</div>}>
          <Router>
            <AppWithRouter />
          </Router>
        </Suspense>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
