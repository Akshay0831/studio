import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, Grid, List, Filter, Star } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MaterialButton } from '../common/MaterialButton';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  keywords: string[];
  popular?: boolean;
  subTools?: Array<{
    id: string;
    name: string;
    icon: React.ComponentType<any>;
  }>;
}

interface ToolLookupProps {
  tools: Tool[];
  selectedTool?: string;
  onToolSelect: (toolId: string) => void;
  placeholder?: string;
  showPopular?: boolean;
  showCategories?: boolean;
  compact?: boolean;
}

const ToolLookup: React.FC<ToolLookupProps> = ({
  tools,
  selectedTool,
  onToolSelect,
  placeholder = "Search tools...",
  showPopular = true,
  showCategories = true,
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showGrid, setShowGrid] = useState(false);
  const [filteredTools, setFilteredTools] = useState<Tool[]>(tools);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = showCategories ? [...new Set(tools.map(tool => tool.category))] : [];

  // Filter tools based on search term and category
  useEffect(() => {
    let filtered = tools;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(term) ||
        tool.description.toLowerCase().includes(term) ||
        tool.keywords.some(keyword => keyword.toLowerCase().includes(term))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }

    // Show popular tools first if enabled
    if (showPopular) {
      filtered.sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return 0;
      });
    }

    setFilteredTools(filtered);
  }, [tools, searchTerm, selectedCategory, showPopular]);

  const handleToolClick = (tool: Tool) => {
    onToolSelect(tool.id);
    if (compact) {
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  const getSelectedTool = () => {
    return tools.find(tool => tool.id === selectedTool);
  };

  return (
    <div className={cn(
      "relative w-full max-w-md",
      compact && "w-full"
    )}>
      {/* Lookup Input */}
      <div 
        className={cn(
          "flex items-center gap-2 p-3 bg-studio-panel border border-studio-border rounded-lg cursor-pointer transition-all",
          compact && "w-full",
          isExpanded && "border-studio-accent"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Search size={16} className="text-studio-text-dim flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder={getSelectedTool()?.name || placeholder}
          value={getSelectedTool()?.name || searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 bg-transparent outline-none text-sm placeholder-studio-text-dim",
            compact && "w-full"
          )}
          onClick={(e) => e.stopPropagation()}
        />
        {getSelectedTool() && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToolSelect('');
              setSearchTerm('');
            }}
            className="p-1 text-studio-text-dim hover:text-studio-text transition-colors"
          >
            <X size={14} />
          </button>
        )}
        {compact && (
          <div className="text-studio-text-dim">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-studio-panel border border-studio-border rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-studio-border flex items-center justify-between">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-studio-text-dim" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1 bg-studio-background rounded text-sm outline-none focus:outline-none focus:ring-1 focus:ring-studio-accent"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <MaterialButton
                variant="ghost"
                size="icon"
                onClick={() => setShowGrid(!showGrid)}
                className="p-1"
              >
                {showGrid ? <List size={14} /> : <Grid size={14} />}
              </MaterialButton>
              {showCategories && categories.length > 1 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-studio-background border border-studio-border rounded px-2 py-1 text-sm outline-none focus:outline-none focus:ring-1 focus:ring-studio-accent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Popular Tools Section */}
          {showPopular && filteredTools.some(tool => tool.popular) && (
            <div className="p-3 border-b border-studio-border">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-studio-accent uppercase tracking-wider">
                <Star size={12} />
                <span>Popular Tools</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredTools.filter(tool => tool.popular).map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-left transition-all",
                      selectedTool === tool.id ? "bg-studio-accent text-white" : "bg-studio-hover hover:bg-studio-hover"
                    )}
                  >
                    <tool.icon size={16} />
                    <span className="text-sm font-medium">{tool.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Tools Section */}
          <div className="max-h-48 overflow-y-auto">
            {showGrid ? (
              <div className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  {filteredTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg text-left transition-all",
                        selectedTool === tool.id ? "bg-studio-accent text-white" : "bg-studio-hover hover:bg-studio-hover"
                      )}
                    >
                      <tool.icon size={20} />
                      <div className="text-center">
                        <div className="text-sm font-medium">{tool.name}</div>
                        <div className="text-xs text-studio-text-dim">{tool.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-studio-border">
                {filteredTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className={cn(
                      "w-full p-3 text-left transition-all flex items-center gap-3",
                      selectedTool === tool.id ? "bg-studio-accent text-white" : "hover:bg-studio-hover"
                    )}
                  >
                    <tool.icon size={18} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tool.name}</span>
                        {tool.popular && <Star size={12} className="text-yellow-400" />}
                      </div>
                      <div className="text-sm text-studio-text-dim">{tool.description}</div>
                      <div className="text-xs text-studio-text-dim mt-1">{tool.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredTools.length === 0 && (
            <div className="p-4 text-center text-sm text-studio-text-dim">
              No tools found
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default ToolLookup;
export type { Tool };