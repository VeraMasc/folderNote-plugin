import { Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile, Plugin, SuggestModal, Notice } from 'obsidian';
import FI_Plugin from '../../main';
import { headerBlock } from '../Blocks';
import {findParentCodeblock} from "./suggestUtils"
import { KeyOfType } from '../../../../.sharedModules/Type Utilities';
import { Config } from '../headerBlock';

//TODO: Replicate suggestions from https://github.com/aidenlx/obsidian-icon-shortcodes/blob/master/src/modules/suggester.ts#L115

/**Suggestions for the {@link headerBlock} codeblock */
export class HeaderSuggest extends EditorSuggest<string>{
    plugin:FI_Plugin;

    constructor(plugin:FI_Plugin){
        super(plugin.app);
        this.plugin=plugin;
    }

    onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {

        if(!this.plugin.settings.blockSuggestions)//Suggestions disabled
            return null;    

        let word = editor.wordAt(cursor);

        //Invalid position (not at end of first word in line)
        if(word===null?
            cursor.ch!==0
            :(word.from.ch!==0 || word.to.ch !== cursor.ch)
        ){
            return null;
        }

        let block = findParentCodeblock(cursor,editor);

        if(!block)
            return null;
        
        let ret:EditorSuggestTriggerInfo =null;
        if(word !=null){
            let wordtext = editor.getRange(word.from, word.to);
            ret= {start:word.from, end:word.to, query:block+" "+wordtext}
        }else{
            //Use cursor
            ret= {start:cursor, end:cursor, query:block+" "}
        }
        console.log(ret)
        return ret;

        
    }
    getSuggestions(context: EditorSuggestContext): (keyof Config)[]{
        //TODO: remove hard coding and add filtering
        //? make async?
        return ["from",'depth','excludeRoot']
    }
    async renderSuggestion(value: string, el: HTMLElement): Promise<void> {
        el.createDiv("suggestion-aux").createSpan("suggestion-flair", (el) =>
            {el.innerText = value;}
          );
    }

    selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
        if(this.context ==null)
            return;
        this.context.editor.replaceRange(value+":",this.context.start,this.context.end)
    }
    
}

