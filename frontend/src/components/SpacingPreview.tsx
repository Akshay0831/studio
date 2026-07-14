import React from 'react'
import { useThemeConfig } from '../core/ThemeConfigContext'
import { MaterialButton } from './common/MaterialButton'

export const SpacingPreview: React.FC = () => {
  const { globalSpacingScale } = useThemeConfig()

  return (
    <div className="bg-studio-panel rounded-lg p-6">
      <h3 className="text-lg font-semibold text-studio-text mb-4">Spacing Scale Preview</h3>
      
      <div className="space-y-6">
        {/* XS Spacing */}
        <div>
          <div className="text-sm text-studio-text mb-2">Extra Small (xs): {globalSpacingScale.xs}</div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-studio-accent rounded-lg flex items-center justify-center text-white text-xs">Item 1</div>
            <div className="w-12 h-12 bg-studio-secondary rounded-lg flex items-center justify-center text-white text-xs">Item 2</div>
            <div className="w-12 h-12 bg-studio-error rounded-lg flex items-center justify-center text-white text-xs">Item 3</div>
          </div>
        </div>

        {/* SM Spacing */}
        <div>
          <div className="text-sm text-studio-text mb-2">Small (sm): {globalSpacingScale.sm}</div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-studio-accent rounded-lg flex items-center justify-center text-white text-sm">Item 1</div>
            <div className="w-16 h-16 bg-studio-secondary rounded-lg flex items-center justify-center text-white text-sm">Item 2</div>
            <div className="w-16 h-16 bg-studio-error rounded-lg flex items-center justify-center text-white text-sm">Item 3</div>
          </div>
        </div>

        {/* MD Spacing */}
        <div>
          <div className="text-sm text-studio-text mb-2">Medium (md): {globalSpacingScale.md}</div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-studio-accent rounded-lg flex items-center justify-center text-white">Item 1</div>
            <div className="w-20 h-20 bg-studio-secondary rounded-lg flex items-center justify-center text-white">Item 2</div>
            <div className="w-20 h-20 bg-studio-error rounded-lg flex items-center justify-center text-white">Item 3</div>
          </div>
        </div>

        {/* LG Spacing */}
        <div>
          <div className="text-sm text-studio-text mb-2">Large (lg): {globalSpacingScale.lg}</div>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-studio-accent rounded-lg flex items-center justify-center text-white">Item 1</div>
            <div className="w-24 h-24 bg-studio-secondary rounded-lg flex items-center justify-center text-white">Item 2</div>
            <div className="w-24 h-24 bg-studio-error rounded-lg flex items-center justify-center text-white">Item 3</div>
          </div>
        </div>

        {/* XL Spacing */}
        <div>
          <div className="text-sm text-studio-text mb-2">Extra Large (xl): {globalSpacingScale.xl}</div>
          <div className="flex items-center gap-8">
            <div className="w-28 h-28 bg-studio-accent rounded-lg flex items-center justify-center text-white">Item 1</div>
            <div className="w-28 h-28 bg-studio-secondary rounded-lg flex items-center justify-center text-white">Item 2</div>
            <div className="w-28 h-28 bg-studio-error rounded-lg flex items-center justify-center text-white">Item 3</div>
          </div>
        </div>
      </div>

      {/* Real-world component example */}
      <div className="mt-8">
        <h4 className="text-sm text-studio-text mb-3">Component Example with Current Scale</h4>
        <div className="flex flex-wrap gap-4">
          <MaterialButton variant="primary" size="md">Primary Button</MaterialButton>
          <MaterialButton variant="secondary" size="md">Secondary Button</MaterialButton>
          <MaterialButton variant="outline" size="md">Outline Button</MaterialButton>
          <MaterialButton variant="ghost" size="md">Ghost Button</MaterialButton>
        </div>
      </div>

      {/* Form example */}
      <div className="mt-8">
        <h4 className="text-sm text-studio-text mb-3">Form Example</h4>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Email address"
              className="w-full px-4 py-2 bg-studio-panel border border-studio-border rounded-lg text-studio-text placeholder-studio-text-dim focus:outline-none focus:ring-2 focus:ring-studio-accent"
            />
          </div>
          <div className="flex gap-4">
            <MaterialButton variant="primary" size="md">Submit</MaterialButton>
            <MaterialButton variant="outline" size="md">Cancel</MaterialButton>
          </div>
        </div>
      </div>
    </div>
  )
}