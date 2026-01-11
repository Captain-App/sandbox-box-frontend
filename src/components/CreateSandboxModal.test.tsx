import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreateSandboxModal } from './CreateSandboxModal'

describe('CreateSandboxModal', () => {
  it('renders correctly when open', () => {
    render(
      <CreateSandboxModal 
        isOpen={true} 
        onClose={vi.fn()} 
        onCreate={vi.fn()} 
      />
    )
    
    expect(screen.getByText(/New Sandbox Box/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. My New Agent/i)).toBeInTheDocument()
  })

  it('calls onCreate with correct data', () => {
    const onCreate = vi.fn()
    render(
      <CreateSandboxModal 
        isOpen={true} 
        onClose={vi.fn()} 
        onCreate={onCreate} 
      />
    )
    
    const nameInput = screen.getByPlaceholderText(/e.g. My New Agent/i)
    fireEvent.change(nameInput, { target: { value: 'My Agent' } })
    
    const createButton = screen.getByText(/Initialise Sandbox/i)
    fireEvent.click(createButton)
    
    expect(onCreate).toHaveBeenCalledWith('My Agent', 'lhr', '')
  })

  it('disables button when name is empty', () => {
    render(
      <CreateSandboxModal 
        isOpen={true} 
        onClose={vi.fn()} 
        onCreate={vi.fn()} 
      />
    )
    
    const createButton = screen.getByText(/Initialise Sandbox/i)
    expect(createButton).toBeDisabled()
  })
})
