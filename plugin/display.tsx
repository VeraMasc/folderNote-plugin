import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Command, OpenViewState, Menu } from 'obsidian';
import * as DOMu from "../../.sharedModules/DOM Utils"
import FolderIndexPlugin from "./main"
import {indexData} from "./indexing"

import * as html from "./html"
import {JSX} from "../../.sharedModules/JSX"
import {indexMenu,noteMenu} from './contextMenu';
import { noteConfig } from './config';


//TODO: Mejorar y documentar proceso de renderizado

export function Trail(activeMDView:MarkdownView, mode, plugin:FolderIndexPlugin){
	if(!activeMDView)
		return;
    const { file } = activeMDView;

  
    let note = plugin.map.getNode(file)

	let {isIndex} = note;
	let {ignore,color:fnColor}= note.config;
    const { basename,parent } = file;



    /*	Is Index?	*/

    if(ignore){
        return;
    }



	let index= isIndex? note : note?.parent;
  
	

    //Display
	let fnDiv = createFNDiv(activeMDView,mode,note)


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
	}
	else
	{
		let arrow = trailDiv.createEl("span",{cls:"FN-trail-arrow FN-end-arrow",text:" ↓ "})
		arrow.oncontextmenu=noteMenu;
		if(fnColor)
			arrow.style.setProperty("--text-normal", fnColor);
	}

    //Observer
	plugin.trailResizeObs.observe(fnDiv);
}

let trailSize = null;

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



function* iterateCenter(arr){
    let center = Math.ceil(arr.length/2);

    let top = arr.slice(center)
    let bot = arr.slice(0,center)

 
    while(top.length){
        while(bot.length>=top.length)
            yield bot.pop();
        yield top.shift();
    }

}
function* iterateOuter(arr){
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


export function addIndexTitle(summEl: HTMLElement, indexData: indexData) {
	let title = indexData.config?.indexPath ?? indexData?.name;
	summEl.append(` ${title} `);
	var link = summEl.createEl("a", {
		cls: "FN-link FN-gotoIndex", href: indexData.filePath, title: indexData.name, attr: { target: "_blank", rel: "noopener", "data-href": link, }
	});
	link.innerHTML = html.gotoIndex_icon;
	//indexData.fileLink()
}

export function addIndex(fnDiv:HTMLElement,indexData:indexData){
    //Index
    let {config} = indexData;
    const indexEl = fnDiv.createEl("details",{
        cls: `FN-index` + (config.expand?" isExpanded":""),
        attr:{open: config.forceOpen==true||IndexOpen||null}
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
        //TODO: this.app.workspace.openLinkText("Archivo/Biblioteca/Ejercicios/Ejercicios",".")
		
		(app as any).commands.executeCommandById("file-explorer:new-file");
    }
    
}

export function drawIndex(){
	const {activeMDView,mode}= getActiveMDView();
	activeMDView
}

export function getActiveMDView(){
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
	return {activeMDView,mode};
}

function createFNDiv(activeMDView,mode,fData:indexData){
	const view = mode === "preview"
	? activeMDView.previewMode.containerEl.querySelector("div.markdown-preview-view")
	: activeMDView.contentEl.querySelector("div.markdown-source-view");

	activeMDView.containerEl?.querySelectorAll(".FN-div")?.forEach((div) =>{ div.remove()});

	const fnDiv = createDiv({
        cls: `FN-div`,
        
    });
	if(fData?.config?.isIndex)
        fnDiv.addClass("isIndex")
	if(fData?.config?.isSticky)
        fnDiv.addClass("isSticky")
    if (mode === "preview") {
        view.querySelector("div.markdown-preview-sizer").before(fnDiv);
        
    }
    else {
        const cmGutter = view.querySelector("div.cm-gutters") as HTMLElement;
        if (cmGutter) {
            requestAnimationFrame(() => {
                const gutterHeight = fnDiv.getBoundingClientRect().height;
                // set padding top of gutter to match height of trailDiv
                cmGutter.style.paddingTop = `${gutterHeight + 4}px`;
            });
        }
        
		view.querySelector("div.cm-sizer")?.firstChild?.before(fnDiv);
    }
	fnDiv.empty();
	return fnDiv;
}


export let IndexOpen =false;