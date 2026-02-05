/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PORT?: string;
  readonly VITE_IS_PLATFORM?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Vite React types
declare module '*.jsx' {
  const component: React.FC<any>;
  export default component;
}

declare module '*.tsx' {
  const component: React.FC<any>;
  export default component;
}

// SVG types
declare module '*.svg' {
  import React = require('react');
  const SVGComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
}

// CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// JSON files
declare module '*.json' {
  const value: any;
  export default value;
}

// Image types
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}
