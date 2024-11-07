import { render, screen } from '@testing-library/react'
import Navbar from '@/components/NavBar'
import { useTheme } from 'next-themes'
import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest'
import ctrl from '@/app/_assets/ctrl.svg'
import { cleanup } from '@testing-library/react'

// Mock `useTheme` from `next-themes`
vi.mock('next-themes', () => ({
  useTheme: vi.fn()
}))

// Mock `next/image` to avoid issues with Next.js's Image component in tests
vi.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: any) => <img {...props} />
}))

describe('Navbar Component', () => {
  beforeEach(() => {
    ;(useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      setTheme: vi.fn()
    })
  })
  describe('Renders', () => {
    afterEach(cleanup)

    it('renders title,', () => {
      render(<Navbar />)

      expect(screen.getByText('Instant Send App').textContent).toBe('Instant Send App')
    })
    it('renders image', () => {
      render(<Navbar />)
      const ctrl_image = ctrl
      expect(screen.getByTestId('ctrl-image').getAttribute('src')).toBe(ctrl)
    })
  })
  // it('sets the theme to dark on mount', () => {
  //   const setTheme = vi.fn()
  //   ;(useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
  //     setTheme
  //   })
  //   render(<Navbar />)
  //   expect(setTheme).toHaveBeenCalledWith('dark')
  // })
})
