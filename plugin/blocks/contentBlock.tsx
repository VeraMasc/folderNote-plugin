import { dotCommaObj as getConfig } from "../../../.sharedModules/Data Parsing"
import { MarkdownPostProcessorContext, TFile, CachedMetadata, MarkdownView, Component, Plugin, OpenViewState, HeadingCache } from "obsidian";

export const Id = "contentList";

import { PPContext as Context } from "../../../.sharedModules/obsidianUtils"
import { getActiveMDView } from "../display/display";
import * as bm from "./bookmark"
import { insertBlockAsHeading, blockAsHeading, bmPattern, bmHeadingPattern } from "./bookmark";

import * as JSX from "../../../.sharedModules/JSX obj"
import { longBookmark_icon } from "../html";


// TODO: Refactor this entire file

/**Block Markdown processor */
export function generateBlock(source, el: HTMLElement, ctx: Context, plugin: Plugin) {
	try {
		let config = getConfig(source) as Config;
		let data = getMetaData(ctx);
		renderContents(el, data, config, ctx, plugin);

	} catch (err) {
		console.error(err);
		el.innerText = err + "";
	}

}

let cache:HeadingCache[];

/**Regenerates an existing block to keep it updated*/
export function regenerateBlock(config:Config, el: HTMLElement, ctx: Context, plugin: Plugin) {
	let temp = createDiv({ cls: "block-language-contentList" });
	try {
		let data = getMetaData(ctx);
		let contents = restrictContents( ctx, el,  data, config);
		if(config?.listBlocks && data.blocks)
			contents = insertBlockAsHeading(contents, Object.values(data.blocks))
		// TODO: Improve bookmark display
		if(data.blocks?.[bmPattern])
			contents.unshift(blockAsHeading(data.blocks?.[bmPattern],2))
		let hasChanged = !checkSameHeadings(contents,cache);
		
		if(hasChanged){
			if(hasChanged && !!cache){ // HACK: For testing 
				console.warn(`Headings changed ${[...cache].length}=>${[...(data.headings??[])].length}`,{old:[...cache], "new":[...contents]})
			}
			renderContents(temp, {...data, headings:contents}, config, ctx, plugin);
			//Replace previous
			el.replaceChildren(temp);
		}
		cache = contents; // ? Redundant?
	} catch (err) {
		temp.innerText = err + "";
		el.replaceChildren(temp);
		cache=[]
		console.error(err)
	}

}

/**Clears the block and updates the cache */
export function clearBlock(contDiv:HTMLElement){
	contDiv.empty()
	cache=[]
}

/**Checks if both heading lists contain the same exact headings */
function checkSameHeadings(a:HeadingCache[],b:HeadingCache[]){
	return a != null && a.length === b?.length && a.every(
		(h,i) =>h.heading === b[i].heading && h.level === b[i].level
	)

}

/**Renders the content of the block */
function renderContents(el: HTMLElement, data: CachedMetadata, config: Config, ctx: Context, plugin: Plugin) {
	el.parentElement?.addClass("compactBlock");
	data ??= { }; //If no cached data
	let headings = restrictContents( ctx, el,  data, config);
	renderListElements(el, config, headings);
}

/** Limits the rendering to a specific set of headings if needed
 * @returns list of the contents to display
*/
function restrictContents( ctx: MarkdownPostProcessorContext, el: HTMLElement, data: CachedMetadata, config: Config) {
	let  headings  = [...(data?.headings ?? [])]; //Avoid operating on metadata
	let { from, relative, excludeRoot=true } = config;
	if (relative) {
		//Use parent heading
		let section = ctx.getSectionInfo(el);
		let parentH = headings.filter(
			(h) => h.position.start.line < section.lineStart
		).last();
		from = parentH?.heading;
	}

	if (from) {
		headings = getSubheadings(ctx, el, data, from || null);
		//Remove excess root
		if (excludeRoot && headings?.length) {
			headings.shift();
		}
	}
	return headings;
}

/** Renders the list elements of the table of contents */
function renderListElements(el: HTMLElement, config: Config, headings: HeadingCache[]) {
	let list = renderHeadingList(config, headings, el);

	//Remove unnecessary indentation
	let element: Element = list[0].firstElementChild;
	var count = 1;
	while (element?.children.length == 1 && element.firstElementChild.tagName == "OL") {
		element.addClass("no-indent");
		element = element?.firstElementChild?.firstElementChild;
		count++;
	}

	//Depth based border color
	if (count > 1) {
		el.setAttribute("h-depth", count + '');
	}
}

/**Renders the list of headings
 * @param config Rendering config to use
 * @param headings List of headings to render
 * @param el Parent element where the headings should be rendered
*/
function renderHeadingList(config:Config, headings:HeadingCache[], el:HTMLElement) {
	let maxDepth = (config.maxDepth && Number.parseInt(config.maxDepth)); 

	let list = [el.createEl("ol", { cls: "noteContents" })]
	let line: HTMLLIElement | null = null;

	//Render headings
	for (let head of headings ?? []) {
		let { level, heading } = head;

		if (maxDepth && maxDepth < level)//Limit depth
			continue;

		line = getLine(level, list, line)

		let link = <a href={"#" + heading} data-href={"#" + heading} className="internal-link" target="_blank" rel="noopener">
			{heading}
		</a>;
		if (heading == bmHeadingPattern) // HACK: Inserts the icon in a really haphazard way
			link.innerHTML = longBookmark_icon;
		line.append(link)

		if (config.customLinkEv) {
			link.onclick = onHeadingLinkClick(); //It doesn't trigger otherwise
		}
	}
	return list;
}


/**Generates the specific line of the header block 
 * @param level Current level
 * @param list Lists the parent <ol> of the new line
 * @param line Previous <li> generated (not nested)
*/
function getLine(level: number, list: Array<HTMLOListElement>, line: HTMLLIElement | null) {
	while (level > list.length) { //Loop to generate nested lines
		let noMarker = level > list.length ? "noMarker" : "";
		line ??= list.last().createEl("li", { cls: `header-level:${list.length} ${noMarker}` })
		list.push(line.createEl("ol"));
		line = null; //This allows for depth increases > 1. (the while loops)
	}
	while (level < list.length) { //Undo nesting when finished
		list.pop();
	}

	return list.last().createEl("li", { cls: "header-level:" + level });
}


/**Obtains headers and subheaders of the given file
 * @param from Header to use as root for the index
 * @returns new list with subheadings
*/
function getSubheadings(ctx: Context, el: HTMLElement, data: CachedMetadata, from: string) {
	let ret = data.headings;
	if(!ret)
		return [];
	//Ignore if from is null
	if (!from)
		return [...ret];
	let start = Math.max(ret.findIndex((h) => h.heading == from), 0)
	let maxLevel = ret[start]?.level ?? 0
	ret = ret.slice(start + 1)
	let end = ret.findIndex((h) => h.level <= maxLevel)
	if (end == -1) end = undefined;
	ret = ret.slice(0, end)
	ret.unshift(data.headings[start])
	return ret;
}

/**Config parameters of the code block */
export type Config = {
	/**Maximum depth of the headings to render */
	maxDepth?: string,
	/** Use block position to determine parent heading to use as root*/
	relative?,
	/**What header to use as root */
	from?: string,
	/**If root marked with {@link Config.from} should be omitted */
	excludeRoot?: boolean,
	/**Overrides the default click event in case it's blocked */
	customLinkEv?: boolean,
	/** Makes blocks get treated as headings*/
	listBlocks?:boolean;
}

/**Gets the metadata of the current file */
function getMetaData(ctx: Context) {
	let file = app.vault.getAbstractFileByPath(ctx.sourcePath) as TFile;
	let cache = app.metadataCache.getFileCache(file);
	// console.log({cache,ctx})
	return cache;
}


/**Replaces the default link click event in the cases it doesn't work naturally */
export function onHeadingLinkClick() {
	return (e: MouseEvent) => {
		e.preventDefault()
		let mode = (app.vault as any).getConfig("defaultViewMode");
		let target = e.target as HTMLAnchorElement;
		let path = target.closest('a').getAttribute("data-href");
		let match = path.match(/^(.*)#(.*?)$/)
		let [, filepath, heading] = match; //Separates heading from path

		let activeMDView: MarkdownView = getActiveMDView()?.activeMDView;
		let current = activeMDView?.file;
		let linkFile = (app.metadataCache).getFirstLinkpathDest(filepath, current.path);

		if (target) {
			app.workspace.activeLeaf?.openFile(linkFile,
				{
					active: true, mode,
					eState: {
						active: true,
						focus: true,
						subpath: heading,
					}
				} as OpenViewState
			);
		}
	}

}