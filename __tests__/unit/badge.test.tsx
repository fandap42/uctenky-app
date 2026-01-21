import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '@/components/ui/badge'
import React from 'react'

describe('Badge Component', () => {
    it('renders correctly with children', () => {
        render(<Badge>Test Badge</Badge>)
        expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('applies default variant classes', () => {
        render(<Badge>Default</Badge>)
        const badge = screen.getByText('Default')
        expect(badge).toHaveClass('bg-primary')
    })

    it('applies destructive variant classes', () => {
        render(<Badge variant="destructive">Destructive</Badge>)
        const badge = screen.getByText('Destructive')
        expect(badge).toHaveClass('bg-destructive')
    })

    it('renders as a custom child when asChild is true', () => {
        render(
            <Badge asChild>
                <a href="/test">Link Badge</a>
            </Badge>
        )
        const link = screen.getByRole('link', { name: /link badge/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/test')
    })
})
