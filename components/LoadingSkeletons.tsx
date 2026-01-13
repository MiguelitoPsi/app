'use client'

import React from 'react'

// Pulse animation for skeleton elements
const pulseClass = 'animate-pulse bg-slate-200 dark:bg-slate-700'

// Card skeleton
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-lg ${pulseClass}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-4 w-24 rounded ${pulseClass}`} />
          <div className={`h-3 w-16 rounded ${pulseClass}`} />
        </div>
      </div>
      <div className="space-y-2">
        <div className={`h-4 w-full rounded ${pulseClass}`} />
        <div className={`h-4 w-3/4 rounded ${pulseClass}`} />
      </div>
    </div>
  )
}

// Summary card skeleton (for stats cards)
export function SummaryCardSkeleton() {
  return (
    <div className="flex flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className={`h-10 w-10 flex-shrink-0 rounded-lg ${pulseClass}`} />
      <div className="flex flex-col gap-1">
        <div className={`h-6 w-12 rounded ${pulseClass}`} />
        <div className={`h-3 w-24 rounded ${pulseClass}`} />
      </div>
    </div>
  )
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/50">
      <div className={`h-10 w-10 flex-shrink-0 rounded-full ${pulseClass}`} />
      <div className="flex-1 space-y-2">
        <div className={`h-4 w-32 rounded ${pulseClass}`} />
        <div className={`h-3 w-20 rounded ${pulseClass}`} />
      </div>
      <div className={`h-4 w-4 rounded ${pulseClass}`} />
    </div>
  )
}

// Pending item skeleton
export function PendingItemSkeleton() {
  return (
    <div className="flex flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className={`h-8 w-8 flex-shrink-0 rounded-lg ${pulseClass}`} />
      <div className={`h-4 flex-1 rounded ${pulseClass}`} />
      <div className={`h-5 w-5 flex-shrink-0 rounded ${pulseClass}`} />
    </div>
  )
}

// Dashboard skeleton - Full skeleton for the dashboard
export function DashboardSkeleton() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-12 gap-5">
      {/* Left column */}
      <div className="col-span-12 flex flex-col gap-5 lg:col-span-4">
        {/* Sessions card skeleton */}
        <CardSkeleton className="min-h-[200px]" />
        
        {/* Summary cards */}
        <div className="flex flex-col gap-5">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>
      </div>

      {/* Right column */}
      <div className="col-span-12 flex flex-col gap-5 overflow-hidden lg:col-span-8">
        {/* Pending items card skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4 dark:border-slate-700">
            <div className={`h-5 w-5 rounded ${pulseClass}`} />
            <div className={`h-5 w-24 rounded ${pulseClass}`} />
          </div>
          <div className="space-y-3">
            <PendingItemSkeleton />
            <PendingItemSkeleton />
            <PendingItemSkeleton />
          </div>
        </div>

        {/* Tasks card skeleton */}
        <div className="flex-1 min-h-[200px] rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4 dark:border-slate-700">
            <div className={`h-4 w-4 rounded ${pulseClass}`} />
            <div className={`h-4 w-16 rounded ${pulseClass}`} />
          </div>
          <div className={`h-10 w-full rounded-lg mb-4 ${pulseClass}`} />
          <div className={`h-8 w-full rounded ${pulseClass}`} />
        </div>
      </div>
    </div>
  )
}

// Session list skeleton
export function SessionListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  )
}

// Table row skeleton
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-4 rounded ${pulseClass}`} />
        </td>
      ))}
    </tr>
  )
}
