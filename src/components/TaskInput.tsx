'use client'

import { useState, useRef, useEffect } from 'react'
import { Section } from '@/types'

interface Props {
  onAdd: (input: string, section?: Section) => void
  activeSection: Section | 'all'
  autoFocus?: boolean
}

export function TaskInput({ onAdd, activeSection, autoFocus }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      const section = activeSection === 'all' ? 'today' : activeSection
      onAdd(value.trim(), section)
      setValue('')
    }
    if (e.key === 'Escape') {
      setValue('')
      inputRef.current?.blur()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: '0.5px solid var(--border)',
        borderRadius: '4px',
        padding: '8px 12px',
        background: 'var(--surface)',
        marginBottom: '20px',
        transition: 'border-color 0.15s',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <span style={{ color: 'var(--green)', userSelect: 'none' }}>›</span>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={`add task... #area ~due !high`}
        style={{ flex: 1, fontSize: '13px' }}
        spellCheck={false}
        autoComplete="off"
      />
      {value && (
        <span style={{ color: 'var(--dim)', fontSize: '11px', userSelect: 'none' }}>
          ↵
        </span>
      )}
    </div>
  )
}
