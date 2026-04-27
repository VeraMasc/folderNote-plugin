import { MarkdownView, MarkdownViewModeType, OpenViewState } from 'obsidian';
import { IndexData } from '../indexing/indexData';
import { indexMenu } from '../contextMenu';
import { IndexOpen, setIndexOpen } from './display';
import * as html from '../html';


/**Creates the container for the trail and index */
export function createFNDiv(activeMDView: MarkdownView, mode: MarkdownViewModeType, fData: IndexData) {
    const view = mode === "preview"
        ? activeMDView.previewMode.containerEl.querySelector("div.markdown-preview-view")
        : activeMDView.contentEl.querySelector("div.markdown-source-view");

    //Remove old
    activeMDView.containerEl?.querySelectorAll(".FN-div")?.forEach((div) => { div.remove(); });

    const fnDiv = createDiv({
        cls: `FN-div`,
    });
    //Set Css settings
    if (fData?.config?.isIndex)
        fnDiv.addClass("isIndex");
    if (fData?.config?.isSticky)
        fnDiv.addClass("isSticky");

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
    contDiv ??= createDiv({
        cls: `FN-content markdown-rendered`,
        attr: { contenteditable: false },
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
            attr: { contenteditable: false },
        });



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
    const indexEl = fnDiv.createEl("details", {
        cls: `FN-index` + (config.expand ? " isExpanded" : ""),
        attr: { open: config.forceOpen || IndexOpen || null }
    });

    const indexSum = indexEl.createEl("summary", {
        cls: `FN-icon icon-index`,
    });
    //Summary
    indexSum.innerHTML = html.index_icon;
    if (indexData?.config?.showTitle)
        addIndexTitle(indexSum, indexData); //Show Title if needed

    indexSum.onclick = (ev) => {
        setIndexOpen(!(ev?.target as HTMLElement).parentElement
            .hasAttribute("open"));
    };

    indexSum.oncontextmenu = indexMenu;

    const indexList = indexEl.createEl("ul", {
        cls: `FN-indexList`,
    });

    //Children
    for (let child of indexData.childNotes(config)) {
        if (indexData.file == child.file) // No mostrar el archivo actual en el índice
            continue;

        if (config.hideEmpty && child?.file == null)
            continue;
        let li = indexList.createEl("li");

        if (child.isFolder)
            li.addClass("FN-isFolder");


        if (child.config.icon) {
            //li.style.setProperty("--icon",child.config.icon)
            li.setAttr("data-icon", child.config.icon);
        } else {
            let icon = li.createEl("span", { cls: "FN-icon" });
            icon.innerHTML = child.isFolder ? 
                html.folder_icon 
                : child.ext =="md"?
                    html.note_icon
                    : html.unknown_file_icon;
        }
        li.append(child.fileLink());
        if (!child.isFolder && child.ext != "md")
            li.createEl("span", { cls: "FN-ext", text: `.${child.ext}` });
    }
    indexEl.createDiv({ cls: "FN-cover" });
    let indexBottom = indexEl.createDiv({ cls: "FN-bottom" });
    let expandIndex = indexBottom.createEl("span", { cls: "FN-expand FN-icon", attr: { tabindex: 0 } });
    expandIndex.innerHTML = html.expand_icon;
    expandIndex.onclick = (ev: MouseEvent) => {

        indexEl.toggleClass("isExpanded", !indexEl.hasClass("isExpanded"));
    };


    let addNote = indexBottom.createEl("span", { cls: "FN-icon FN-newNote", attr: { tabindex: 0 } });
    addNote.innerHTML = html.newNote_icon;
    addNote.ondblclick = (ev: MouseEvent) => {

        (app as any).commands.executeCommandById("file-explorer:new-file");
    };

}
/**Adds a title to the index */

export function addIndexTitle(summEl: HTMLElement, indexData: IndexData) {
	let title = indexData.config?.indexPath ?? indexData?.name;
	summEl.append(` ${title} `);
	let link = summEl.createEl("a", {
		cls: "FN-link internal-link FN-gotoIndex", href: indexData.filePath, title: indexData.name, attr: { target: "_blank", rel: "noopener", "data-href": indexData.filePath, }
	});
	link.innerHTML = html.gotoIndex_icon;
	link.onclick = (e) => {
		e.preventDefault();
		let mode = (app.vault as any).getConfig("defaultViewMode");
		app.workspace.activeLeaf?.openFile(indexData.file,
			{ active: true, mode } as OpenViewState);
	};

}

