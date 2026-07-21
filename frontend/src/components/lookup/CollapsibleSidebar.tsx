import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Settings, Layers, Palette, Music } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MaterialButton } from '../common/MaterialButton';

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ComponentType<any>;
  defaultCollapsed?: boolean;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onCollapse?: (collapsed: boolean) => void;
  preview?: boolean;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  children,
  title,
  icon: Icon,
  defaultCollapsed = false,
  minWidth = 200,
  maxWidth = 400,
  className = '',
  onCollapse,
  preview = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleCollapse = useCallback(() => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    setIsTransitioning(true);
    onCollapse?.(newCollapsedState);
    
    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isCollapsed, onCollapse]);

  const sidebarStyle = {
    width: isCollapsed ? `${minWidth}px` : `${maxWidth}px`,
    minWidth: `${minWidth}px`,
    maxWidth: `${maxWidth}px`,
    transition: 'width 0.3s ease-in-out'
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-studio-panel border-r border-studio-border shadow-lg",
        isTransitioning && "transition-all duration-300 ease-in-out",
        className
      )}
      style={sidebarStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-studio-border bg-studio-header">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} />}
            <span className="text-sm font-bold text-studio-text">{title}</span>
          </div>
        )}
        <MaterialButton
          variant="ghost"
          size="icon"
          onClick={handleCollapse}
          className="p-1"
        >
          {isCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </MaterialButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!isCollapsed && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            {children}
          </div>
        )}
      </div>

      {/* Collapsed Mode Preview */}
      {isCollapsed && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-studio-panel border border-studio-border rounded-r-lg shadow-xl z-50 p-2">
          <MaterialButton
            variant="ghost"
            size="icon"
            onClick={handleCollapse}
            className="p-1"
          >
            <ChevronRight size={16} />
          </MaterialButton>
        </div>
      )}
    </div>
  );
};

interface SidebarSectionProps {
  title: string;
  icon?: React.ComponentType<any>;
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  icon: Icon,
  children,
  collapsed = false,
  onToggle
}) => {
  if (collapsed) {
    return (
      <div className="p-2">
        <MaterialButton
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="w-full p-2"
        >
          {Icon && <Icon size={16} className="mr-2" />}
          <span className="text-sm">{title}</span>
        </MaterialButton>
      </div>
    );
  }

  return (
    <div className="p-3 border-b border-studio-border/30">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={14} className="text-studio-accent" />}
        <span className="text-xs font-bold text-studio-text-dim uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
};

export default CollapsibleSidebar;