declare module 'cleave.js/react' {
  import type { ComponentType, InputHTMLAttributes } from 'react';
  type CleaveProps = InputHTMLAttributes<HTMLInputElement> & {
    options?: any;
    onInit?: (instance: any) => void;
    onChange?: (e: any) => void;
  };
  const Cleave: ComponentType<CleaveProps>;
  export default Cleave;
}
