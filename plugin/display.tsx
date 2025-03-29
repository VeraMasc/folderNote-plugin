import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Command, OpenViewState, Menu, TextFileView, MarkdownViewModeType, MarkdownPostProcessorContext, FileManager, Vault, MetadataCache } from 'obsidian';
import * as DOMu from "../../.sharedModules/DOM Utils"
import FI_Plugin from "./main"
import {indexData} from "./indexing"

import * as html from "./html"
import {JSX} from "../../.sharedModules/JSX"
import {currentNoteMenu, indexMenu,noteMenu} from './contextMenu';
import { NoteConfig } from './config';
import { getContextOf } from './blocks/BlockUtils';
import { headerBlock, indexBlock } from './blocks/Blocks';
import { onHeaderLinkClick } from './blocks/headerBlock';


//TODO: Mejorar y documentar proceso de renderizado


/**Renders the path trail and and additional elements
 * @param activeMDView what view we need to draw the trail on
 * @param mode mode of the view
 * @param plugin reference to the plugin
*/
export function Trail(activeMDView:MarkdownView, mode:MarkdownViewModeType, plugin:FI_Plugin){
	if(!activeMDView)
		return;
    const { file } = activeMDView;

  
    let note = plugin.tree.getNode(file)

	let {isIndex} = note;
	let {ignore,color:fnColor,listContent}= note.config;
    const { basename,parent } = file;



    /*	Is Index?	*/

    if(ignore){
        return;
    }



	let index= isIndex? note : note?.parent;
  
	

    //Display
	let fnDiv = createFNDiv(activeMDView,mode,note)
    let contDiv = createContentDiv(activeMDView,mode,note)
    if(listContent && contDiv){
        let ctx = getContextOf(note.file);
        let div = contDiv.createDiv({cls:"block-language-headerIndex"});
        headerBlock.generateBlock("customLinkEv:true;", div, ctx, plugin)

        
    }
    // Trail
	let trailScroll = fnDiv.createEl('div',{cls: "FN-trail-scroller",attr:{tabindex:0}})
    let trailDiv = trailScroll.createEl('span',{cls: "FN-trail"})
	
        
	let pathList = index?.getSplitPath() ?? [];
	//Root

	let root = pathList.shift();
	let el = root?.fileLink();
	trailDiv.appendChild(el);

	for(let step of pathList){
		trailDiv.createEl("span",{cls:"FN-trail-arrow",text:" → "})
		el = step?.fileLink();
		trailDiv.appendChild(el);
	}
	el.addClass("FN-current")

        

    if (isIndex){
        addIndex(fnDiv,index)
        el.oncontextmenu=currentNoteMenu; //Set context menu
	}
	else
	{
		let arrow = trailDiv.createEl("span",{cls:"FN-trail-arrow FN-end-arrow",text:" ↓ "})
		arrow.oncontextmenu=currentNoteMenu;
		if(fnColor)
			arrow.style.setProperty("--text-normal", fnColor);
	}

    //Observer
	plugin.trailResizeObs.observe(fnDiv);
}

let trailSize = null;

/**Resizing observer to deal with trail overflowing */
export function trailOverflow(elements,observer){
	
    for (let {target} of elements){
		let trail = target.querySelector(".FN-trail")
        let hasOverflow=DOMu.isOverflowing(trail);

        if(hasOverflow){
            let steps:HTMLElement[] = [...trail.querySelectorAll(".FN-link")]
           
            for(let step of iterateCenter(steps)){

                step.addClass("FN-ellipsis")
                if(!DOMu.isOverflowing(trail))
                    break;
            }
        }
		else if(DOMu.canGrow(trail,null,10,"x")){
			let steps:HTMLElement[]  = [...trail.querySelectorAll(".FN-link")]
			for(let step of iterateOuter(steps)){
				if(!step.hasClass("FN-ellipsis"))
				continue;
				step.removeClass("FN-ellipsis")
				if(DOMu.isOverflowing(trail)){
					step.addClass("FN-ellipsis")
					break;
        		}
    		}
		}

    }

}


/**Iterates the array from te center */
function* iterateCenter(arr:Array<any>){
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
function* iterateOuter(arr:Array<any>){
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

/**
 * Adds the index to a page
 * @param fnDiv Div used to put all Folder Note elements
 * @param indexData All info about the index
 */
export function addIndex(fnDiv:HTMLElement,indexData:indexData){
    //Index
    let {config} = indexData;
    const indexEl = fnDiv.createEl("details",{
        cls: `FN-index` + (config.expand?" isExpanded":""),
        attr:{open: config.forceOpen||IndexOpen||null}
    }); 
    
    const indexSum = indexEl.createEl("summary",{
        cls: `FN-icon icon-index`,
        
	});
	//Summary
	indexSum.innerHTML = html.index_icon;
	if (indexData?.config?.showTitle)
		addIndexTitle(indexSum, indexData); //Show Title if needed
	
    indexSum.onclick= (ev)=>{
        IndexOpen=!(ev?.target as HTMLElement).parentElement
        .hasAttribute("open");
    }

    indexSum.oncontextmenu = indexMenu;

    const indexList= indexEl.createEl("ul",{
        cls: `FN-indexList`,
        
    }); 
    
    //Children
    for(let child of indexData.childNotes(config)){
        if(indexData.file == child.file) // No mostrar el archivo actual en el índice
            continue;

        if(config.hideEmpty && child?.file == null)
            continue;
        let li = indexList.createEl("li")
        
        if (child.isFolder) 
            li.addClass("FN-isFolder")
        

        if (child.config.icon){
            //li.style.setProperty("--icon",child.config.icon)
            li.setAttr("data-icon",child.config.icon);
        }else{ 
            let icon = li.createEl("span",{cls:"FN-icon"});
            icon.innerHTML= child.isFolder? html.folder_icon : html.note_icon;
        }
        li.append(child.fileLink())
        if(!child.isFolder && child.ext != "md")
            li.createEl("span",{cls:"FN-ext",text:`.${child.ext}`})
    }
	indexEl.createDiv({cls:"FN-cover"})
	let indexBottom = indexEl.createDiv({cls:"FN-bottom"})
    let expandIndex = indexBottom.createEl("span",{cls:"FN-expand FN-icon",attr:{tabindex:0}})
    expandIndex.innerHTML= html.expand_icon;
    expandIndex.onclick =  (ev:MouseEvent)=>{
        
        indexEl.toggleClass("isExpanded", !indexEl.hasClass("isExpanded"))
    };
	

    let addNote =indexBottom.createEl("span",{cls:"FN-icon FN-newNote",attr:{tabindex:0}})
    addNote.innerHTML = html.newNote_icon;
	addNote.ondblclick = (ev:MouseEvent)=>{
		
		(app as any).commands.executeCommandById("file-explorer:new-file");
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

/**Creates the container for the trail and index */
function createFNDiv(activeMDView:MarkdownView,mode:MarkdownViewModeType,fData:indexData){
	const view = mode === "preview"
	? activeMDView.previewMode.containerEl.querySelector("div.markdown-preview-view")
	: activeMDView.contentEl.querySelector("div.markdown-source-view");

    //Remove old
	activeMDView.containerEl?.querySelectorAll(".FN-div")?.forEach((div) =>{ div.remove()});

	const fnDiv = createDiv({
        cls: `FN-div`,
        
    });
    //Set Css settings
	if(fData?.config?.isIndex)
        fnDiv.addClass("isIndex")
	if(fData?.config?.isSticky)
        fnDiv.addClass("isSticky")

    //Set position in view
    if (mode === "preview") {
        view.querySelector("div.markdown-preview-sizer").before(fnDiv);
        
    }
    else {

        //Handle gutter (If it exists)
        const cmGutter = view.querySelector("div.cm-gutters") as HTMLElement;
        if (cmGutter) {
            requestAnimationFrame(() => {
                const gutterHeight = fnDiv.getBoundingClientRect().height;
                // set padding top of gutter to match height of trailDiv
                cmGutter.style.paddingTop = `${gutterHeight + 4}px`;
            });
        }
        
        //Insert FN Div as first element
		view.querySelector("div.cm-sizer")?.firstChild?.before(fnDiv);
    }
	fnDiv.empty();
	return fnDiv;
}

/**Creates the div to display internal content of the note, like a header index */
function createContentDiv(activeMDView:MarkdownView,mode:MarkdownViewModeType,fData:indexData){
	const view = mode === "preview"
	? activeMDView.previewMode.containerEl.querySelector("div.markdown-preview-view")
	: activeMDView.contentEl.querySelector("div.markdown-source-view");

    //Remove old
	activeMDView.containerEl?.querySelectorAll(".FN-content")?.forEach((div) =>{ div.remove()});

    //Create new content div
	const contDiv = createDiv({
        cls: `FN-content markdown-rendered`,
        attr:{contenteditable:false},
        
    });
	
    //Set position in view
    if (mode === "preview") {
       
        //Insert last in note header (after title and metadata)
        view.querySelector("div.markdown-preview-sizer>.mod-header")?.appendChild(contDiv);
        
    }
    else {
        
        //Insert Content Div right before content in a non editable section
		view.querySelector("div.cm-contentContainer")?.before(contDiv);
        let testSpan = createDiv({
            cls: `FN-content markdown-rendered`,
            attr:{contenteditable:false},
            text:"test"
            
        })

        
        
    }
	contDiv.empty();
	return contDiv;
}

/**Toggles if indexes should be open by default */
export let IndexOpen =true;