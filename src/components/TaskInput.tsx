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
  const [focused, setFocused] = useState(false)
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
    <div style={{ marginBottom: '20px' }}>
      {/* Add bar — matches widget quick-add */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          border: `1px solid ${focused ? 'rgba(125,200,125,0.3)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: '10px',
          padding: '9px 12px',
          transition: 'border-color 0.2s',
          boxShadow: focused ? '0 0 0 1px rgba(125,200,125,0.08), inset 0 0 20px rgba(125,200,125,0.02)' : 'none',
        }}
      >
        <span style={{
          color: 'var(--green)',
          fontSize: '14px',
          userSelect: 'none',
          textShadow: '0 0 6px rgba(125,200,125,0.4)',
          flexShrink: 0,
        }}>+</span>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="add task... #area ~due !high @daily"
          style={{
            flex: 1,
            fontSize: '13px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.92)',
          }}
          spellCheck={false}
          autoComplete="off"
        />
        {value && (
          <span style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '11px',
            userSelect: 'none',
            flexShrink: 0,
          }}>
            ↵
          </span>
        )}
      </div>

      {/* Syntax hint */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '4px 4px 0',
        fontSize: '11px',
        fontWeight: 500,
        color: 'rgba(255,255,255,0.35)',
      }}>
        <span>#area</span>
        <span>~today</span>
        <span>!high</span>
        <span>@daily</span>
      </div>
    </div>
  )
}
