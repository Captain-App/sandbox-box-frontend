import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SandboxSelector } from './SandboxSelector'
import { sandboxFactory } from '../test-utils'

describe('SandboxSelector Component', () => {
  const sandboxes = [
    sandboxFactory({ title: 'Sandbox 1', status: 'active' }),
    sandboxFactory({ title: 'Sandbox 2', status: 'idle' }),
  ]
  const activeSandbox = sandboxes[0]
  const onSelect = vi.fn()
  const onCreateNew = vi.fn()

  it('renders the active sandbox title', () => {
    render(
      <SandboxSelector 
        activeSandbox={activeSandbox} 
        sandboxes={sandboxes} 
        onSelect={onSelect} 
        onCreateNew={onCreateNew} 
      />
    )
    expect(screen.getByText('Sandbox 1')).toBeInTheDocument()
  })

  it('opens the dropdown when clicked', () => {
    render(
      <SandboxSelector 
        activeSandbox={activeSandbox} 
        sandboxes={sandboxes} 
        onSelect={onSelect} 
        onCreateNew={onCreateNew} 
      />
    )
    
    fireEvent.click(screen.getByLabelText(/select sandbox/i))
    
    expect(screen.getByText('Sandbox 2')).toBeInTheDocument()
    expect(screen.getByText('Create New Box')).toBeInTheDocument()
  })

  it('calls onSelect when a sandbox is clicked in the dropdown', () => {
    render(
      <SandboxSelector 
        activeSandbox={activeSandbox} 
        sandboxes={sandboxes} 
        onSelect={onSelect} 
        onCreateNew={onCreateNew} 
      />
    )
    
    fireEvent.click(screen.getByLabelText(/select sandbox/i))
    fireEvent.click(screen.getByText('Sandbox 2'))
    
    expect(onSelect).toHaveBeenCalledWith(sandboxes[1])
  })

  it('calls onCreateNew when the create button is clicked', () => {
    render(
      <SandboxSelector 
        activeSandbox={activeSandbox} 
        sandboxes={sandboxes} 
        onSelect={onSelect} 
        onCreateNew={onCreateNew} 
      />
    )
    
    fireEvent.click(screen.getByLabelText(/select sandbox/i))
    fireEvent.click(screen.getByText('Create New Box'))
    
    expect(onCreateNew).toHaveBeenCalled()
  })
})
