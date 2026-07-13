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
                let cache = note?.getMetaData()
                let bookmark = cache?.blocks?.[bmPattern]
                if(bookmark){
                    if(!checking){
                        view.editor.hasFocus() 
                        const location:EditorPosition = {line:bookmark.position.end.line, ch:bookmark.position.end.col};//view.editor.offsetToPos(bookmark.position.end.offset)
                        // TODO: Fix a weird scroll bug on mobile
                        let path = note.filePath;
                        new Notice("Deferred: " + this.app.workspace.getActiveViewOfType(MarkdownView).leaf.isDeferred)
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
                let cache = note?.getMetaData()
                let bookmark = cache?.blocks?.[bmPattern]
                if((view as MarkdownView)?.getMode?.() == 'source'){ //Check if in edit mode
                    if(!checking){
                        
                        const location = view.editor.getCursor("head");
                        location.line++;
                        location.ch=0;
                        view.editor.setCursor(location);
                        view.editor.replaceRange("\n^-\n", location)
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