'use client'

import {
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Key,
  LogOut,
  Moon,
  Sun,
  UserCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { TherapistProfileModal } from '@/components/TherapistProfileModal'
import { TherapistTermsModal } from '@/components/TherapistTermsModal'
import { useTherapistGame } from '@/context/TherapistGameContext'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'

export default function SettingsPage() {
  const _router = useRouter()
  const { theme, toggleTheme } = useTherapistGame()
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
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

  // Fetch terms acceptance status
  const { data: termsData } = trpc.user.checkTermsAccepted.useQuery()

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

    const allFieldsFilled = currentPassword && newPassword && confirmPassword
    if (!allFieldsFilled) {
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
    <div className='h-full overflow-y-auto px-4 py-6 pb-28 pt-safe sm:px-6 sm:py-8 sm:pb-32 lg:px-8 lg:py-6 lg:pb-8'>
      {/* Header */}
      <div className='mb-6'>
        <h2 className='font-bold text-slate-800 text-xl dark:text-white'>Configurações</h2>
        <p className='text-slate-500 text-xs dark:text-slate-400'>
          Gerencie suas preferências e conta
        </p>
      </div>

      <div className='mx-auto max-w-2xl space-y-4'>
        {/* Modo Escuro */}
        <div className='flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors sm:p-5 dark:border-slate-800 dark:bg-slate-900'>
          <div className='flex min-w-0 flex-1 items-center gap-3 sm:gap-4'>
            <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 sm:h-12 sm:w-12 dark:bg-violet-900/30 dark:text-violet-400'>
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div className='min-w-0'>
              <h4 className='font-bold text-slate-800 text-sm sm:text-base dark:text-white'>
                Modo Escuro
              </h4>
              <p className='text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                Ajustar aparência do app para ambientes com pouca luz
              </p>
            </div>
          </div>
          <div
            aria-checked={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Desativar modo escuro' : 'Ativar modo escuro'}
            className={`relative h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
              theme === 'dark' ? 'bg-violet-600' : 'bg-slate-300'
            }`}
            onClick={toggleTheme}
            onKeyDown={(e) => e.key === 'Enter' && toggleTheme()}
            role='switch'
            tabIndex={0}
          >
            <div
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                theme === 'dark' ? 'left-[26px]' : 'left-1'
              }`}
            />
          </div>
        </div>

        {/* Perfil Profissional */}
        <button
          className='flex w-full items-center justify-between rounded-xl border border-indigo-100 bg-white p-4 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-md sm:p-5 dark:border-indigo-900/30 dark:bg-slate-900 dark:hover:bg-indigo-900/20'
          onClick={() => setShowProfileModal(true)}
          type='button'
        >
          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='rounded-xl bg-indigo-100 p-2.5 text-indigo-600 sm:p-3 dark:bg-indigo-900/30 dark:text-indigo-400'>
              <UserCircle size={20} />
            </div>
            <div className='text-left'>
              <h4 className='font-bold text-slate-800 text-sm sm:text-base dark:text-white'>
                Perfil Profissional
              </h4>
              <p className='text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                Editar seus dados profissionais e especialidades
              </p>
            </div>
          </div>
        </button>

        {/* Alterar Senha */}
        <div className='rounded-xl border border-amber-100 bg-white p-4 shadow-sm sm:p-5 dark:border-amber-900/30 dark:bg-slate-900'>
          <button
            className='flex w-full items-center justify-between transition-opacity hover:opacity-80'
            onClick={() => {
              if (!showChangePassword) resetPasswordForm()
              setShowChangePassword(!showChangePassword)
            }}
            type='button'
          >
            <div className='flex items-center gap-3 sm:gap-4'>
              <div className='rounded-xl bg-amber-100 p-2.5 text-amber-600 sm:p-3 dark:bg-amber-900/30 dark:text-amber-400'>
                <Key size={20} />
              </div>
              <div className='text-left'>
                <h4 className='font-bold text-slate-800 text-sm sm:text-base dark:text-white'>
                  Segurança
                </h4>
                <p className='text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                  Alterar sua senha de acesso
                </p>
              </div>
            </div>
          </button>

          {showChangePassword && (
            <div className='mt-4 border-slate-100 border-t pt-4 sm:mt-5 sm:pt-5 dark:border-slate-800'>
              {passwordSuccess ? (
                <div className='flex flex-col items-center py-4 text-center'>
                  <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                    <CheckCircle2 className='h-6 w-6 text-green-600 dark:text-green-400' />
                  </div>
                  <h4 className='mb-1 font-bold text-slate-800 text-base dark:text-white'>
                    Senha alterada!
                  </h4>
                  <p className='text-slate-500 text-sm dark:text-slate-400'>
                    Sua senha foi atualizada com sucesso.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleChangePassword()
                  }}
                >
                  <div className='space-y-4'>
                    <div>
                      <label
                        className='mb-1.5 block font-medium text-slate-700 text-xs sm:text-sm dark:text-slate-300'
                        htmlFor='currentPassword'
                      >
                        Senha atual
                      </label>
                      <div className='relative'>
                        <input
                          autoComplete='current-password'
                          className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
                          id='currentPassword'
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder='••••••••'
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                        />
                        <button
                          aria-label={showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300'
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          type='button'
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        className='mb-1.5 block font-medium text-slate-700 text-xs sm:text-sm dark:text-slate-300'
                        htmlFor='newPassword'
                      >
                        Nova senha
                      </label>
                      <div className='relative'>
                        <input
                          autoComplete='new-password'
                          className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
                          id='newPassword'
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder='••••••••'
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                        />
                        <button
                          aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300'
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          type='button'
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className='mt-1 text-slate-400 text-[10px] sm:text-xs dark:text-slate-500'>
                        Mínimo de 8 caracteres
                      </p>
                    </div>

                    <div>
                      <label
                        className='mb-1.5 block font-medium text-slate-700 text-xs sm:text-sm dark:text-slate-300'
                        htmlFor='confirmPassword'
                      >
                        Confirmar nova senha
                      </label>
                      <div className='relative'>
                        <input
                          autoComplete='new-password'
                          className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500'
                          id='confirmPassword'
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder='••••••••'
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                        />
                        <button
                          aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          className='absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300'
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          type='button'
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {passwordError && (
                      <div className='rounded-lg bg-red-50 p-3 text-center text-red-600 text-sm dark:bg-red-900/20 dark:text-red-400'>
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

        {/* Termo de Responsabilidade */}
        <button
          className='flex w-full items-center justify-between rounded-xl border border-violet-100 bg-white p-4 shadow-sm transition-all hover:bg-violet-50 hover:shadow-md sm:p-5 dark:border-violet-900/30 dark:bg-slate-900 dark:hover:bg-violet-900/20'
          onClick={() => setShowTermsModal(true)}
          type='button'
        >
          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='rounded-xl bg-violet-100 p-2.5 text-violet-600 sm:p-3 dark:bg-violet-900/30 dark:text-violet-400'>
              <FileText size={20} />
            </div>
            <div className='text-left'>
              <h4 className='font-bold text-slate-800 text-sm sm:text-base dark:text-white'>
                Termo de Responsabilidade
              </h4>
              <p className='text-slate-500 text-xs sm:text-sm dark:text-slate-400'>
                Visualizar os termos de uso da plataforma
              </p>
            </div>
          </div>
        </button>

        {/* Logout */}
        <div className='pt-6'>
          <button
            className='flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20'
            onClick={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: async () => {
                    await fetch('/api/auth/clear-role-cookie', {
                      method: 'POST',
                    })
                    window.location.href = '/auth/signin'
                  },
                },
              })
            }}
            type='button'
          >
            <LogOut size={18} /> Sair da conta
          </button>
        </div>
      </div>

      {/* Modals */}
      <TherapistTermsModal
        isOpen={showTermsModal}
        mode='view'
        onClose={() => setShowTermsModal(false)}
        termsAcceptedAt={termsData?.termsAcceptedAt ?? null}
      />

      <TherapistProfileModal
        isOpen={showProfileModal}
        mode='edit'
        onClose={() => setShowProfileModal(false)}
        onComplete={() => setShowProfileModal(false)}
      />
    </div>
  )
}
