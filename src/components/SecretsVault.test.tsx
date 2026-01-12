import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SecretsVault } from './SecretsVault'
import { api } from '../lib/api'

vi.mock('../lib/api', () => ({
  api: {
    getBoxSecrets: vi.fn(),
    createBoxSecret: vi.fn(),
    deleteBoxSecret: vi.fn(),
  }
}))

describe('SecretsVault Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and fetched secrets', async () => {
    const mockSecrets = [
      { id: '1', name: 'ANTHROPIC_API_KEY', hint: 'api03', createdAt: Date.now() / 1000 },
      { id: '2', name: 'GITHUB_TOKEN', hint: 'abcd', createdAt: Date.now() / 1000 },
    ]
    vi.mocked(api.getBoxSecrets).mockResolvedValue(mockSecrets)

    render(<SecretsVault />)
    
    expect(screen.getByText('Secrets Vault')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('ANTHROPIC_API_KEY')).toBeInTheDocument()
      expect(screen.getByText('GITHUB_TOKEN')).toBeInTheDocument()
    })
    
    expect(screen.getByText(/••••••••api03/)).toBeInTheDocument()
    expect(screen.getByText(/••••••••abcd/)).toBeInTheDocument()
  })

  it('shows empty state when no secrets', async () => {
    vi.mocked(api.getBoxSecrets).mockResolvedValue([])

    render(<SecretsVault />)
    
    await waitFor(() => {
      expect(screen.getByText(/No secrets found in your vault/)).toBeInTheDocument()
    })
  })

  it('toggles add secret form', async () => {
    vi.mocked(api.getBoxSecrets).mockResolvedValue([])

    render(<SecretsVault />)
    
    const addButton = screen.getByText('Add Secret')
    fireEvent.click(addButton)
    
    expect(screen.getByPlaceholderText('e.g. GITHUB_TOKEN')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Paste value here')).toBeInTheDocument()
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(screen.queryByPlaceholderText('e.g. GITHUB_TOKEN')).not.toBeInTheDocument()
  })

  it('can create a new secret', async () => {
    vi.mocked(api.getBoxSecrets).mockResolvedValue([])
    vi.mocked(api.createBoxSecret).mockResolvedValue({ id: '3', name: 'NEW_SECRET', hint: '1234', createdAt: Date.now() / 1000 })

    render(<SecretsVault />)
    
    fireEvent.click(screen.getByText('Add Secret'))
    
    fireEvent.change(screen.getByPlaceholderText('e.g. GITHUB_TOKEN'), { target: { value: 'NEW_SECRET' } })
    fireEvent.change(screen.getByPlaceholderText('Paste value here'), { target: { value: 'secret-value' } })
    
    fireEvent.click(screen.getByText('Save Secret'))
    
    await waitFor(() => {
      expect(api.createBoxSecret).toHaveBeenCalledWith('NEW_SECRET', 'secret-value')
      expect(api.getBoxSecrets).toHaveBeenCalledTimes(2) // Initial + refresh
    })
  })
})
