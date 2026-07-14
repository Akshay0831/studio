import React from 'react'
import { ThemeCustomizationPanel } from './ThemeCustomizationPanel'
import { SpacingPreview } from './SpacingPreview'
import { MaterialButton } from './common/MaterialButton'
import { MaterialCard, MaterialCardHeader, MaterialCardContent } from './common/MaterialCard'
import { MaterialInput } from './common/MaterialInput'
import { MaterialSelect } from './common/MaterialInput'
import { GridContainer, FlexContainer, StackContainer } from './ResponsiveLayout'

export const ThemeDemoPage: React.FC = () => {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [selectedTheme, setSelectedTheme] = React.useState('default')

  const themeOptions = [
    { value: 'default', label: 'Default Theme' },
    { value: 'vibrant', label: 'Vibrant Colors' },
    { value: 'minimal', label: 'Minimal Design' },
    { value: 'custom', label: 'Custom Theme' }
  ]

  return (
    <div className="min-h-screen bg-studio-bg p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-studio-text mb-2">
            Material Design Theme System
          </h1>
          <p className="text-lg text-studio-text-dim">
            Experience responsive, accessible components with user-configurable spacing and themes
          </p>
        </div>

        {/* Quick Demo Section */}
        <MaterialCard variant="elevated" elevation={6} className="mb-8">
          <MaterialCardHeader 
            title="Component Showcase" 
            subtitle="Interactive examples of all Material Design components"
          />
          <MaterialCardContent>
            <GridContainer cols={2} gap="lg">
              {/* Button Variants */}
              <div>
                <h3 className="text-lg font-semibold text-studio-text mb-4">Button Variants</h3>
                <FlexContainer direction="col" gap="sm">
                  <MaterialButton variant="primary">Primary</MaterialButton>
                  <MaterialButton variant="secondary">Secondary</MaterialButton>
                  <MaterialButton variant="outline">Outline</MaterialButton>
                  <MaterialButton variant="ghost">Ghost</MaterialButton>
                  <MaterialButton variant="destructive">Destructive</MaterialButton>
                </FlexContainer>
              </div>

              {/* Button Sizes */}
              <div>
                <h3 className="text-lg font-semibold text-studio-text mb-4">Button Sizes</h3>
                <FlexContainer direction="col" gap="sm">
                  <MaterialButton size="xs">Extra Small</MaterialButton>
                  <MaterialButton size="sm">Small</MaterialButton>
                  <MaterialButton size="md">Medium</MaterialButton>
                  <MaterialButton size="lg">Large</MaterialButton>
                  <MaterialButton size="xl">Extra Large</MaterialButton>
                </FlexContainer>
              </div>

              {/* Card Variants */}
              <div>
                <h3 className="text-lg font-semibold text-studio-text mb-4">Card Variants</h3>
                <div className="space-y-4">
                  <MaterialCard variant="elevated" elevation={2}>
                    <MaterialCardContent>Elevated Card</MaterialCardContent>
                  </MaterialCard>
                  <MaterialCard variant="outlined">
                    <MaterialCardContent>Outlined Card</MaterialCardContent>
                  </MaterialCard>
                  <MaterialCard variant="filled">
                    <MaterialCardContent>Filled Card</MaterialCardContent>
                  </MaterialCard>
                </div>
              </div>

              {/* Interactive Cards */}
              <div>
                <h3 className="text-lg font-semibold text-studio-text mb-4">Interactive Cards</h3>
                <MaterialCard 
                  variant="elevated" 
                  elevation={3} 
                  hover={true}
                  clickable={true}
                  onClick={() => alert('Card clicked!')}
                >
                  <MaterialCardHeader 
                    title="Clickable Card" 
                    subtitle="Hover to see elevation change"
                  />
                  <MaterialCardContent>
                    <p className="text-sm text-studio-text-dim">
                      This card responds to hover and click interactions with Material Design animations.
                    </p>
                  </MaterialCardContent>
                </MaterialCard>
              </div>
            </GridContainer>
          </MaterialCardContent>
        </MaterialCard>

        {/* Form Demo */}
        <MaterialCard variant="outlined" elevation={4} className="mb-8">
          <MaterialCardHeader 
            title="Form Components" 
            subtitle="Material Design form inputs with validation and icons"
          />
          <MaterialCardContent>
            <GridContainer cols={1} gap="lg">
              <div>
                <MaterialInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={setName}
                  required
                  startIcon="👤"
                />
              </div>
              
              <div>
                <MaterialInput
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChange={setEmail}
                  required
                  error={!email && name ? true : undefined}
                  helperText={!email && name ? 'Please enter a valid email address' : ''}
                  startIcon="✉️"
                />
              </div>
              
              <div>
                <MaterialSelect
                  label="Select Theme"
                  options={themeOptions}
                  value={selectedTheme}
                  onChange={setSelectedTheme}
                  required
                />
              </div>
              
              <div className="flex gap-4">
                <MaterialButton 
                  variant="primary" 
                  disabled={!name || !email}
                  onClick={() => alert(`Form submitted: ${name} (${email})`)}
                >
                  Submit Form
                </MaterialButton>
                <MaterialButton variant="outline" onClick={() => { setName(''); setEmail(''); setSelectedTheme('default'); }}>
                  Clear Form
                </MaterialButton>
              </div>
            </GridContainer>
          </MaterialCardContent>
        </MaterialCard>

        {/* Layout Demo */}
        <MaterialCard variant="outlined" elevation={4} className="mb-8">
          <MaterialCardHeader 
            title="Responsive Layouts" 
            subtitle="Adaptive layouts that work on all screen sizes"
          />
          <MaterialCardContent>
            {/* Grid Layout */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-studio-text mb-4">Grid Layout</h3>
              <GridContainer cols={3} gap="md">
                <MaterialCard variant="filled">
                  <MaterialCardContent>Grid Item 1</MaterialCardContent>
                </MaterialCard>
                <MaterialCard variant="filled">
                  <MaterialCardContent>Grid Item 2</MaterialCardContent>
                </MaterialCard>
                <MaterialCard variant="filled">
                  <MaterialCardContent>Grid Item 3</MaterialCardContent>
                </MaterialCard>
              </GridContainer>
            </div>

            {/* Flex Layout */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-studio-text mb-4">Flex Layout</h3>
              <FlexContainer direction="row" justify="between" align="center" gap="lg">
                <MaterialCard variant="filled">
                  <MaterialCardContent>Left</MaterialCardContent>
                </MaterialCard>
                <MaterialCard variant="filled">
                  <MaterialCardContent>Center</MaterialCardContent>
                </MaterialCard>
                <MaterialCard variant="filled">
                  <MaterialCardContent>Right</MaterialCardContent>
                </MaterialCard>
              </FlexContainer>
            </div>

            {/* Stack Layout */}
            <div>
              <h3 className="text-lg font-semibold text-studio-text mb-4">Stack Layout</h3>
              <StackContainer spacing="md" align="center">
                <MaterialButton variant="primary">Action 1</MaterialButton>
                <MaterialButton variant="secondary">Action 2</MaterialButton>
                <MaterialButton variant="outline">Action 3</MaterialButton>
              </StackContainer>
            </div>
          </MaterialCardContent>
        </MaterialCard>

        {/* Spacing Preview */}
        <MaterialCard variant="outlined" elevation={4} className="mb-8">
          <MaterialCardHeader 
            title="Spacing System" 
            subtitle="Interactive preview of different spacing scales"
          />
          <MaterialCardContent>
            <SpacingPreview />
          </MaterialCardContent>
        </MaterialCard>

        {/* Animation Demo */}
        <MaterialCard variant="outlined" elevation={4} className="mb-8">
          <MaterialCardHeader 
            title="Material Design Animations" 
            subtitle="Smooth, purposeful animations following Material principles"
          />
          <MaterialCardContent>
            <FlexContainer direction="col" gap="lg">
              <div>
                <h3 className="text-lg font-semibold text-studio-text mb-4">Interactive Elements</h3>
                <FlexContainer gap="md">
                  <MaterialButton 
                    variant="primary"
                    onClick={() => alert('Button clicked with Material Design ripple!')}
                  >
                    Click for Ripple Effect
                  </MaterialButton>
                  <MaterialCard 
                    variant="elevated" 
                    elevation={3}
                    hover={true}
                    clickable={true}
                    onClick={() => alert('Card clicked with Material Design elevation animation!')}
                  >
                    <MaterialCardContent>Hover & Click Me</MaterialCardContent>
                  </MaterialCard>
                </FlexContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-studio-text mb-4">Loading States</h3>
                <FlexContainer gap="md">
                  <MaterialButton loading={true}>Loading Button</MaterialButton>
                  <MaterialButton loading={true} variant="secondary">Loading Secondary</MaterialButton>
                </FlexContainer>
              </div>
            </FlexContainer>
          </MaterialCardContent>
        </MaterialCard>

        {/* Theme Customization */}
        <MaterialCard variant="outlined" elevation={4}>
          <MaterialCardHeader 
            title="Theme Customization" 
            subtitle="Configure your perfect workspace experience"
          />
          <MaterialCardContent>
            <ThemeCustomizationPanel />
          </MaterialCardContent>
        </MaterialCard>

        {/* Footer */}
        <div className="text-center py-8 text-studio-text-dim">
          <p>Built with Material Design principles and React for optimal user experience</p>
          <p className="text-sm mt-2">All components are fully responsive and accessible</p>
        </div>
      </div>
    </div>
  )
}