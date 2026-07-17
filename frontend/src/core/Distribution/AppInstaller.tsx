import React, { useState, useEffect } from 'react';
import { 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Package,
  Shield,
  Monitor,
  Smartphone,
  Globe,
  FileText,
  Zap,
  Box,
  Users,
  Settings,
  RefreshCw,
  BarChart3,
  Layers,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  Check,
  ExternalLink
} from 'lucide-react';

interface InstallationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  timeRemaining?: number;
  log?: string;
}

interface SystemRequirement {
  id: string;
  name: string;
  description: string;
  status: 'satisfied' | 'warning' | 'failed';
  required: boolean;
  currentValue?: string | number;
  requiredValue?: string | number;
}

interface InstallationOption {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  default: boolean;
  required: boolean;
}

interface InstallerState {
  currentStep: number;
  steps: InstallationStep[];
  systemRequirements: SystemRequirement[];
  options: InstallationOption[];
  isInstalling: boolean;
  isComplete: boolean;
  installPath: string;
  shortcuts: boolean;
  desktopIcon: boolean;
  autoStart: boolean;
  telemetry: boolean;
}

const AppInstaller: React.FC = () => {
  const [installerState, setInstallerState] = useState<InstallerState>({
    currentStep: 0,
    steps: [
      {
        id: 'welcome',
        name: 'Welcome',
        description: 'Welcome to Studio Pro Installation',
        status: 'pending',
        progress: 0
      },
      {
        id: 'system-check',
        name: 'System Check',
        description: 'Checking system compatibility',
        status: 'pending',
        progress: 0
      },
      {
        id: 'license-agreement',
        name: 'License Agreement',
        description: 'Review the software license agreement',
        status: 'pending',
        progress: 0
      },
      {
        id: 'installation-options',
        name: 'Installation Options',
        description: 'Choose installation preferences',
        status: 'pending',
        progress: 0
      },
      {
        id: 'installation',
        name: 'Installation',
        description: 'Installing Studio Pro',
        status: 'pending',
        progress: 0
      },
      {
        id: 'configuration',
        name: 'Configuration',
        description: 'Setting up initial configuration',
        status: 'pending',
        progress: 0
      },
      {
        id: 'complete',
        name: 'Complete',
        description: 'Installation completed successfully',
        status: 'pending',
        progress: 0
      }
    ],
    systemRequirements: [
      {
        id: 'os',
        name: 'Operating System',
        description: 'Windows 10 64-bit or later',
        status: 'satisfied',
        required: true,
        currentValue: 'Windows 11',
        requiredValue: 'Windows 10 64-bit'
      },
      {
        id: 'ram',
        name: 'Memory (RAM)',
        description: 'Minimum 4 GB RAM',
        status: 'satisfied',
        required: true,
        currentValue: '16 GB',
        requiredValue: '4 GB'
      },
      {
        id: 'storage',
        name: 'Storage Space',
        description: 'Minimum 500 MB available space',
        status: 'satisfied',
        required: true,
        currentValue: '2 TB available',
        requiredValue: '500 MB'
      },
      {
        id: 'graphics',
        name: 'Graphics Card',
        description: 'DirectX 11 compatible',
        status: 'warning',
        required: false,
        currentValue: 'Intel HD Graphics',
        requiredValue: 'DirectX 11 compatible'
      },
      {
        id: '.net',
        name: '.NET Framework',
        description: '.NET 6.0 Runtime or later',
        status: 'satisfied',
        required: true,
        currentValue: '.NET 8.0',
        requiredValue: '.NET 6.0'
      }
    ],
    options: [
      {
        id: 'shortcuts',
        name: 'Create Desktop Shortcut',
        description: 'Create a desktop shortcut for easy access',
        enabled: true,
        default: true,
        required: false
      },
      {
        id: 'start-menu',
        name: 'Add to Start Menu',
        description: 'Add Studio Pro to the Windows Start Menu',
        enabled: true,
        default: true,
        required: false
      },
      {
        id: 'auto-start',
        name: 'Auto-start with Windows',
        description: 'Start Studio Pro automatically when Windows boots',
        enabled: false,
        default: false,
        required: false
      },
      {
        id: 'telemetry',
        name: 'Usage Analytics',
        description: 'Help improve Studio Pro by sending anonymous usage data',
        enabled: false,
        default: false,
        required: false
      },
      {
        id: 'file-associations',
        name: 'File Associations',
        description: 'Set Studio Pro as default handler for project files',
        enabled: true,
        default: true,
        required: false
      }
    ],
    isInstalling: false,
    isComplete: false,
    installPath: 'C:\\Program Files\\Studio Pro',
    shortcuts: true,
    desktopIcon: true,
    autoStart: false,
    telemetry: false
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInstallPath, setSelectedInstallPath] = useState(installerState.installPath);

  const getStepIcon = (status: string, stepIndex: number) => {
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (status === 'failed') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else if (status === 'in-progress') {
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    } else {
      return <div className={`w-5 h-5 rounded-full border-2 ${
        stepIndex === currentStep 
          ? 'border-studio-accent' 
          : 'border-studio-border'
      }`} />;
    }
  };

  const getStepColor = (status: string, stepIndex: number) => {
    if (status === 'completed') {
      return 'text-green-500';
    } else if (status === 'failed') {
      return 'text-red-500';
    } else if (status === 'in-progress') {
      return 'text-blue-500';
    } else {
      return stepIndex === currentStep ? 'text-studio-accent' : 'text-studio-text-dim';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'satisfied': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-studio-text-dim';
    }
  };

  const getRequirementIcon = (status: string) => {
    switch (status) {
      case 'satisfied': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-studio-text-dim" />;
    }
  };

  const simulateInstallation = async () => {
    setInstallerState(prev => ({
      ...prev,
      isInstalling: true,
      steps: prev.steps.map((step, index) => 
        index === 4 ? { ...step, status: 'in-progress', progress: 0 } : step
      )
    }));

    // Simulate installation progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setInstallerState(prev => ({
        ...prev,
        steps: prev.steps.map((step, index) =>
          index === 4 ? { ...step, progress: i } : step
        )
      }));
    }

    setInstallerState(prev => ({
      ...prev,
      steps: prev.steps.map((step, index) =>
        index === 4 ? { ...step, status: 'completed' } : step
      ),
      currentStep: 5,
      isInstalling: false
    }));
  };

  const startInstallation = async () => {
    setCurrentStep(4);
    await simulateInstallation();
  };

  const completeInstallation = () => {
    setInstallerState(prev => ({
      ...prev,
      steps: prev.steps.map((step, index) =>
        index === 6 ? { ...step, status: 'completed' } : step
      ),
      isComplete: true
    }));
  };

  const changeStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < installerState.steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  const toggleOption = (optionId: string) => {
    setInstallerState(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === optionId ? { ...option, enabled: !option.enabled } : option
      )
    }));
  };

  const browseInstallPath = () => {
    // This would open a file browser dialog
    setSelectedInstallPath('C:\\Program Files\\Studio Pro');
    setInstallerState(prev => ({
      ...prev,
      installPath: 'C:\\Program Files\\Studio Pro'
    }));
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'in-progress': return 'bg-studio-accent';
      default: return 'bg-studio-border';
    }
  };

  return (
    <div className="flex flex-col h-full bg-studio-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-studio-accent" />
          <div>
            <h2 className="text-lg font-semibold text-studio-text">Studio Pro Installer</h2>
            <p className="text-sm text-studio-text-dim">Version 1.0.0</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-studio-hover rounded text-sm text-studio-text hover:bg-studio-hover/80">
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Installation Progress */}
      <div className="p-4 border-b border-studio-border">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-studio-text">Installation Progress</h3>
              <span className="text-sm text-studio-text-dim">
                {installerState.currentStep + 1} of {installerState.steps.length}
              </span>
            </div>
            <div className="w-full bg-studio-border rounded-full h-2">
              <div 
                className="bg-studio-accent h-2 rounded-full transition-all"
                style={{ width: `${((installerState.currentStep + 1) / installerState.steps.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-studio-accent" />
            <span className="text-sm text-studio-text">Secure Installation</span>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {installerState.steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => changeStep(index)}
              className={`flex items-center gap-2 px-3 py-2 rounded whitespace-nowrap ${
                index === currentStep 
                  ? 'bg-studio-accent text-black' 
                  : 'hover:bg-studio-hover'
              }`}
            >
              {getStepIcon(step.status, index)}
              <span className={`text-sm font-medium ${getStepColor(step.status, index)}`}>
                {step.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        {installerState.steps[currentStep].id === 'welcome' && (
          <div className="text-center">
            <div className="mb-6">
              <Package className="w-16 h-16 mx-auto mb-4 text-studio-accent" />
              <h2 className="text-2xl font-bold text-studio-text mb-2">Welcome to Studio Pro</h2>
              <p className="text-lg text-studio-text-dim mb-6">Professional creative editing suite</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <div className="p-4 bg-studio-panel rounded-lg">
                <Monitor className="w-8 h-8 mx-auto mb-2 text-studio-accent" />
                <p className="text-sm font-medium text-studio-text">Powerful Desktop</p>
                <p className="text-xs text-studio-text-dim">Native performance</p>
              </div>
              <div className="p-4 bg-studio-panel rounded-lg">
                <Globe className="w-8 h-8 mx-auto mb-2 text-studio-accent" />
                <p className="text-sm font-medium text-studio-text">Cloud Sync</p>
                <p className="text-xs text-studio-text-dim">Cross-platform</p>
              </div>
              <div className="p-4 bg-studio-panel rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-2 text-studio-accent" />
                <p className="text-sm font-medium text-studio-text">Team Collaboration</p>
                <p className="text-xs text-studio-text-dim">Real-time editing</p>
              </div>
            </div>
            <button
              onClick={() => changeStep(1)}
              className="px-6 py-2 bg-studio-accent text-black rounded font-medium hover:bg-studio-accent/80"
            >
              Begin Installation
            </button>
          </div>
        )}

        {installerState.steps[currentStep].id === 'system-check' && (
          <div>
            <h3 className="text-lg font-semibold text-studio-text mb-4">System Requirements</h3>
            <div className="space-y-3">
              {installerState.systemRequirements.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-studio-panel rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRequirementIcon(req.status)}
                    <div>
                      <p className="text-sm font-medium text-studio-text">{req.name}</p>
                      <p className="text-xs text-studio-text-dim">{req.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(req.status)}`}>
                      {req.status === 'satisfied' ? '✓' : 
                       req.status === 'warning' ? '⚠' : '✗'}
                    </div>
                    <div className="text-xs text-studio-text-dim">
                      {req.currentValue} {req.requiredValue && `(required: ${req.requiredValue})`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => changeStep(0)}
                className="px-4 py-2 bg-studio-hover rounded text-studio-text hover:bg-studio-hover/80"
              >
                Back
              </button>
              <button
                onClick={() => changeStep(2)}
                className="px-4 py-2 bg-studio-accent text-black rounded hover:bg-studio-accent/80"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {installerState.steps[currentStep].id === 'license-agreement' && (
          <div>
            <h3 className="text-lg font-semibold text-studio-text mb-4">Software License Agreement</h3>
            <div className="bg-studio-panel-d rounded-lg p-4 mb-4 max-h-64 overflow-auto">
              <h4 className="text-base font-semibold text-studio-text mb-3">Studio Pro End User License Agreement</h4>
              <div className="text-sm text-studio-text-dim space-y-2">
                <p>1. Grant of License. This EULA grants you a non-exclusive, non-transferable license to use Studio Pro.</p>
                <p>2. Restrictions. You may not reverse engineer, decompile, or disassemble the software.</p>
                <p>3. Warranty. The software is provided "as is" without warranty of any kind.</p>
                <p>4. Limitation of Liability. In no event shall the developers be liable for any damages.</p>
                <p>5. Governing Law. This agreement shall be governed by the laws of your jurisdiction.</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-studio-text">I accept the terms of this license agreement</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-studio-text">I agree to send anonymous usage data to help improve Studio Pro</span>
              </label>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => changeStep(1)}
                className="px-4 py-2 bg-studio-hover rounded text-studio-text hover:bg-studio-hover/80"
              >
                Back
              </button>
              <button
                onClick={() => changeStep(3)}
                className="px-4 py-2 bg-studio-accent text-black rounded hover:bg-studio-accent/80"
                disabled
              >
                Next (Accept terms first)
              </button>
            </div>
          </div>
        )}

        {installerState.steps[currentStep].id === 'installation-options' && (
          <div>
            <h3 className="text-lg font-semibold text-studio-text mb-4">Installation Options</h3>
            <div className="space-y-3 mb-6">
              {installerState.options.map(option => (
                <div key={option.id} className="flex items-start justify-between p-3 bg-studio-panel rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={option.enabled}
                        onChange={() => toggleOption(option.id)}
                        className="rounded mt-1"
                      />
                      <span className="text-sm font-medium text-studio-text">{option.name}</span>
                      {option.required && <span className="text-xs text-red-500">*</span>}
                    </div>
                    <p className="text-xs text-studio-text-dim">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h4 className="text-base font-semibold text-studio-text mb-3">Installation Location</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedInstallPath}
                  onChange={(e) => {
                    setSelectedInstallPath(e.target.value);
                    setInstallerState(prev => ({
                      ...prev,
                      installPath: e.target.value
                    }));
                  }}
                  className="flex-1 px-3 py-2 bg-studio-panel border border-studio-border rounded text-sm text-studio-text"
                  disabled
                />
                <button
                  onClick={browseInstallPath}
                  className="px-4 py-2 bg-studio-hover rounded text-sm text-studio-text hover:bg-studio-hover/80"
                >
                  Browse...
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => changeStep(2)}
                className="px-4 py-2 bg-studio-hover rounded text-studio-text hover:bg-studio-hover/80"
              >
                Back
              </button>
              <button
                onClick={() => changeStep(4)}
                className="px-4 py-2 bg-studio-accent text-black rounded hover:bg-studio-accent/80"
                disabled={installerState.isInstalling}
              >
                {installerState.isInstalling ? 'Installing...' : 'Install'}
              </button>
            </div>
          </div>
        )}

        {installerState.steps[currentStep].id === 'installation' && (
          <div className="text-center">
            <div className="mb-6">
              <Box className="w-16 h-16 mx-auto mb-4 text-studio-accent" />
              <h3 className="text-xl font-semibold text-studio-text mb-2">Installing Studio Pro</h3>
              <p className="text-lg text-studio-text-dim mb-6">Please wait while the installation is in progress</p>
            </div>

            <div className="bg-studio-panel-d rounded-lg p-4 mb-6 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-studio-text">Installation Progress</span>
                <span className="text-sm text-studio-text-dim">
                  {installerState.steps[4].progress}%
                </span>
              </div>
              <div className="w-full bg-studio-border rounded-full h-2 mb-2">
                <div 
                  className="bg-studio-accent h-2 rounded-full transition-all"
                  style={{ width: `${installerState.steps[4].progress}%` }}
                />
              </div>
              <div className="text-xs text-studio-text-dim">
                {installerState.steps[4].progress < 100 ? 'Copying files...' : 'Installation complete!'}
              </div>
            </div>

            <div className="text-xs text-studio-text-dim">
              Estimated time remaining: {installerState.steps[4].timeRemaining || '30 seconds'}
            </div>
          </div>
        )}

        {installerState.steps[currentStep].id === 'configuration' && (
          <div>
            <h3 className="text-lg font-semibold text-studio-text mb-4">Initial Setup</h3>
            <div className="space-y-4">
              <div className="p-4 bg-studio-panel rounded-lg">
                <h4 className="text-base font-semibold text-studio-text mb-3">User Profile</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-studio-text-dim mb-1 block">Your Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 bg-studio-panel border border-studio-border rounded text-sm text-studio-text"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-studio-text-dim mb-1 block">Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 bg-studio-panel border border-studio-border rounded text-sm text-studio-text"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-studio-panel rounded-lg">
                <h4 className="text-base font-semibold text-studio-text mb-3">Theme Preferences</h4>
                <div className="flex gap-3">
                  <button className="flex-1 p-3 border-2 border-studio-accent rounded text-sm text-black">
                    Light
                  </button>
                  <button className="flex-1 p-3 border-2 border-studio-panel rounded text-sm text-studio-text hover:bg-studio-hover">
                    Dark
                  </button>
                  <button className="flex-1 p-3 border-2 border-studio-panel rounded text-sm text-studio-text hover:bg-studio-hover">
                    System
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => changeStep(4)}
                className="px-4 py-2 bg-studio-hover rounded text-studio-text hover:bg-studio-hover/80"
              >
                Back
              </button>
              <button
                onClick={completeInstallation}
                className="px-4 py-2 bg-studio-accent text-black rounded hover:bg-studio-accent/80"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}

        {installerState.steps[currentStep].id === 'complete' && (
          <div className="text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold text-studio-text mb-2">Installation Complete!</h3>
              <p className="text-lg text-studio-text-dim mb-6">Studio Pro has been successfully installed</p>
            </div>

            <div className="bg-studio-panel-d rounded-lg p-6 mb-6 max-w-md mx-auto">
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-studio-text-dim">Installation Location:</span>
                  <span className="text-sm text-studio-text">{installerState.installPath}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-studio-text-dim">Version:</span>
                  <span className="text-sm text-studio-text">1.0.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-studio-text-dim">Date Installed:</span>
                  <span className="text-sm text-studio-text">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-studio-accent text-black rounded font-medium hover:bg-studio-accent/80">
                Launch Studio Pro
              </button>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-studio-hover rounded text-studio-text hover:bg-studio-hover/80">
                  Read Release Notes
                </button>
                <button className="flex-1 px-4 py-2 bg-studio-hover rounded text-studio-text hover:bg-studio-hover/80">
                  View Documentation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="p-4 border-t border-studio-border">
        <div className="flex justify-between">
          <button
            onClick={() => changeStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0 || installerState.isInstalling}
            className="px-4 py-2 bg-studio-hover rounded text-studio-text hover:bg-studio-hover/80 disabled:bg-studio-panel-darker"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Back
          </button>
          <button
            onClick={() => changeStep(Math.min(installerState.steps.length - 1, currentStep + 1))}
            disabled={installerState.isInstalling}
            className="px-4 py-2 bg-studio-accent text-black rounded hover:bg-studio-accent/80 disabled:bg-studio-hover"
          >
            Next
            <ArrowRight className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppInstaller;