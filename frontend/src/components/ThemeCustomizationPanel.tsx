import React from 'react'
import { useThemeConfig } from '../core/ThemeConfigContext'
import { MaterialCard, MaterialCardHeader, MaterialCardContent, MaterialCardFooter } from './common/MaterialCard'
import { MaterialButton } from './common/MaterialButton'

export const ThemeCustomizationPanel: React.FC = () => {
  const { theme, setTheme } = useThemeConfig()

  const spacingOptions = [
    { key: 'tight', label: 'Tight', description: 'Maximum space efficiency' },
    { key: 'normal', label: 'Normal', description: 'Balanced spacing' },
    { key: 'comfortable', label: 'Comfortable', description: 'Extra breathing room' },
    { key: 'spacious', label: 'Spacious', description: 'Lots of space' },
    { key: 'extra-spacious', label: 'Extra Spacious', description: 'Maximum spacing' }
  ]

  const densityOptions = [
    { key: 'compact', label: 'Compact', description: 'More content, less space' },
    { key: 'normal', label: 'Normal', description: 'Balanced density' },
    { key: 'comfortable', label: 'Comfortable', description: 'More relaxed spacing' }
  ]

  const borderRadiusOptions = [
    { key: 'minimal', label: 'Minimal', description: 'Sharp corners' },
    { key: 'normal', label: 'Normal', description: 'Standard rounding' },
    { key: 'rounded', label: 'Rounded', description: 'Softer corners' },
    { key: 'extra-rounded', label: 'Extra Rounded', description: 'Very soft corners' }
  ]

  const animationOptions = [
    { key: 'none', label: 'None', description: 'No animations' },
    { key: 'minimal', label: 'Minimal', description: 'Subtle animations' },
    { key: 'standard', label: 'Standard', description: 'Balanced animations' },
    { key: 'enhanced', label: 'Enhanced', description: 'Rich animations' }
  ]

  const accentColors = [
    { key: 'primary', label: 'Primary', color: 'bg-indigo-500' },
    { key: 'secondary', label: 'Secondary', color: 'bg-violet-500' },
    { key: 'accent', label: 'Accent', color: 'bg-blue-500' },
    { key: 'success', label: 'Success', color: 'bg-green-500' },
    { key: 'error', label: 'Error', color: 'bg-red-500' },
    { key: 'warning', label: 'Warning', color: 'bg-yellow-500' }
  ]

  const themeModes = [
    { key: 'light', label: 'Light', icon: '☀️' },
    { key: 'dark', label: 'Dark', icon: '🌙' },
    { key: 'auto', label: 'Auto', icon: '🌗' }
  ]

  return (
    <MaterialCard variant="outlined" elevation={4} className="w-full max-w-2xl mx-auto">
      <MaterialCardHeader 
        title="Theme & Appearance" 
        subtitle="Customize your studio experience"
      />
      
      <MaterialCardContent>
        {/* Theme Mode */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-studio-text mb-3">Theme Mode</h4>
          <div className="flex gap-2">
            {themeModes.map((mode) => (
              <MaterialButton
                key={mode.key}
                variant={theme.mode === mode.key ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTheme({ mode: mode.key as any })}
                className="flex items-center gap-2"
              >
                <span>{mode.icon}</span>
                {mode.label}
              </MaterialButton>
            ))}
          </div>
        </div>

        {/* Spacing Scale */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-studio-text mb-3">Spacing Scale</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {spacingOptions.map((option) => (
              <MaterialButton
                key={option.key}
                variant={theme.spacing === option.key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme({ spacing: option.key as any })}
                className="text-left h-auto p-3"
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-studio-text-dim mt-1">{option.description}</div>
              </MaterialButton>
            ))}
          </div>
        </div>

        {/* Density */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-studio-text mb-3">Component Density</h4>
          <div className="flex gap-2">
            {densityOptions.map((density) => (
              <MaterialButton
                key={density.key}
                variant={theme.density === density.key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme({ density: density.key as any })}
              >
                {density.label}
              </MaterialButton>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-studio-text mb-3">Corner Style</h4>
          <div className="flex gap-2 flex-wrap">
            {borderRadiusOptions.map((radius) => (
              <MaterialButton
                key={radius.key}
                variant={theme.borderRadius === radius.key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme({ borderRadius: radius.key as any })}
              >
                {radius.label}
              </MaterialButton>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-studio-text mb-3">Accent Color</h4>
          <div className="flex gap-2 flex-wrap">
            {accentColors.map((color) => (
              <MaterialButton
                key={color.key}
                variant={theme.accentColor === color.key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme({ accentColor: color.key as any })}
                className="flex items-center gap-2"
              >
                <div className={`w-4 h-4 rounded-full ${color.color}`} />
                {color.label}
              </MaterialButton>
            ))}
          </div>
        </div>

        {/* Animations */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-studio-text mb-3">Animation Level</h4>
          <div className="flex gap-2 flex-wrap">
            {animationOptions.map((animation) => (
              <MaterialButton
                key={animation.key}
                variant={theme.animations === animation.key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTheme({ animations: animation.key as any })}
              >
                {animation.label}
              </MaterialButton>
            ))}
          </div>
        </div>
      </MaterialCardContent>

      <MaterialCardFooter>
        <MaterialButton
          variant="secondary"
          onClick={() => {
            // Reset to defaults
            setTheme({
              mode: 'dark',
              density: 'normal',
              spacing: 'normal',
              accentColor: 'primary',
              borderRadius: 'normal',
              animations: 'standard'
            })
          }}
        >
          Reset to Defaults
        </MaterialButton>
      </MaterialCardFooter>
    </MaterialCard>
  )
}