import { Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from 'obsidian';


export class HeaderSuggest extends EditorSuggest<string>{
    onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
        return null;
    }
    getSuggestions(context: EditorSuggestContext): string[] | Promise<string[]> {
        return ["aaa"]
    }
    renderSuggestion(value: string, el: HTMLElement): void {
        
    }
    selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
        
    }
    
}