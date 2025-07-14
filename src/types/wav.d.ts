
declare module 'wav' {
  import { Transform } from 'stream';

  export class Reader extends Transform {
    constructor(options?: any);
    on(event: 'format', listener: (format: any) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }

  export class Writer extends Transform {
    constructor(options?: any);
  }
}
