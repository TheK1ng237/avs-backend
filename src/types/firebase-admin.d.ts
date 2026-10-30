declare module 'firebase-admin/app' {
  export function initializeApp(options?: any): any;
  export function cert(serviceAccountPathOrObject: any): any;
  export function getApps(): any[];
}

declare module 'firebase-admin/storage' {
  export function getStorage(app?: any): any;
}
