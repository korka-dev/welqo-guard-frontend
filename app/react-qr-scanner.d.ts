declare module 'react-qr-scanner' {
  import * as React from 'react';

  export interface QrScannerProps {
    delay?: number | false;
    onError?: (error: any) => void;
    onScan?: (data: string | null) => void;
    style?: React.CSSProperties;
    className?: string;
    facingMode?: 'user' | 'environment';
    legacyMode?: boolean;
  }

  const QrScanner: React.FC<QrScannerProps>;

  export default QrScanner;
}

