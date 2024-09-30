import {addIcon, MarkdownView, Menu, OpenViewState, Plugin, TFile, MetadataCache,Events} from "obsidian";

import {fromView as fmFromView, valueRegex} from "../../.sharedModules/FrontMatter";
import { obsidianIcons } from '../../.sharedModules/obsidianUtils';
import {BlockName} from './blocks/Blocks';
import FolderIndexPlugin from "./main"

/**Interface of the FolderNoteCore plugin */
export type FolderNoteCore = Plugin & 
    {
        api:{
            createFolderForNote:(note:TFile)=>Promise<any>
        }
    };

/**Context menu of the index file*/
export function indexMenu(ev:MouseEvent){
    ev.preventDefault(); 
    const menu = new Menu();
    setPropItem(menu, "Keep Open", "expand-vertically", "FN-forceOpen")
    setPropItem(menu, "Expanded by default", "fullscreen", "FN-expand")
	setPropItem(menu, "Hide files", "scissors", "FN-hideRegExp",'"\\\\..+$(?<!\\\\.md$)"')
	setPropItem(menu, "Make it sticky", "pin", "FN-isSticky")
    noteOptions(menu)
    menu.showAtMouseEvent(ev);
}

/**Context menu of all files*/
function noteOptions(menu:Menu){
	setPropItem(menu, "Make it sticky", "pin", "FN-isSticky")
	setPropItem(menu, "Use custom color","highlight-glyph" , "FN-color","yellowgreen")
    insertBlockItem(menu, "Add content block","clipboard-list" ,"headerIndex","")
	addIcon("testIco","")
}

export function noteMenu(ev:MouseEvent){
    ev.preventDefault(); 
    const menu = new Menu();
    noteOptions(menu)
    menu.showAtMouseEvent(ev);
}

export function linkMenu(ev:MouseEvent){
	let link = ev.target as HTMLAnchorElement;
    ev.preventDefault(); 
    const menu = new Menu();
    actionItem(menu,"Go to note","note-glyph",()=>link.click())
	actionItem(menu,"Open in new tab","open-elsewhere-glyph",(e)=>{
		if(!link?.dataset?.href)
			return;
		let mode =(app.vault as any).getConfig("defaultViewMode");
		console.log({e,link})
		app.workspace?.openLinkText(link.dataset.href,".",true,
			{active:true, mode} as OpenViewState)
	})
    actionItem(menu,"Make Folder Note","folder-root",(e)=>{
		var folderNoteCore = (window as any).app.plugins.plugins["folder-note-core"] as FolderNoteCore;
        var path = link?.dataset?.href;
        var file = app.metadataCache.getFirstLinkpathDest(path,".");
        folderNoteCore.api.createFolderForNote(file).then(
            ()=>{
                //Call change event
                var plugin = (window as any).FNindex as FolderIndexPlugin;
                plugin.drawTrail();
            }
        )
        
	})
	
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
            // let data = new fmFromView(view);
            // data.setProp(prop,value);
			// data.editorSave();
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
                console.log(blockType);
                let view = app.workspace.getActiveViewOfType(MarkdownView)
                view.editor.replaceSelection(`\`\`\`${blockType}\n${content}\n\`\`\``)
            }
        )
    );
}

function actionItem(menu:Menu,title:string, icon:obsidianIcons, onclick:(ev?:MouseEvent) => any){
    menu.addItem((item) =>
        item.setTitle(title)
        .setIcon(icon)
        .onClick(onclick)
    );
}