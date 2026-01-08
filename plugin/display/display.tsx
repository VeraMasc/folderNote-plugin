import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Command, Menu, TextFileView, MarkdownViewModeType, MarkdownPostProcessorContext, FileManager, Vault, MetadataCache } from 'obsidian';

import {JSX} from "../../../.sharedModules/JSX"
import {noteMenu} from '../contextMenu';
import { NoteConfig } from '../config';
import {indexBlock } from '../blocks/Blocks';
import { onHeadingLinkClick } from '../blocks/contentBlock';





/** Gets the currently active Markdown View */
export function getActiveMDView():{activeMDView:MarkdownView,mode:MarkdownViewModeType}{
	let container = null;
	const { RootIndexList=[], settings,  app } = this;

	const activeMDView = app.workspace.getActiveViewOfType(MarkdownView);
	// TODO: Compatiblidad con Kanban y DB plugin
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