'use client'

import { RiCheckFill, RiEyeLine, RiEyeOffLine, RiKeyLine } from '@remixicon/react'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export default function AdminSettingsPage() {
  const [showChangePassword, setShowChangePassword] = useState(false)

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const resetPasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess(false)
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    if (!(currentPassword && newPassword && confirmPassword)) {
      setPasswordError('Preencha todos os campos')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('A nova senha deve ser diferente da atual')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })

      if (error) {
        if (error.message?.includes('Invalid password') || error.message?.includes('incorrect')) {
          setPasswordError('Senha atual incorreta')
        } else {
          setPasswordError(error.message || 'Erro ao alterar senha')
        }
        return
      }

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        setShowChangePassword(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError('Erro ao alterar senha. Tente novamente.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-white'>Configurações</h1>
        <p className='mt-1 text-slate-400'>Gerencie sua conta e segurança</p>
      </div>

      <div className='max-w-2xl space-y-4'>
        {/* Alterar Senha */}
        <div className='rounded-xl border border-slate-700 bg-slate-800/50 p-6 shadow-sm'>
          <button
            className='flex w-full items-center justify-between transition-opacity hover:opacity-80'
            onClick={() => {
              if (!showChangePassword) resetPasswordForm()
              setShowChangePassword(!showChangePassword)
            }}
            type='button'
          >
            <div className='flex items-center gap-4'>
              <div className='rounded-xl bg-amber-600/20 p-3 text-amber-500'>
                <RiKeyLine size={24} />
              </div>
              <div className='text-left'>
                <h4 className='text-lg font-bold text-white'>Segurança</h4>
                <p className='text-sm text-slate-400'>Alterar sua senha de acesso</p>
              </div>
            </div>
          </button>

          {showChangePassword && (
            <div className='mt-6 border-t border-slate-700 pt-6 animate-in fade-in slide-in-from-top-4 duration-300'>
              {passwordSuccess ? (
                <div className='flex flex-col items-center py-4 text-center'>
                  <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/20'>
                    <RiCheckFill className='h-6 w-6 text-emerald-500' />
                  </div>
                  <h4 className='mb-1 font-bold text-white'>Senha alterada!</h4>
                  <p className='text-sm text-slate-400'>Sua senha foi atualizada com sucesso.</p>
                </div>
              ) : (
                <form
                  className='space-y-4'
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleChangePassword()
                  }}
                >
                  <div className='space-y-4'>
                    <div>
                      <label
                        className='mb-1.5 block text-sm font-medium text-slate-300'
                        htmlFor='currentPassword'
                      >
                        Senha atual
                      </label>
                      <div className='relative'>
                        <input
                          autoComplete='current-password'
                          className='w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                          id='currentPassword'
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder='••••••••'
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                        />
                        <button
                          aria-label={showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 transition-colors hover:text-slate-300'
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          type='button'
                        >
                          {showCurrentPassword ? (
                            <RiEyeOffLine size={20} />
                          ) : (
                            <RiEyeLine size={20} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        className='mb-1.5 block text-sm font-medium text-slate-300'
                        htmlFor='newPassword'
                      >
                        Nova senha
                      </label>
                      <div className='relative'>
                        <input
                          autoComplete='new-password'
                          className='w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                          id='newPassword'
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder='••••••••'
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                        />
                        <button
                          aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 transition-colors hover:text-slate-300'
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          type='button'
                        >
                          {showNewPassword ? <RiEyeOffLine size={20} /> : <RiEyeLine size={20} />}
                        </button>
                      </div>
                      <p className='mt-1 text-xs text-slate-500'>Mínimo de 8 caracteres</p>
                    </div>

                    <div>
                      <label
                        className='mb-1.5 block text-sm font-medium text-slate-300'
                        htmlFor='confirmPassword'
                      >
                        Confirmar nova senha
                      </label>
                      <div className='relative'>
                        <input
                          autoComplete='new-password'
                          className='w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20'
                          id='confirmPassword'
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder='••••••••'
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                        />
                        <button
                          aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 transition-colors hover:text-slate-300'
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          type='button'
                        >
                          {showConfirmPassword ? (
                            <RiEyeOffLine size={20} />
                          ) : (
                            <RiEyeLine size={20} />
                          )}
                        </button>
                      </div>
                    </div>

                    {passwordError && (
                      <div className='rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400 border border-red-500/20'>
                        {passwordError}
                      </div>
                    )}

                    <div className='flex justify-end'>
                      <button
                        className='rounded-xl bg-violet-600 px-6 py-2.5 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
                        disabled={isChangingPassword}
                        type='submit'
                      >
                        {isChangingPassword ? 'Alterando...' : 'Salvar Nova Senha'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
