import { navigateNext, navigatePrev } from "../display/nav";
import { IndexData } from "../indexing/indexData";
import FI_Plugin from "../main"
import {App, Editor, EditorPosition, MarkdownView, Modal, Notice, Plugin} from 'obsidian';

export function addCommands(this:FI_Plugin){
        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: 'nav-next',
            name: 'Go to next navigable note',
            checkCallback: noteCallback(this,(note, checking)=>{
                if(note?.config.nav){
                    if(!checking){
                        navigateNext(note)
                    }
                    return true
                }
            })
           
        });

        this.addCommand({
            id: 'nav-prev',
            name: 'Go to previous navigable note',
            checkCallback: noteCallback(this,(note, checking)=>{
                if(note?.config.nav){
                    if(!checking){
                        navigatePrev(note)
                    }
                    return true
                }
            })
        });
        
        this.addCommand({
            id: 'goto-bookmark',
            name: 'Go to bookmarked block',
            checkCallback: noteCallback(this,(note, checking, view)=>{
                let cache = note?.getMetaData()
                let bookmark = cache?.blocks?.['---']
                if(bookmark){
                    if(!checking){
                        view.editor.hasFocus()
                        const location = view.editor.offsetToPos(bookmark.position.end.offset)
                        view.editor.setCursor(location);
                        view.editor.scrollIntoView({from:location, to:location})
                    }   
                    return true
                }
            })
        });
}

/**Acts as a base for note based commands */
export function noteCallback(plugin:FI_Plugin ,fn:(note:IndexData,checking:boolean, view?:MarkdownView)=>boolean):(checking:boolean)=>boolean{
    return (checking:boolean)=>{
        const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if(view?.file){
            const note = plugin.tree.getNode(view?.file)
            return fn(note,checking, view);
        }
        return false;
    }
}