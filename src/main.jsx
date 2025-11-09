import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import MainPage from './pages/MainPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { Toaster } from 'react-hot-toast'

// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
      refetchOnMount: false, // 마운트 시 자동 refetch 비활성화 (캐시된 데이터 사용)
      refetchOnReconnect: true, // 네트워크 재연결 시 refetch
      retry: 1, // 실패 시 1번만 재시도
      staleTime: 2 * 60 * 1000, // 기본 2분간 데이터를 fresh 상태로 유지 (메모 기준)
      gcTime: 10 * 60 * 1000, // 10분간 캐시 유지 (이전 cacheTime)
    },
    mutations: {
      retry: 0, // Mutation 실패 시 재시도 안 함
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              padding: '12px 16px'
            }
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
