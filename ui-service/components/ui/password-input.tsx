'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

interface PasswordInputProps {
  id: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  ariaInvalid?: 'true' | 'false';
}

export function PasswordInput({
  id,
  placeholder = '••••••••',
  value,
  onChange,
  onKeyDown,
  disabled = false,
  ariaInvalid = 'false',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-invalid={ariaInvalid}
      />
      <InputGroupAddon align="inline-end">
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          type="button"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff />
          ) : (
            <Eye />
          )}
        </button>
      </InputGroupAddon>
    </InputGroup>
  );
}
