'use client'

import { DeletedAccountModal } from './DeletedAccountModal'
import { SuspendedAccountModal } from './SuspendedAccountModal'
import { UnlinkedPatientModal } from './UnlinkedPatientModal'

/**
 * Wrapper component that renders suspension modals at the root level.
 * This ensures the modals appear even when other providers/components fail due to suspension.
 * - SuspendedAccountModal: Shows for admin-suspended accounts
 * - UnlinkedPatientModal: Shows for patients unlinked by their therapist
 * - DeletedAccountModal: Shows for accounts deleted by admin
 */
export function SuspensionCheck() {
  return (
    <>
      <SuspendedAccountModal />
      <UnlinkedPatientModal />
      <DeletedAccountModal />
    </>
  )
}
