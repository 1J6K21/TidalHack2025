// Component-specific type definitions for BuildFlow

import React from 'react';

// Note: Avoiding circular imports by not importing from index.ts
// These types are re-exported in index.ts

// Re-declare core interfaces to avoid circular imports
export interface Manual {
  id: string;
  productName: string;
  thumbnailURL: string;
  firebaseManualPath: string;
  firebaseImagePath: string;
  createdAt: Date;
  totalPrice: number;
  stepCount: number;
}

export interface Step {
  stepNumber: number;
  title: string;
  description: string;
  imageURL: string;
  estimatedTime: number;
  tools: string[];
  notes?: string;
}

export interface Material {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageURL: string;
  amazonURL?: string;
  category: string;
}

export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AI_GENERATION = 'ai_generation',
  FIREBASE = 'firebase',
  UNKNOWN = 'unknown'
}

export interface ErrorState {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}

// ============================================================================
// COMMON COMPONENT PROPS
// ============================================================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface LoadingProps extends BaseComponentProps {
  loading: boolean;
  error?: ErrorState | null;
  retry?: () => void;
}

export interface ErrorDisplayProps extends BaseComponentProps {
  error: ErrorState;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// ============================================================================
// PAGE COMPONENT PROPS
// ============================================================================

export interface HomepageProps extends BaseComponentProps {
  manuals: Manual[];
  onCreateNew: () => void;
  onOpenManual: (id: string) => void;
  loading: boolean;
  error: ErrorState | null;
}

export interface MaterialsViewProps extends BaseComponentProps {
  materials: Material[];
  totalPrice: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: ErrorState | null;
}

export interface FlipbookViewProps extends BaseComponentProps {
  steps: Step[];
  materials: Material[];
  projectName: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
  loading?: boolean;
}

export interface TextInputProps extends BaseComponentProps {
  onSubmit: (idea: string) => void;
  disabled: boolean;
  loading: boolean;
  placeholder?: string;
  maxLength?: number;
  validation?: (value: string) => string | null;
}

// ============================================================================
// UI COMPONENT PROPS
// ============================================================================

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  image?: string;
  actions?: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  footer?: React.ReactNode;
}

export interface TooltipProps extends BaseComponentProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
}

export interface ProgressProps extends BaseComponentProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// FORM COMPONENT PROPS
// ============================================================================

export interface FormProps extends BaseComponentProps {
  onSubmit: (data: Record<string, any>) => void;
  validation?: Record<string, (value: any) => string | null>;
  initialValues?: Record<string, any>;
  disabled?: boolean;
}

export interface InputProps extends BaseComponentProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
}

export interface TextareaProps extends Omit<InputProps, 'type'> {
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export interface SelectProps extends BaseComponentProps {
  name: string;
  label?: string;
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
}

// ============================================================================
// LAYOUT COMPONENT PROPS
// ============================================================================

export interface LayoutProps extends BaseComponentProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

export interface GridProps extends BaseComponentProps {
  columns?: number | 'auto';
  gap?: number | string;
  responsive?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export interface FlexProps extends BaseComponentProps {
  direction?: 'row' | 'column';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  wrap?: boolean;
  gap?: number | string;
}

// ============================================================================
// ANIMATION COMPONENT PROPS
// ============================================================================

export interface AnimationProps extends BaseComponentProps {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
  whileHover?: Record<string, any>;
  whileTap?: Record<string, any>;
}

export interface TransitionProps extends BaseComponentProps {
  show: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  duration?: number;
}

// ============================================================================
// EVENT HANDLER TYPES
// ============================================================================

export type ClickHandler = (event: React.MouseEvent) => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler<T = Record<string, any>> = (data: T) => void;
export type KeyboardHandler = (event: React.KeyboardEvent) => void;
export type FocusHandler = (event: React.FocusEvent) => void;

// ============================================================================
// RENDER PROP TYPES
// ============================================================================

export interface RenderProps<T> {
  children: (props: T) => React.ReactNode;
}

export interface AsyncRenderProps<T> extends RenderProps<{
  data: T | null;
  loading: boolean;
  error: ErrorState | null;
  retry: () => void;
}> {}

export interface FormRenderProps extends RenderProps<{
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  handleChange: (name: string, value: any) => void;
  handleBlur: (name: string) => void;
  handleSubmit: () => void;
  isValid: boolean;
  isSubmitting: boolean;
}> {}