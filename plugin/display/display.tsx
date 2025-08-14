import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Command, OpenViewState, Menu, TextFileView, MarkdownViewModeType, MarkdownPostProcessorContext, FileManager, Vault, MetadataCache } from 'obsidian';
import {indexData} from "../indexing"

import * as html from "../html"
import {JSX} from "../../../.sharedModules/JSX"
import {noteMenu} from '../contextMenu';
import { NoteConfig } from '../config';
import {indexBlock } from '../blocks/Blocks';
import { onHeadingLinkClick } from '../blocks/contentBlock';


/**Iterates the array from te center */
export function* iterateCenter(arr:Array<any>){
    let center = Math.ceil(arr.length/2);

    let top = arr.slice(center)
    let bot = arr.slice(0,center)

 
    while(top.length){
        while(bot.length>=top.length)
            yield bot.pop();
        yield top.shift();
    }

}

/**Iterates the array from both sides */
export function* iterateOuter(arr:Array<any>){
    let center = Math.ceil(arr.length/2);

    let top = arr.slice(center)
    let bot = arr.slice(0,center)

 
    while(top.length){
        
        yield top.pop();
        yield bot.shift();
        
    }
    while(bot.length)
            yield bot.shift();

}

(window as any).iterateCenter = iterateCenter;
(window as any).iterateOuter = iterateOuter;

/**Adds a title to the index */
export function addIndexTitle(summEl: HTMLElement, indexData: indexData) {
	let title = indexData.config?.indexPath ?? indexData?.name;
	summEl.append(` ${title} `);
	let link = summEl.createEl("a", {
		cls: "FN-link internal-link FN-gotoIndex", href: indexData.filePath, title: indexData.name, attr: { target: "_blank", rel: "noopener", "data-href": indexData.filePath, }
	});
	link.innerHTML = html.gotoIndex_icon;
	link.onclick=(e)=>{
		e.preventDefault()
		let mode =(app.vault as any).getConfig("defaultViewMode");
		app.workspace.activeLeaf?.openFile(indexData.file,
			{active:true, mode} as OpenViewState)
	}
	
}

/** Gets the currently active Markdown View */
export function getActiveMDView():{activeMDView:MarkdownView,mode:MarkdownViewModeType}{
	let container = null;
	const { RootIndexList=[], settings,  app } = this;

	const activeMDView = app.workspace.getActiveViewOfType(MarkdownView);
	//TODO: Compatiblidad con Kanban y DB plugin
	// const specialView = app.viewRegistry.viewByType?.["database-plugin"];
	// const activeSpecialView = specialView &&app.workspace.getActiveViewOfType(specialView);
	// console.log({activeSpecialView})
	const mode = activeMDView === null || activeMDView === void 0 ? void 0 : activeMDView.getMode();
	
	if (!activeMDView ||
		(mode !== "preview" && !true)) {
		(container = activeMDView === null || activeMDView === void 0 ? void 0 : 
			activeMDView.containerEl.querySelector(".FN-div")) === null || container === void 0 ? void 0 : container.remove();

		
	}
	return { activeMDView,mode};
}

/**Toggles if indexes should be open by default */
export let IndexOpen =true;

/**Lets other things modify the "indexOpen" variable */
export function setIndexOpen(value:boolean){
    IndexOpen = value;
}