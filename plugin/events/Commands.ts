import { locToPos } from ".sharedModules/obsidian/obsidianUtils";
import { bmPattern } from "../blocks/bookmark";
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
            checkCallback: noteCallback(this,(note, checking, view:MarkdownView)=>{
                const cache = note?.getMetaData()
                const bookmark = cache?.blocks?.[bmPattern]
                if(bookmark){
                    if(!checking){
                        view.editor.hasFocus()
                        // FIXME: Fix a weird scroll bug on mobile
                        const path = note.filePath;
                        this.app.workspace.getActiveViewOfType(MarkdownView).leaf.loadIfDeferred()
                            .then(()=>this.app.workspace.openLinkText(path+"#^-", "",false,))
                            .then(()=>this.app.workspace.openLinkText(path+"#^-", "",false,)) // HACK: Repeated to force proper loading and scroll
                        
                    }   
                    return true
                }
            })
        });
        
        this.addCommand({
            id: 'create-bookmark',
            name: 'Bookmark current block',
            checkCallback: noteCallback(this,(note, checking, view)=>{
                const cache = note?.getMetaData(), editor = view.editor;
                const bookmark = cache?.blocks?.[bmPattern]
                if((view as MarkdownView)?.getMode?.() == 'source'){ //Check if in edit mode
                    const location = editor.getCursor("head");
                    let blockLine = editor.getLine(location.line)
                    
                    if(!checking){
                        if(!blockLine){
                            new Notice("Can't bookmark empty blocks");
                            return false; //No block to bookmark
                        }
                        if(bookmark){
                            const end = bookmark.position.end
                            let str = editor.getLine(end.line);
                            console.log(str)
                            if(str.endsWith("^-"))
                                editor.setLine(end.line,str.slice(0,-2))
                        }
                        

                        location.ch=blockLine.length;
                        editor.setSelection(location)
                        editor.replaceSelection("^-","FN-index")

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