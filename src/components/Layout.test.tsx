import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Layout } from './Layout'
import { sandboxFactory } from '../test-utils'

// Mock sub-components to isolate Layout tests
vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />
}))
vi.mock('./SandboxSelector', () => ({
  SandboxSelector: () => <div data-testid="sandbox-selector" />
}))
vi.mock('./AuditBadge', () => ({
  AuditBadge: () => <div data-testid="audit-badge" />
}))

describe('Layout Component', () => {
  const defaultProps = {
    activeTab: 'dashboard',
    onTabChange: vi.fn(),
    onKill: vi.fn(),
    isKilled: false,
    activeSandbox: sandboxFactory({ title: 'Sandbox 1' }),
    sandboxes: [],
    onSelectSandbox: vi.fn(),
    onCreateSandbox: vi.fn(),
  }

  it('renders sidebar, header and children', () => {
    render(
      <Layout {...defaultProps}>
        <div data-testid="child">Content</div>
      </Layout>
    )
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByTestId('sandbox-selector')).toBeInTheDocument()
  })

  it('shows "Agent Online" when not killed', () => {
    render(<Layout {...defaultProps}>Content</Layout>)
    expect(screen.getByText('Agent Online')).toBeInTheDocument()
  })

  it('shows "Emergency Stop" when killed', () => {
    render(<Layout {...defaultProps} isKilled={true}>Content</Layout>)
    
    expect(screen.getByText('Sandbox Killed')).toBeInTheDocument()
    expect(screen.getByText('Emergency Stop Triggered')).toBeInTheDocument()
    expect(screen.getByText('Terminated')).toBeInTheDocument()
  })

  it('calls onKill when kill button is clicked', () => {
    render(<Layout {...defaultProps}>Content</Layout>)
    
    fireEvent.click(screen.getByText('Kill Sandbox'))
    expect(defaultProps.onKill).toHaveBeenCalled()
  })
})
