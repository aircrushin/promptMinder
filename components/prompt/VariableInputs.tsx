'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  analyzePromptVariables, 
  validateVariableValue, 
  generateVariableExamples 
} from '@/lib/promptVariables';
import { 
  Variable, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for framer-motion
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), {
  loading: () => <div />,
  ssr: false
});

const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), {
  loading: () => null,
  ssr: false
});
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';

export default function VariableInputs({
  content,
  onVariablesChange,
  className = ""
}: {
  content: string;
  onVariablesChange?: (values: Record<string, any>, hasVariables: boolean) => void;
  className?: string;
}) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [variableData, setVariableData] = useState<any>(null);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, any>>({});

  // Analyze content for variables
  useEffect(() => {
    if (content) {
      const data = analyzePromptVariables(content);
      setVariableData(data);
      
      if (data.hasVariables) {
        setVariableValues(prev => {
          const newValues = { ...prev };
          data.variables.forEach(variable => {
            if (!(variable.name in newValues)) {
              newValues[variable.name] = variable.defaultValue;
            }
          });
          const currentVariables = data.variables.map(v => v.name);
          Object.keys(newValues).forEach(key => {
            if (!currentVariables.includes(key)) {
              delete newValues[key];
            }
          });
          return newValues;
        });
      } else {
        setVariableValues({});
        setValidationErrors({});
      }
    }
  }, [content]);

  // Notify parent component of changes
  useEffect(() => {
    if (onVariablesChange) {
      onVariablesChange(variableValues, variableData?.hasVariables || false);
    }
  }, [variableValues, variableData, onVariablesChange]);

  const handleVariableChange = (variableName: string, value: any) => {
    setVariableValues(prev => ({
      ...prev,
      [variableName]: value
    }));

    if (validationErrors[variableName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[variableName];
        return newErrors;
      });
    }
  };

  const fillWithExamples = () => {
    if (!variableData) return;

    const examples = generateVariableExamples(variableData.variables.map(v => v.name));
    setVariableValues(examples);
    setValidationErrors({});
    
    toast({
      description: t?.variableInputs?.exampleFilled || "示例数据已填充。",
      duration: 2000,
    });
  };

  const renderVariableInput = (variable: any) => {
    const value = variableValues[variable.name] || '';
    const hasError = validationErrors[variable.name];

    const inputProps = {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleVariableChange(variable.name, e.target.value),
      placeholder: variable.placeholder,
      className: `${hasError ? 'border-red-500 focus-visible:ring-red-500' : ''}`,
      'aria-describedby': hasError ? `${variable.name}-error` : undefined
    };

    return (
      <MotionDiv
        key={variable.name}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <Label htmlFor={variable.name} className="text-sm font-medium">
            {variable.displayName}
          </Label>
          <Badge variant="secondary" className="text-xs">
            {variable.type}
          </Badge>
          {variable.required && (
            <span className="text-red-500 text-sm">*</span>
          )}
        </div>
        
        {variable.type === 'textarea' ? (
          <Textarea
            id={variable.name}
            rows={3}
            {...inputProps}
          />
        ) : (
          <Input
            id={variable.name}
            type={variable.type === 'number' ? 'number' : variable.type}
            {...inputProps}
          />
        )}
        
        {hasError && (
          <MotionDiv
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-1 text-red-500 text-sm"
            id={`${variable.name}-error`}
          >
            <AlertCircle className="w-4 h-4" />
            {hasError}
          </MotionDiv>
        )}
      </MotionDiv>
    );
  };

  if (!variableData || !variableData.hasVariables || !t) {
    return null;
  }

  const hasRequiredErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Variable className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {t.variableInputs.title} ({variableData.variableCount})
          </span>
        </div>
        
        <div className="grid gap-3">
          {variableData.variables.map(renderVariableInput)}
        </div>
        
        {hasRequiredErrors && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              请填写所有必需的变量字段
            </div>
          </MotionDiv>
        )}
      </div>
    </div>
  );
}

// A simplified hook for just getting variable data
export function useVariables(content: string) {
  const [variableData, setVariableData] = useState<any>(null);
  
  useEffect(() => {
    if (content) {
      const data = analyzePromptVariables(content);
      setVariableData(data);
    }
  }, [content]);
  
  return variableData;
} 