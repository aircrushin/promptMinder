declare module 'diff' {
  export interface Change {
    value: string;
    added?: boolean;
    removed?: boolean;
    count?: number;
  }

  export function diffChars(oldStr: string, newStr: string): Change[];
  export function diffWords(oldStr: string, newStr: string): Change[];
  export function diffWordsWithSpace(oldStr: string, newStr: string): Change[];
  export function diffLines(oldStr: string, newStr: string): Change[];
  export function diffSentences(oldStr: string, newStr: string): Change[];
  export function diffJson(oldObj: any, newObj: any): Change[];
  export function createPatch(fileName: string, oldStr: string, newStr: string, oldHeader?: string, newHeader?: string): string;
  export function createTwoFilesPatch(oldFileName: string, newFileName: string, oldStr: string, newStr: string, oldHeader?: string, newHeader?: string): string;
}
