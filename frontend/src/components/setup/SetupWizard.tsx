import { cn } from '../../utils/cn';

interface SetupWizardProps {
  steps: string[];
  currentStep: number;
  onStepClick: (i: number) => void;
  children: React.ReactNode;
}

export function SetupWizard({ steps, currentStep, onStepClick, children }: SetupWizardProps) {
  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => onStepClick(i)}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors shrink-0',
                i === currentStep
                  ? 'bg-primary-600 text-white'
                  : i < currentStep
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-alt text-text-muted border border-border'
              )}
            >
              {i < currentStep ? '✓' : i + 1}
            </button>
            <span
              className={cn(
                'text-xs font-medium hidden sm:inline',
                i === currentStep ? 'text-primary-600' : i < currentStep ? 'text-emerald-500' : 'text-text-muted'
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5',
                  i < currentStep ? 'bg-emerald-300' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>
      {/* Step content */}
      <div className="min-h-[300px]">{children}</div>
    </div>
  );
}
