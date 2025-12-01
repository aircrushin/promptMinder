import React from 'react';

// Create a factory for generating icon mocks
const createIconMock = (name) => {
  const Icon = (props) => <svg data-testid={`${name.toLowerCase()}-icon`} className={`lucide-${name.toLowerCase()}`} {...props} />;
  Icon.displayName = name;
  return Icon;
};

// Existing mocks
export const Import = createIconMock('Import');
export const Copy = createIconMock('Copy');
export const Share2 = createIconMock('Share2');
export const Trash2 = createIconMock('Trash2');
export const ChevronDown = createIconMock('ChevronDown');

// Playground component icons
export const Plus = createIconMock('Plus');
export const GripVertical = createIconMock('GripVertical');
export const Loader2 = createIconMock('Loader2');
export const TestTube = createIconMock('TestTube');
export const ChevronUp = createIconMock('ChevronUp');
export const Settings2 = createIconMock('Settings2');
export const Eye = createIconMock('Eye');
export const EyeOff = createIconMock('EyeOff');
export const HelpCircle = createIconMock('HelpCircle');
export const BarChart3 = createIconMock('BarChart3');
export const Clock = createIconMock('Clock');
export const Coins = createIconMock('Coins');
export const CheckCircle2 = createIconMock('CheckCircle2');
export const XCircle = createIconMock('XCircle');
export const AlertTriangle = createIconMock('AlertTriangle');
export const Maximize2 = createIconMock('Maximize2');
export const Play = createIconMock('Play');
export const FlaskConical = createIconMock('FlaskConical');
export const Sparkles = createIconMock('Sparkles');
export const RotateCcw = createIconMock('RotateCcw');
export const Check = createIconMock('Check');

// Navbar icons
export const Menu = createIconMock('Menu');
export const Library = createIconMock('Library');
export const LayoutGrid = createIconMock('LayoutGrid');
export const Languages = createIconMock('Languages');