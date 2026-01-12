import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BoxWorkspace } from './BoxWorkspace'

describe('BoxWorkspace Component', () => {
  const sandbox = {
    id: 'sb-1',
    title: 'Test Box',
    status: 'active',
    webUiUrl: 'https://preview.shipbox.dev/sb-1'
  }
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock scrollBy/scrollTo
    Element.prototype.scrollTo = vi.fn()
  })

  it('renders the header and back button', () => {
    render(<BoxWorkspace sandbox={sandbox as any} onClose={onClose} />)
    
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
    expect(screen.getAllByText('Test Box').length).toBeGreaterThan(0)
  })

  it('renders the chat panel and iframe', () => {
    render(<BoxWorkspace sandbox={sandbox as any} onClose={onClose} />)
    
    expect(screen.getByPlaceholderText(/Ask your agent anything/i)).toBeInTheDocument()
    expect(screen.getByTitle(/Test Box Preview/i)).toBeInTheDocument()
    expect(screen.getByTitle(/Test Box Preview/i)).toHaveAttribute('src', sandbox.webUiUrl)
  })

  it('toggles fullscreen mode', () => {
    render(<BoxWorkspace sandbox={sandbox as any} onClose={onClose} />)
    
    const chatInput = screen.queryByPlaceholderText(/Ask your agent anything/i)
    expect(chatInput).toBeInTheDocument()

    const fullscreenButton = screen.getAllByRole('button').find(b => b.querySelector('.lucide-maximize2'))
    if (!fullscreenButton) throw new Error('Fullscreen button not found')
    
    fireEvent.click(fullscreenButton)
    
    // Chat panel should be hidden in fullscreen
    expect(screen.queryByPlaceholderText(/Ask your agent anything/i)).not.toBeInTheDocument()
  })

  it('calls onClose when back button is clicked', () => {
    render(<BoxWorkspace sandbox={sandbox as any} onClose={onClose} />)
    
    fireEvent.click(screen.getByText('Back to Dashboard'))
    expect(onClose).toHaveBeenCalled()
  })
})
