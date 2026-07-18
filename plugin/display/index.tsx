import { MarkdownView, MarkdownViewModeType, Notice, OpenViewState, TFile } from 'obsidian';
import { IndexData } from '../indexing/indexData';
import { indexMenu } from '../contextMenu';
import { IndexOpen, setIndexOpen } from './display';
import * as html from '../html';
import * as JSX from "../../../.sharedModules/JSX obj"

/**Creates the container for the trail and index */
export function createFNDiv(activeMDView: MarkdownView, mode: MarkdownViewModeType, fData: IndexData) {
    const view = mode === "preview"
        ? activeMDView.previewMode.containerEl.querySelector("div.markdown-preview-view")
        : activeMDView.contentEl.querySelector("div.markdown-source-view");

    //Remove old
    activeMDView.containerEl?.querySelectorAll(".FN-div")?.forEach((div) => { div.remove(); });
    let {isIndex, config:{isSticky}={}} = fData??{};
    const fnDiv = createDiv({
        cls: `FN-div`+ (isIndex?" isIndex":"") + (isSticky?" isSticky":""),
    });

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
export function createContentDiv(activeMDView: MarkdownView, mode: MarkdownViewModeType, fData: IndexData) {
    const view = mode === "preview"
        ? activeMDView.previewMode.containerEl.querySelector("div.markdown-preview-view")
        : activeMDView.contentEl.querySelector("div.markdown-source-view");
    var contDiv: HTMLDivElement;
    //Remove Duplicates
    let divs = Array.from(activeMDView.containerEl?.querySelectorAll(".FN-content"));
    contDiv = divs.pop() as HTMLDivElement;
    divs?.forEach((div) => { div.remove(); });

    //Create new content div if none exists
    contDiv ??= <div cls='FN-content markdown-rendered' contenteditable='false'/> as HTMLDivElement;

    //Set position in view
    if (mode === "preview") {
        //Insert last in note header (after title and metadata)
        view.querySelector("div.markdown-preview-sizer>.mod-header")?.appendChild(contDiv);
    }
    else {
        //Insert Content Div right before content in a non editable section
        view.querySelector("div.cm-contentContainer")?.before(contDiv);
    }

    return contDiv;
}/**
 * Adds the index to a page
 * @param fnDiv Div used to put all Folder Note elements
 * @param indexData All info about the index
 */

export function addIndex(fnDiv: HTMLElement, indexData: IndexData) {
    //Index
    let { config } = indexData;
    
    let sumEv = {
        onclick: (ev) => {
            setIndexOpen(!(ev?.target as HTMLElement).parentElement
                .hasAttribute("open"));
        },
        oncontextmenu : indexMenu
    }
    const indexEl =<details {...{
        cls: `FN-index` + (config.expand ? " isExpanded" : ""),
        open: config.forceOpen || IndexOpen || null
    }}>
        <summary cls='FN-icon icon-index' {...sumEv}>
            <html.Index_icon/>
            {...Array.from(indexData?.config?.showTitle? addIndexTitle(indexData) : [])}
        </summary>
        {indexList=<ul cls='FN-indexList'/>}
    </details>;
    fnDiv.append(indexEl);

    // TODO: Make with JSX

    var indexList:HTMLElement;
 

    //Children
    for (let child of indexData.childNotes(config)) {
        if (indexData.file == child.file) // No mostrar el archivo actual en el índice
            continue;

        if (config.hideEmpty && child?.file == null)
            continue;
        // TODO: Use JSX factory for all the HTML
        let Icon = child.isFolder ? html.Folder_icon : (child.ext =="md"? html.Note_icon : html.Unknown_file_icon)
        let li = <li cls={child.isFolder?"FN-isFolder":null} data-icon={child.config?.icon??''}>
            <span cls='FN-icon' style={`--fn-color:${child.config?.color??''};`}>
                <Icon/>
            </span>
            {(!child.isFolder && child.ext != "md") && <span cls='FN-ext'>{`.${child.ext}`}</span>}
        </li>;
        indexList.append(li);
        
        li.append(child.fileLink());
    }
    var frag = <>
        <div cls='FN-cover'/>
        <div cls='FN-bottom'>
            <span cls="FN-expand FN-icon" tabindex={0}
                onclick={(ev: MouseEvent) => {
                    indexEl.toggleClass("isExpanded", !indexEl.hasClass("isExpanded"));
            }}><html.Expand_icon/></span>
            {<span cls="FN-newNote FN-icon" tabindex={0} ondblclick={(ev: MouseEvent) => {
                (app as any).commands.executeCommandById("file-explorer:new-file");
            }}><html.NewNote_icon/></span>}

        </div>
    </>
    indexEl.append(...frag.childNodes)

}


/**Adds a title to the index */
export function addIndexTitle(indexData: IndexData) {
	let title = indexData?.name;
    let {filePath:href, file}=indexData
	let ret = <>
        {` ${title} `}
    <a cls="FN-link internal-link FN-gotoIndex" href={href} title={title} target='_blank' rel='noopener' data-href={href}  onclick={(e) => {
            e.preventDefault();
            let mode = (app.vault as any).getConfig("defaultViewMode");
            app.workspace.activeLeaf?.openFile(file,
                { active: true, mode } as OpenViewState);
	    }}><html.GotoIndex_icon/></a>
    </>
    return [...ret.childNodes];
}

