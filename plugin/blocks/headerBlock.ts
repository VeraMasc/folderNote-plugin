import {dotCommaObj as getConfig} from "../../../.sharedModules/Data Parsing"
import { MarkdownPostProcessorContext, TFile ,CachedMetadata, MarkdownView,Component, Plugin} from "obsidian";

export const Id = "headerIndex";

import {PPContext as Context }from "../../../.sharedModules/obsidianUtils"

export function generateBlock(source, el:HTMLElement, ctx:Context,plugin:Plugin){
	try{
		let config = getConfig(source) as config;
		let data = getMetaData(ctx);
		renderContents(el,data,config,ctx,plugin);
	}catch(err){
		console.error(err);
		el.innerText=err+"";
	}

}

function renderContents(el:HTMLElement, data:CachedMetadata,config:config,ctx: Context,plugin:Plugin){
	let {headings} =data;
	let {from,relative}=config;
	if(relative||from){
		headings=getSubheaders(ctx,el,data,from||null)
	}

	el.parentElement?.addClass("compactBlock");
	let depth = (config.depth && Number.parseInt(config.depth)) 
		|| 4;
	let list = [el.createEl("ol",{cls:"noteContents"})]
	let line:HTMLElement|null = null;
	for(let head of headings){
		let {level,heading} =head;

		if(depth && depth<level)
			continue;
		
		line = getLine(level,list,line)

		let link = line.createEl("a",{href:"#"+heading,cls:"internal-link",text:heading,
			attr:{target:"_blank",rel:"noopener","data-href":"#"+heading}});
		
		
	}
	
	// if(config.toTop){
	// 	console.warn("toTop")
	// 	let leaf = app.workspace.getActiveViewOfType(MarkdownView);
	// 	leaf.contentEl.querySelectorAll(".ContentBlock-toTop").forEach(e =>e.remove() );
	// 	let topEl =createSpan({text:"toTop",cls:"ContentBlock-toTop",attr:{style:"position:sticky; top:50px;"}});

	// 	plugin.registerDomEvent(el as HTMLElement,"",(()=>console.log("loaded",el.parentElement))),
	// 	topEl.insertAfter(el);
	// 	console.warn("toTop",topEl)
	// }
}

function getLine(level:number,list:Array<HTMLElement>,line:HTMLElement|null){

	while(level > list.length){
		let noMarker = level > list.length?"noMarker":"";
		line ??= list.last().createEl("li",{cls:`header-level:${list.length} ${noMarker}`})
		let ol;
		list.push( ol=line.createEl("ol"));
		line=null;		
	}
	while(level < list.length){
		list.pop();
	}

	return list.last().createEl("li",{cls:"header-level:"+level});
}

function getSubheaders(ctx:Context,el:HTMLElement,data:CachedMetadata,from?:string){
	let ret = data.headings;
	if(!from){
		let section = ctx.getSectionInfo(ctx.el)
		throw new Error("Not implemented");
	}
	let start = Math.max(ret.findIndex((h)=>h.heading==from),0)
	let maxLevel = ret[start]?.level ??0
	ret=ret.slice(start+1)
	let end = ret.findIndex((h)=>h.level<=maxLevel)
	if(end==-1) end=undefined;
	ret=ret.slice(0,end)
	ret.unshift(data.headings[start])
	return ret;
}

export type config={
	depth,
	relative,
	from,
	toTop
}

function getMetaData(ctx:Context){
	let file = app.vault.getAbstractFileByPath(ctx.sourcePath) as TFile;
	let cache = app.metadataCache.getFileCache(file);
	console.log({cache,ctx})
	return cache;
}

function getToIndex(el:HTMLElement){
	// app.workspace.
}