import { ReactNode } from 'react';

interface ViewContentProps {
  viewId: string;
  direction?: 'forward' | 'backward';
  isActive: boolean;
  children: ReactNode;
}

export function ViewContent({
  viewId,
  direction = 'forward',
  isActive,
  children,
}: ViewContentProps) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
}
