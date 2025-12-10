import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDarkMode } from '../context/DarkModeContext'

interface LoginProps {
  onLogin: () => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useTranslation('common')
  const { isDarkMode } = useDarkMode()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const envPassword = import.meta.env.VITE_APP_PASSWORD

    if (password === envPassword) {
      onLogin()
    } else {
      setError(t('auth.incorrectPassword'))
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#111827' : '#f3f4f6',
      transition: 'background-color 0.3s'
    }}>
      <div style={{
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        width: '100%',
        maxWidth: '24rem',
        transition: 'background-color 0.3s'
      }}>
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isDarkMode ? '#f9fafb' : '#111827' }}>
            {t('auth.accessRequired')}
          </h2>
          <p style={{ marginTop: '0.5rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
            {t('auth.enterPassword')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: isDarkMode ? '#d1d5db' : '#374151', marginBottom: '0.5rem' }}
            >
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '0.375rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: isDarkMode ? '#374151' : 'white',
                color: isDarkMode ? '#f9fafb' : '#111827'
              }}
              placeholder={t('auth.password')}
            />
          </div>

          {error && (
            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              padding: '0.5rem 1rem',
              border: '1px solid transparent',
              borderRadius: '0.375rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'white',
              backgroundColor: '#3b82f6',
              cursor: 'pointer'
            }}
          >
            {t('auth.signIn')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
