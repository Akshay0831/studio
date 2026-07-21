// React type declarations for TypeScript compatibility

// Basic React namespace
declare namespace React {
  // Core types
  export type ReactNode = any;
  
  export interface CSSProperties {
    [key: string]: any;
  }
  
  export type Ref<T> = T | null;
  
  export interface RefObject<T> {
    readonly current: T | null;
  }
  
  export function createRef<T>(): RefObject<T>;
  
  export interface RefAttributes<T> {
    ref?: Ref<T>;
  }
  
  export interface HTMLAttributes<T> {
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
    id?: string;
    title?: string;
    tabIndex?: number;
  }
  
  export interface DetailedHTMLProps<T, U> extends HTMLAttributes<T> {
    ref?: Ref<U>;
  }
  
  export interface Context<T> {
    Provider: React.Provider<T>;
    Consumer: React.Consumer<T>;
    displayName?: string;
  }
  
  export interface Provider<T> {
    value: T;
    children: ReactNode;
  }
  
  export interface Consumer<T> {
    children: (value: T) => ReactNode;
  }
  
  export type ComponentType<P = {}> = any;
  export type ExoticComponent<P = {}> = any;
  export type FC<P = {}> = any;
  
  // Hook types
  export type Dispatch<T> = (value: T) => void;
  export type SetStateAction<T> = T | ((prev: T) => T);
  
  export type Reducer<S, A> = (state: S, action: A) => S;
  
  export interface ReducerState<R extends Reducer<any, any>> {
    readonly state: ReturnType<R>;
  }
  
  export interface ReducerAction<R extends Reducer<any, any>> {
    readonly type: string;
  }
  
  export interface ReducerProps<R extends Reducer<any, any>> extends ReducerState<R>, ReducerAction<R> {
    readonly dispatch: Dispatch<ReducerAction<R>>;
  }
  
  // Hook functions
  export function useState<T>(initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>];
  export function useEffect(callback: () => void | (() => void), deps?: any[]): void;
  export function useRef<T>(initialValue: T): RefObject<T>;
  export function forwardRef<T, P>(
    render: (props: P, ref: Ref<T>) => React.ReactElement | null
  ): React.ExoticComponent<P & RefAttributes<T>>;
  export function useContext<T>(context: Context<T>): T;
  export function createContext<T>(defaultValue: T): Context<T>;
  export function memo<P extends object>(Component: React.ComponentType<P>): React.ComponentType<P>;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;
  export function useMemo<T>(factory: () => T, deps?: any[]): T;
  
  // JSX types
  export namespace JSX {
    interface IntrinsicElements {
      div: DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      p: DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      span: DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      button: DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      input: DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
      select: DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
      option: DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>;
      textarea: DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
      label: DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
      h1: DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h4: DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h5: DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h6: DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      ul: DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
      ol: DetailedHTMLProps<React.HTMLAttributes<HTMLOListElement>, HTMLOListElement>;
      li: DetailedHTMLProps<React.HTMLAttributes<HTMLLIElement>, HTMLLIElement>;
      form: DetailedHTMLProps<React.HTMLAttributes<HTMLFormElement>, HTMLFormElement>;
      a: DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
      img: DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      table: DetailedHTMLProps<React.HTMLAttributes<HTMLTableElement>, HTMLTableElement>;
      thead: DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
      tbody: DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
      tfoot: DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
      tr: DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>;
      th: DetailedHTMLProps<React.HTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>;
      td: DetailedHTMLProps<React.HTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>;
      section: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      nav: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      main: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      header: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      footer: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      article: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      aside: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      figure: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      figcaption: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      fieldset: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      legend: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      blockquote: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      cite: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      code: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      pre: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      abbr: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      br: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      hr: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      small: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      sub: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      sup: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      mark: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      time: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      data: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      kbd: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      var: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      wbr: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      output: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      canvas: DetailedHTMLProps<React.HTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement>;
      details: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      summary: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      meter: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      progress: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      b: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      i: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      u: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      strong: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      em: DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

// Core React elements
export interface ReactElement {
  type: any;
  props: any;
  key: any;
}

// ForwardRef function
export function forwardRef<T, P>(
  render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
): React.ExoticComponent<P & React.RefAttributes<T>>;

// React default export
export const React: React;