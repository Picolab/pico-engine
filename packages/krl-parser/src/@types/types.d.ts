// This is a bug fix for ava type definition. Remove this after it's fixed
declare global { interface SymbolConstructor { readonly observable: symbol; } }
export {}
