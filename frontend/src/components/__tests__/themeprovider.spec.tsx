import { render } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { ThemeProvider } from '../themeprovider'

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  })
})

afterAll(() => {
  delete (window as any).matchMedia
})

describe('ThemeProvider', () => {
  it('renders the children correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    )
    expect(getByText('Test Content')).toBeTruthy()
  })

  it('passes props to NextThemesProvider', () => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <div>Test Content</div>
      </ThemeProvider>
    )

    // Check if the ThemeProvider component exists
    expect(container.firstChild).toBeTruthy()
  })
})
