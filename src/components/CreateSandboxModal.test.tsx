import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreateSandboxModal } from './CreateSandboxModal'

// Mock the api module
vi.mock('../lib/api', () => ({
  api: {
    getGitHubRepos: vi.fn().mockResolvedValue([]),
    getAuthToken: vi.fn().mockResolvedValue('token-123'),
    getSession: vi.fn().mockResolvedValue({ status: 'active' }),
  },
}))

describe('CreateSandboxModal', () => {
  it('renders correctly when open', async () => {
    await act(async () => {
      render(
        <CreateSandboxModal 
          isOpen={true} 
          onClose={vi.fn()} 
          onCreate={vi.fn().mockResolvedValue({ id: 'sess-123' })} 
        />
      )
    })
    
    expect(screen.getByText(/New Sandbox Box/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. My New Agent/i)).toBeInTheDocument()
  })

  it('calls onCreate with correct data', async () => {
    const onCreate = vi.fn().mockResolvedValue({ id: 'sess-123' })
    await act(async () => {
      render(
        <CreateSandboxModal 
          isOpen={true} 
          onClose={vi.fn()} 
          onCreate={onCreate} 
        />
      )
    })
    
    const nameInput = screen.getByPlaceholderText(/e.g. My New Agent/i)
    fireEvent.change(nameInput, { target: { value: 'My Agent' } })
    
    const createButton = screen.getByText(/Initialise Sandbox/i)
    fireEvent.click(createButton)
    
    expect(onCreate).toHaveBeenCalledWith('My Agent', 'lhr', undefined)
  })

  it('disables button when name is empty', async () => {
    await act(async () => {
      render(
        <CreateSandboxModal 
          isOpen={true} 
          onClose={vi.fn()} 
          onCreate={vi.fn().mockResolvedValue({ id: 'sess-123' })} 
        />
      )
    })
    
    const createButton = screen.getByText(/Initialise Sandbox/i)
    expect(createButton).toBeDisabled()
  })

  it('shows loading state during creation', async () => {
    let resolveCreate: (value: { id: string } | PromiseLike<{ id: string }>) => void = () => {};
    const onCreate = vi.fn().mockReturnValue(new Promise<{ id: string }>((resolve) => {
      resolveCreate = resolve;
    }));
    
    await act(async () => {
      render(
        <CreateSandboxModal 
          isOpen={true} 
          onClose={vi.fn()} 
          onCreate={onCreate} 
        />
      )
    })
    
    const nameInput = screen.getByPlaceholderText(/e.g. My New Agent/i)
    fireEvent.change(nameInput, { target: { value: 'My Agent' } })
    
    const createButton = screen.getByText(/Initialise Sandbox/i)
    fireEvent.click(createButton)
    
    expect(screen.getByText(/Initialising.../i)).toBeInTheDocument()
    expect(createButton).toBeDisabled()
    
    await act(async () => {
      resolveCreate({ id: 'sess-123' });
    });
  })
})
