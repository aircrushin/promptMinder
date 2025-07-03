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
  Eye, 
  EyeOff, 
  Sparkles, 
  Copy,
  Check,
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';

export default function VariableInputs({ 
  content, 
  onVariablesChange, 
  showPreview = true,
  className = ""
}) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [variableData, setVariableData] = useState(null);
  const [variableValues, setVariableValues] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);

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

  const handleVariableChange = (variableName, value) => {
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

  const copyPreview = async () => {
    if (!variableData) return;

    const previewText = variableData.preview(variableValues);
    try {
      await navigator.clipboard.writeText(previewText);
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 2000);
      toast({
        description: t?.variableInputs?.previewCopied || "预览内容已复制到剪贴板。",
        duration: 2000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: t?.variableInputs?.copyFailed || "复制失败。",
        duration: 2000,
      });
    }
  };

  const renderVariableInput = (variable) => {
    const value = variableValues[variable.name] || '';
    const hasError = validationErrors[variable.name];

    const inputProps = {
      value,
      onChange: (e) => handleVariableChange(variable.name, e.target.value),
      placeholder: variable.placeholder,
      className: `${hasError ? 'border-red-500 focus-visible:ring-red-500' : ''}`,
      'aria-describedby': hasError ? `${variable.name}-error` : undefined
    };

    return (
      <motion.div
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
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-1 text-red-500 text-sm"
            id={`${variable.name}-error`}
          >
            <AlertCircle className="w-4 h-4" />
            {hasError}
          </motion.div>
        )}
      </motion.div>
    );
  };

  if (!variableData || !variableData.hasVariables || !t) {
    return null;
  }

  const hasRequiredErrors = Object.keys(validationErrors).length > 0;
  const previewText = variableData.preview(variableValues);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 简化的变量输入区域 */}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              请填写所有必需的变量字段
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// A simplified hook for just getting variable data
export function useVariables(content) {
  const [variableData, setVariableData] = useState(null);
  
  useEffect(() => {
    if (content) {
      const data = analyzePromptVariables(content);
      setVariableData(data);
    }
  }, [content]);
  
  return variableData;
} 