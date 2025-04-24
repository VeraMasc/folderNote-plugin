import { Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile, Plugin, SuggestModal, Notice } from 'obsidian';
import FI_Plugin from '../../main';
import { contentBlock, BlockName } from '../Blocks';
import {findParentCodeblock} from "./suggestUtils"
import { KeyOfType } from '../../../../.sharedModules/Type Utilities';
import { Config } from '../contentBlock';

//TODO: Replicate suggestions from https://github.com/aidenlx/obsidian-icon-shortcodes/blob/master/src/modules/suggester.ts#L115

/**Suggestions for the codeblocks */
export class BlockSuggest extends EditorSuggest<string>{
    plugin:FI_Plugin;
    /**Holds the suggestable options of each block */
    static blockOptions:BlocksOptions={
        headerIndex:["from",'maxDepth','excludeRoot', 'relative'],
        contentIndex:["from",'maxDepth','excludeRoot', 'relative'],
        //TODO: add suggestions for index
        index:["FN-forceOpen","indexPath"]
    }



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
        
        //Return value
        let ret:EditorSuggestTriggerInfo =null;
        if(word !=null){
            let wordtext = editor.getRange(word.from, word.to);
            ret= {start:word.from, end:word.to, query:wordtext+" "+block}
        }else{//Use cursor
            ret= {start:cursor, end:cursor, query:" "+block}
        }
        return ret;

        
    }

    getSuggestions(context: EditorSuggestContext): (keyof Config)[]{
        let {query,end} = context;

        //Find text and block
        var partial = query.slice(0,end.ch);
        var blockName = query.slice(end.ch+1);
        
        //Get options of block
        let options = BlockSuggest.blockOptions[blockName] ?? [];
        
        //Return filtered results
        return options.filter( o => o.startsWith(partial) ); //Also works if partial is empty
    }


    async renderSuggestion(value: string, el: HTMLElement): Promise<void> {
        el.createDiv("suggestion-aux").createSpan("suggestion-flair", (el) =>
            {el.innerText = value;}
          );
    }

    selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
        if(this.context ==null)
            return;
        
        //Add ":" if missing
        let nextCh = {...this.context.end};
        nextCh.ch++;
        let range = this.context.editor.getRange(this.context.end,nextCh)
        if(range!==':')
            value+=":";
        
        //Replace with selected option
        this.context.editor.replaceRange(value,this.context.start,this.context.end)
    }
    
}

/**Holds the possible options of each block type */
export type BlocksOptions = {
    [k in BlockName]: string[];
};

