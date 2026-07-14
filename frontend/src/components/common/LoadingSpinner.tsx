
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  color = '#8b5cf6',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-t-transparent rounded-full animate-spin`}
        style={{
          borderColor: `${color} ${color} transparent transparent`
        }}
      />
      {text && (
        <p className="mt-3 text-sm text-studio-text-dim animate-pulse">{text}</p>
      )}
    </div>
  );
};

export const FullScreenLoader: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-studio-bg flex flex-col items-center justify-center z-50">
      <LoadingSpinner
        size="lg"
        text={message || "Loading Unified Editing Studio..."}
        color="#8b5cf6"
      />
    </div>
  );
};
