import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.tsx'
import { HomePage } from './components/HomePage.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<App />} />
            <Route path="/strategy1" element={<App version="strategy1" />} />
            <Route path="/strategy2" element={<App version="strategy2" />} />
            <Route path="/market-research" element={<App version="marketResearch" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
