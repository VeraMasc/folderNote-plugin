import {addIcon, MarkdownView, Menu, OpenViewState, Plugin, TFile, MetadataCache,Events, Notice, TFolder} from "obsidian";

import {fromView as fmFromView, valueRegex} from "../../.sharedModules/FrontMatter";
import { obsidianIcons } from '../../.sharedModules/obsidianUtils';
import {BlockName} from './blocks/Blocks';
import FI_Plugin from "./main"
import {xApp} from "./main"
import { getRandomColor } from "./config";

/**Interface of the FolderNoteCore plugin */
export type FolderNoteCore = Plugin & 
    {
        api:{
            /**Converts the current note into a folder with that note inside as index */
            createFolderForNote:(note:TFile)=>Promise<any>
            CreateFolderNote:(folder:TFolder, val:boolean) => Promise<any>
        }
    };

/**Context menu of the index element of the index file*/
export function indexMenu(ev:MouseEvent){
    ev.preventDefault(); 
    const menu = new Menu();
    setPropItem(menu, "Keep Open", "expand-vertically", "FN-forceOpen")
    setPropItem(menu, "Expanded by default", "fullscreen", "FN-expand")
	setPropItem(menu, "Hide files", "scissors", "FN-hideRegExp",'"\\\\..+$(?<!\\\\.md$)"')
	setPropItem(menu, "Make it sticky", "pin", "FN-isSticky")
    noteOptions(menu,ev)
    menu.showAtMouseEvent(ev);
}

/**Gets the file whose link has generated the context menu */
function getOptionsTargetFile(ev:MouseEvent){
    let link = ev.target as HTMLAnchorElement;
    var path = link?.dataset?.href;
    //If target is actual link
    if(path){
        var file = this.app.metadataCache.getFirstLinkpathDest(path,".");
        return file;
    }
    else{ //Return current file
        return this.app.workspace.getActiveFile();
    }
    
}

/**Generates the Context menu that is universal to all notes*/
function noteOptions(menu:Menu, ev:MouseEvent){

    var file = getOptionsTargetFile(ev)

    //Folder note
    actionItem(menu,"Make Folder Note","folder-root",(e)=>{
		var folderNoteCore = (window as any).app.plugins.plugins["folder-note-core"] as FolderNoteCore;
        
        folderNoteCore.api.createFolderForNote(file).then(
            ()=>{
                //Call change event
                var plugin = (window as any).FNindex as FI_Plugin;
                plugin.redrawFN();
            }
        )
        
	})
    //View file in explorer
    actionItem(menu,"View in explorer","eye",(e)=>{
        //Get reveal function
        var explorer = (app as xApp).internalPlugins.plugins["file-explorer"];
        new Notice("Core Plugin 'File Explorer' not found")
		explorer?.instance.revealInFolder(file);
        
        
	})
	addIcon("testIco","")
}

/**Generates the Context menu of all the currently opened file*/
function currentNoteOptions(menu:Menu, ev:MouseEvent){
    //Sticky index
	setPropItem(menu, "Make it sticky", "pin", "FN-isSticky")
    //Custom link color
	setPropItemFunction(menu, "Use custom color","highlight-glyph" , "FN-color",getRandomColor)
    //Insert header index
    insertBlockItem(menu, "Add content block","clipboard-list" ,"headerIndex","")
    //Generate regular options
    noteOptions(menu, ev)
}
/**Generates the full context menu of all notes*/
export function noteMenu(ev:MouseEvent){
    ev.preventDefault(); 
    const menu = new Menu();
    noteOptions(menu,ev)
    menu.showAtMouseEvent(ev);
}

/**Generates the full context menu of the current note */
export function currentNoteMenu(ev:MouseEvent){
    ev.preventDefault(); 
    const menu = new Menu();
    currentNoteOptions(menu,ev)
    menu.showAtMouseEvent(ev);
}

/**Generates the Context menu of index links */
export function linkMenu(ev:MouseEvent){
	let link = ev.target as HTMLAnchorElement;
    ev.preventDefault(); 
    const menu = new Menu();
    actionItem(menu,"Go to note","note-glyph",()=>link.click())
	actionItem(menu,"Open in new tab","open-elsewhere-glyph",(e)=>{
		if(!link?.dataset?.href)
			return;
		let mode =(app.vault as any).getConfig("defaultViewMode");
		app.workspace?.openLinkText(link.dataset.href,".",true,
			{active:true, mode} as OpenViewState)
	})
    noteOptions(menu,ev);
    
	
    menu.showAtMouseEvent(ev);
}


/**Sets contextual option to add a specific prop to the file */
function setPropItem(menu:Menu,title:string, icon:obsidianIcons, prop:string, value:any=true){
    menu.addItem((item) =>
        item.setTitle(title)
        .setIcon(icon)
        .onClick(() => {
			let view = app.workspace.getActiveViewOfType(MarkdownView)
			var propDict = {};
			propDict[prop] = value;
			view?.["metadataEditor"].insertProperties(propDict)
            }
        )
    );
}

/**Same as {@link setPropItem} but sets the value through a function */
function setPropItemFunction(menu:Menu,title:string, icon:obsidianIcons, prop:string, valueFunc:(e?:MouseEvent)=>any){
    menu.addItem((item) =>
        item.setTitle(title)
        .setIcon(icon)
        .onClick((e:MouseEvent) => {
			let view = app.workspace.getActiveViewOfType(MarkdownView)
			var propDict = {};
			propDict[prop] = valueFunc(e);
			view?.["metadataEditor"].insertProperties(propDict)
            }
        )
    );
}

/**Sets contextual option to insert a specific code block to the file  */
function insertBlockItem(menu:Menu,title:string, icon:obsidianIcons, blockType:BlockName, content:string=""){
    menu.addItem((item) =>
        item.setTitle(title)
        .setIcon(icon)
        .onClick(() => {
                let view = app.workspace.getActiveViewOfType(MarkdownView)
                view.editor.replaceSelection(`\`\`\`${blockType}\n${content}\n\`\`\``)
            }
        )
    );
}

/**Creates a context menu item that performs an action 
 * @param menu Menu that will hold the item
 * @param title Display text of the item
 * @param icon Display icon of the item
 * @param onclick Action to trigger on clicking the item
*/
function actionItem(menu:Menu,title:string, icon:obsidianIcons, onclick:(ev?:MouseEvent) => any){
    menu.addItem((item) =>
        item.setTitle(title)
        .setIcon(icon)
        .onClick(onclick)
        //TODO: add option for expanding submenus on hover
    );
}