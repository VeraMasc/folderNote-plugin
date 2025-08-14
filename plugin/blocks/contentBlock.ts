import { dotCommaObj as getConfig } from "../../../.sharedModules/Data Parsing"
import { MarkdownPostProcessorContext, TFile, CachedMetadata, MarkdownView, Component, Plugin, OpenViewState, HeadingCache } from "obsidian";

export const Id = "contentIndex";

import { PPContext as Context } from "../../../.sharedModules/obsidianUtils"
import { getActiveMDView } from "../display/display";

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



/**Renders the content of the block */
function renderContents(el: HTMLElement, data: CachedMetadata, config: Config, ctx: Context, plugin: Plugin) {
	data ??= { }; //If no cached data
	let  headings  = [...(data.headings ?? [])]; //Avoid operating on metadata
	let { from, relative, excludeRoot=true } = config;

	//TODO: refactor renderContents for readability
	//TODO: add message for when there's no headings
	//Render from heading
	if (relative) {
		//Use parent heading
		let section = ctx.getSectionInfo(el)
		let parentHeader = headings.filter(
			(h) => h.position.start.line < section.lineStart
		).last()
		from = parentHeader?.heading;
	}

	if (from) {
		headings = getSubheaders(ctx, el, data, from || null)
		//Remove excess root
		if (excludeRoot && headings?.length) {
			headings.shift()
		}
	}

	
	//Render list
	el.parentElement?.addClass("compactBlock");
	let list = renderHeadingList(config, headings,el)


	//Remove unnecessary indentation
	let element: Element = list[0].firstElementChild;
	var count = 1;
	while (element?.children.length == 1 && element.firstElementChild.tagName == "OL") {
		element.addClass("no-indent")
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
	let maxDepth = (config.maxDepth && Number.parseInt(config.maxDepth))
		|| 4; 

	let list = [el.createEl("ol", { cls: "noteContents" })]
	let line: HTMLLIElement | null = null;

	//Render headings
	for (let head of headings ?? []) {
		let { level, heading } = head;

		if (maxDepth && maxDepth < level)//Limit depth
			continue;

		line = getLine(level, list, line)

		let link = line.createEl("a", {
			href: "#" + heading, cls: "internal-link", text: heading,
			attr: { target: "_blank", rel: "noopener", "data-href": "#" + heading }
		});

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
*/
function getSubheaders(ctx: Context, el: HTMLElement, data: CachedMetadata, from: string) {
	let ret = data.headings;
	//Ignore if from is null
	if (!from)
		return ret;
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
		let path = target?.getAttribute("data-href");
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