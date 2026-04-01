'use client'

import type React from 'react'

interface SkipLinkProps {
  href?: string
  children?: React.ReactNode
}

/**
 * Skip link component for keyboard navigation
 * Allows users to skip directly to main content
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  href = '#main-content',
  children = 'Pular para o conteúdo principal',
}) => (
  <a className='skip-link' href={href}>
    {children}
  </a>
)

export default SkipLink
