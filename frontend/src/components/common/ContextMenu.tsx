import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Copy, Trash2, Edit2, RotateCcw, Move, Grid, Layers, Download, Lock, Unlock, ArrowUp, ArrowDown, ChevronRight, GripVertical, Square } from 'lucide-react';


interface ContextMenuItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  description?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  trigger: 'click' | 'right-click';
  children: React.ReactNode;
  items: ContextMenuItem[];
  onAction?: (actionId: string) => void;
  position?: { x: number; y: number };
  className?: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  trigger, 
  children, 
  items, 
  onAction, 
  position, 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [positionState, setPositionState] = useState({ x: 0, y: 0 });
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  const handleTrigger = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (trigger === 'right-click') {
      setPositionState({ x: e.clientX, y: e.clientY });
    } else if (position) {
      setPositionState(position);
    }
    
    setIsVisible(true);
    setActiveSubmenu(null);
  };

  const handleAction = (action: string) => {
    setIsVisible(false);
    setActiveSubmenu(null);
    onAction?.(action);
  };

  const handleOutsideClick = (e: MouseEvent) => {
    if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
      setIsVisible(false);
      setActiveSubmenu(null);
    }
  };



  useEffect(() => {
    if (isVisible) {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('contextmenu', handleOutsideClick);
      
      // Adjust position to keep menu within viewport
      if (contextMenuRef.current) {
        const menuRect = contextMenuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let adjustedX = positionState.x;
        let adjustedY = positionState.y;
        
        // Adjust horizontally
        if (positionState.x + menuRect.width > viewportWidth) {
          adjustedX = viewportWidth - menuRect.width - 10;
        }
        
        // Adjust vertically
        if (positionState.y + menuRect.height > viewportHeight) {
          adjustedY = viewportHeight - menuRect.height - 10;
        }
        
        setPositionState({ x: adjustedX, y: adjustedY });
      }
    }
    
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('contextmenu', handleOutsideClick);
    };
  }, [isVisible, positionState]);

  const renderMenuItem = (item: ContextMenuItem, level = 0) => {
    const Icon = item.icon;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    
    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => hasSubmenu ? setActiveSubmenu(item.id) : handleAction(item.id)}
          disabled={item.disabled}
          className={`
            w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-all duration-150
            hover:bg-studio-accent hover:bg-opacity-20 hover:text-white
            ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${level === 0 ? 'hover:bg-opacity-20' : 'bg-studio-panel'}
          `}
        >
          <Icon size={16} />
          <span className="flex-1">{item.label}</span>
          {hasSubmenu && (
            <ChevronRight size={12} className="transition-transform" />
          )}
        </button>
        
        {hasSubmenu && activeSubmenu === item.id && (
          <div
            ref={submenuRef}
            className="absolute top-0 left-full bg-studio-panel border border-studio-border rounded-lg shadow-xl z-50 min-w-[200px]"
            style={{ marginTop: '4px' }}
          >
            {(item.submenu || []).map(subItem => renderMenuItem(subItem, level + 1))}
          </div>
        )}
        
        {item.separator && (
          <div className="border-t border-studio-border my-1" />
        )}
      </div>
    );
  };

  return (
    <div ref={contextMenuRef} className={`relative ${className}`}>
      {React.cloneElement(children as React.ReactElement, {
        onContextMenu: trigger === 'right-click' ? handleTrigger : undefined,
        onClick: trigger === 'click' ? handleTrigger : undefined,
      })}
      
      {isVisible && (
        <div
          className="fixed bg-studio-panel border border-studio-border rounded-lg shadow-xl z-50 min-w-[200px] py-2"
          style={{
            left: `${positionState.x}px`,
            top: `${positionState.y}px`,
          }}
        >
          {items.map(item => renderMenuItem(item))}
        </div>
      )}
    </div>
  );
};

// Export utility function to create context menu items
export const createContextItems = (
  layer: any,
  actions: any
): ContextMenuItem[] => {
  return [
    {
      id: 'visibility',
      icon: layer.visible ? Eye : EyeOff,
      label: layer.visible ? 'Hide Layer' : 'Show Layer',
      description: layer.visible ? 'Make layer invisible' : 'Make layer visible',
      action: actions.toggleVisibility,
      disabled: false
    },
    {
      id: 'lock',
      icon: layer.locked ? Unlock : Lock,
      label: layer.locked ? 'Unlock Layer' : 'Lock Layer',
      description: layer.locked ? 'Allow layer editing' : 'Prevent layer editing',
      action: actions.toggleLock,
      disabled: false
    },
    {
      id: 'duplicate',
      icon: Copy,
      label: 'Duplicate',
      description: 'Create a copy of this layer',
      action: actions.duplicate,
      disabled: false,
      separator: true
    },
    {
      id: 'move',
      icon: Move,
      label: 'Move',
      description: 'Change layer order',
      action: () => {},
      disabled: false,
      submenu: [
        {
          id: 'move-up',
          icon: ArrowUp,
          label: 'Move Up',
          description: 'Move layer up in stack',
          action: actions.moveUp,
          disabled: false
        },
        {
          id: 'move-down',
          icon: ArrowDown,
          label: 'Move Down',
          description: 'Move layer down in stack',
          action: actions.moveDown,
          disabled: false
        }
      ],
      separator: true
    },
    {
      id: 'transform',
      icon: RotateCcw,
      label: 'Transform',
      description: 'Rotate, scale, skew layer',
      action: actions.showTransform,
      disabled: false,
      submenu: [
        {
          id: 'rotate',
          icon: RotateCcw,
          label: 'Rotate',
          description: 'Rotate layer',
          action: actions.rotate,
          disabled: false
        },
        {
          id: 'scale',
          icon: Grid,
          label: 'Scale',
          description: 'Resize layer',
          action: actions.scale,
          disabled: false
        },
        {
          id: 'skew',
          icon: GripVertical,
          label: 'Skew',
          description: 'Skew layer',
          action: actions.skew,
          disabled: false
        }
      ],
      separator: true
    },
    {
      id: 'edit-name',
      icon: Edit2,
      label: 'Edit Name',
      description: 'Change layer name',
      action: actions.editName,
      disabled: false
    },
    {
      id: 'blend-mode',
      icon: Layers,
      label: 'Blend Mode',
      description: 'Change blend mode',
      action: actions.showBlendMode,
      disabled: false,
      submenu: [
        {
          id: 'normal',
          icon: Square,
          label: 'Normal',
          description: 'Normal blend mode',
          action: () => actions.setBlendMode('source-over'),
          disabled: false
        },
        {
          id: 'multiply',
          icon: Layers,
          label: 'Multiply',
          description: 'Multiply blend mode',
          action: () => actions.setBlendMode('multiply'),
          disabled: false
        },
        {
          id: 'screen',
          icon: Layers,
          label: 'Screen',
          description: 'Screen blend mode',
          action: () => actions.setBlendMode('screen'),
          disabled: false
        }
      ],
      separator: true
    },
    {
      id: 'export',
      icon: Download,
      label: 'Export Layer',
      description: 'Export layer as separate image',
      action: actions.exportLayer,
      disabled: false
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Delete',
      description: 'Permanently remove layer',
      action: actions.delete,
      disabled: false,
      separator: true
    }
  ];
};

export default ContextMenu;