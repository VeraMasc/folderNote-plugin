import {addIcon, MarkdownView, Menu, OpenViewState} from "obsidian";
import { type } from "os";
import {fromView as fmFromView, valueRegex} from "../../.sharedModules/FrontMatter";
import { obsidianIcons } from '../../.sharedModules/obsidianUtils';

export function indexMenu(ev){
    ev.preventDefault(); 
    const menu = new Menu();
    setPropItem(menu, "Keep Open", "expand-vertically", "FN-forceOpen")
    setPropItem(menu, "Expanded by default", "fullscreen", "FN-expand")
	setPropItem(menu, "Hide files", "scissors", "FN-hideRegExp",'"\\\\..+$(?<!\\\\.md$)"')
	setPropItem(menu, "Make it sticky", "pin", "FN-isSticky")
    noteOptions(menu)
    menu.showAtMouseEvent(ev);
}

function noteOptions(menu:Menu){
	setPropItem(menu, "Make it sticky", "pin", "FN-isSticky")
	setPropItem(menu, "Use custom color","highlight-glyph" , "FN-color","yellowgreen")
	addIcon("testIco","")
}

export function noteMenu(ev){
    ev.preventDefault(); 
    const menu = new Menu();
    noteOptions(menu)
    menu.showAtMouseEvent(ev);
}

export function linkMenu(ev){
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
	
    menu.showAtMouseEvent(ev);
}



function setPropItem(menu:Menu,title:string, icon:obsidianIcons, prop:string, value:any=true){
    menu.addItem((item) =>
        item.setTitle(title)
        .setIcon(icon)
        .onClick(() => {
            let view = app.workspace.getActiveViewOfType(MarkdownView)
            let data = new fmFromView(view);
            data.setProp(prop,value);
            data.editorSave();
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