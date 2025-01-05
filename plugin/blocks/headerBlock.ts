import {dotCommaObj as getConfig} from "../../../.sharedModules/Data Parsing"
import { MarkdownPostProcessorContext, TFile ,CachedMetadata, MarkdownView,Component, Plugin, OpenViewState} from "obsidian";

export const Id = "headerIndex";

import {PPContext as Context }from "../../../.sharedModules/obsidianUtils"
import { getActiveMDView } from "../display";

/**Block Markdown processor */
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

/**Renders the content of the block */
function renderContents(el:HTMLElement, data:CachedMetadata,config:config,ctx: Context,plugin:Plugin){
	data ??= {headings:[]}; //If no cached data
	let {headings} =data;
	let {from,relative, excludeRoot}=config;
	if(relative||from){
		headings=getSubheaders(ctx,el,data,from||null)
	}
	
	if(excludeRoot && headings?.length){
		headings.shift()//Remove excess root
	}
	
	el.parentElement?.addClass("compactBlock");
	let depth = (config.depth && Number.parseInt(config.depth)) 
		|| 4;
	let list = [el.createEl("ol",{cls:"noteContents"})]
	let line:HTMLLIElement|null = null;


	for(let head of headings ?? []){
		let {level,heading} =head;

		if(depth && depth<level)//Limit depth
			continue;
		
		line = getLine(level,list,line)

		let link = line.createEl("a",{href:"#"+heading,cls:"internal-link",text:heading,
			attr:{target:"_blank",rel:"noopener","data-href":"#"+heading}});
		
		if(config.customLinkEv){
			link.onclick = onHeaderLinkClick(); //It doesn't trigger otherwise
		}
	}
	
	//Remove unnecessary indentation
	let element:Element= list[0].firstElementChild;
	var count=1;
	while(element?.children.length==1 && element.firstElementChild.tagName=="OL"){
		element.addClass("no-indent")
		element = element?.firstElementChild?.firstElementChild;
		count++;
	}
		
	//Depth based border color
	if(count>1){
		el.setAttribute("h-depth", count+'');
	}
	

	// 	plugin.registerDomEvent(el as HTMLElement,"",(()=>console.log("loaded",el.parentElement))),
	// 	topEl.insertAfter(el);
	// 	console.warn("toTop",topEl)
	// }
}

/**Generates the specific line of the header block 
 * @param level Current level
 * @param list Lists the parent <ol> of the new line
 * @param line Previous <li> generated (not nested)
*/
function getLine(level:number,list:Array<HTMLOListElement>,line:HTMLLIElement|null){
	while(level > list.length){ //Loop to generate nested lines
		let noMarker = level > list.length?"noMarker":"";
		line ??= list.last().createEl("li",{cls:`header-level:${list.length} ${noMarker}`})
		list.push(line.createEl("ol"));
		line=null; //This allows for depth increases > 1. (the while loops)
	}
	while(level < list.length){ //Undo nesting when finished
		list.pop();
	}

	return list.last().createEl("li",{cls:"header-level:"+level});
}


/**Obtains headers and subheaders of the given file
 * @param from Header to use as root for the index
*/
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

/**Config parameters of the code block */
export type config={
	depth?:string,
	/** Block is relative  */ //TODO:Relative to what???
	relative?,
	/**What header to use as root */
	from?:string,
	/**If root marked with {@link config.from} should be omitted */
	excludeRoot?:boolean,
	/**Overrides the default click event in case it's blocked */
	customLinkEv?:boolean,
}

/**Gets the metadata of the current file */
function getMetaData(ctx:Context){
	let file = app.vault.getAbstractFileByPath(ctx.sourcePath) as TFile;
	let cache = app.metadataCache.getFileCache(file);
	// console.log({cache,ctx})
	return cache;
}

function getToIndex(el:HTMLElement){
	// app.workspace.
}

/**Replaces the default link click event in the cases it doesn't work naturally */
export function onHeaderLinkClick(){
	return (e:MouseEvent)=>{
		e.preventDefault()
		let mode =(app.vault as any).getConfig("defaultViewMode");
		let target = e.target as HTMLAnchorElement;
		let path = target?.getAttribute("data-href");
		let match = path.match(/^(.*)#(.*?)$/)
		let heading = match?.[2];
		let filepath = match?.[1]; //Path without the heading subpath
		let activeMDView:MarkdownView = getActiveMDView()?.activeMDView;
		let current = activeMDView?.file;

		
		let linkFile = (app.metadataCache).getFirstLinkpathDest(filepath,current.path);

		if(target){
			
			app.workspace.activeLeaf?.openFile(linkFile,
				{active:true, 
					mode,
					eState:{
						active: true,
						focus: true,
						subpath: heading,
					}
				} as OpenViewState
			);
		}
	}					
					
}