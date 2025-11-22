import { addIcon, MarkdownView, Menu, OpenViewState, Plugin, TFile, MetadataCache, Events, Notice, TFolder, View } from "obsidian";

import { fromView as fmFromView, valueRegex } from "../../.sharedModules/FrontMatter";
import { applyHighlight, DeferredMenu, insertSubmenu, obsidianIcons } from '../../.sharedModules/obsidianUtils';
import { BlockName } from './blocks/Blocks';
import FI_Plugin from "./main"
import { xApp } from "./main"
import { getRandomColor } from "./colors";

import { MenuItemAPI } from "../../.sharedModules/obsidianUtils";

/**Context menu of the index element of the index file*/
export function indexMenu(ev: MouseEvent) {
    ev.preventDefault();
    const menu = new Menu();
    setPropItem(menu, "Keep Open", "expand-vertically", "FN-forceOpen")
    setPropItem(menu, "Expanded by default", "fullscreen", "FN-expand")
    setPropItem(menu, "Hide files", "scissors", "FN-hideRegExp", '"\\\\..+$(?<!\\\\.md$)"')
    setPropItem(menu, "Make it sticky", "pin", "FN-isSticky")
    noteOptions(menu, ev)
    menu.showAtMouseEvent(ev);
}

/**Gets the file whose link has generated the context menu */
function getOptionsTargetFile(ev: MouseEvent): TFile {
    let link = ev.target as HTMLAnchorElement;
    var path = link?.dataset?.href;
    //If target is actual link
    if (path) {
        var file = this.app.metadataCache.getFirstLinkpathDest(path, ".");
        return file;
    }
    else { //Return current file
        return this.app.workspace.getActiveFile();
    }

}

/**Generates the Context menu that is universal to all notes
 * @param [moreMenu=null] optional menu for extra options
*/
function noteOptions(menu: Menu, ev: MouseEvent, moreMenu:Menu|DeferredMenu=null) {

    let file = getOptionsTargetFile(ev)
    moreMenu??=menu;
    //Folder note
    actionItem(moreMenu, "Make Folder Note", "folder-root", (e) => {
        new Notice("Update folder note creation process")
        let data = FI_Plugin.instance.tree.getNode(file);
        //Check if already folder note
        if (data.isIndex) {
            new Notice(`Note '${file.basename}' is already a folder note of '${file.parent.name}'`, 0)
            return;
        }

        //TODO: move files

    });
    setPropItem(moreMenu, "Make Navigable", "arrow-right-left" as any, "FN-nav")
    //View file in explorer
    actionItem(menu, "View in explorer", "eye", (e) => {
        let explorerTab = app.workspace.getLeavesOfType("file-explorer")?.first(); //Get reveal function
        app.workspace.revealLeaf(explorerTab); //Reveal explorer leaf

        let view = explorerTab.view as View & { fileItems: { selfEl: HTMLElement }, tree: any };//Get view

        //Get element
        let data = FI_Plugin.instance.tree.getNode(file);

        if (data?.isIndex && !data.isRoot) { //Get file or folder
            var path: string = file.parent?.path;
        }

        path ??= file.path;
        let fileElement = view.fileItems[path];

        //Focus
        view.tree.setFocusedItem(fileElement)
        applyHighlight(fileElement?.selfEl);

    })
}

/**Generates the Context menu of all the currently opened file*/
function currentNoteOptions(menu: Menu, ev: MouseEvent) {

    setPropItem(menu, "Make it sticky", "pin", "FN-isSticky")//Sticky index
    setPropItemFunction(menu, "Use custom color", "highlight-glyph", "FN-color", getRandomColor)//Custom link color
    let moreMenu = new DeferredMenu();
    insertBlockItem(moreMenu, "Add content block", "clipboard-list", "contentIndex", "") //Insert header index
    setPropItemFunction(menu, "List contents", "clipboard-list", "FN-listContent", () => true) //List contents
    noteOptions(menu, ev,moreMenu) //Generate regular options
    //Resolve moremenu
    moreMenu.resolveWith(insertSubmenu(menu, "More","ellipsis"));
    
}

/**Generates the full context menu of all notes*/
export function noteMenu(ev: MouseEvent) {
    ev.preventDefault();
    const menu = new Menu();
    noteOptions(menu, ev)
    menu.showAtMouseEvent(ev);
}

/**
 * Generates the full context menu of the current note 
 */
export function currentNoteMenu(ev: MouseEvent) {
    ev.preventDefault();
    const menu = new Menu();
    currentNoteOptions(menu, ev)
    menu.showAtMouseEvent(ev);
}

/**Generates the Context menu of index links */
export function linkMenu(ev: MouseEvent) {
    let link = ev.target as HTMLAnchorElement;
    ev.preventDefault();
    const menu = new Menu();
    actionItem(menu, "Go to note", "note-glyph", () => link.click())
    actionItem(menu, "Open in new tab", "open-elsewhere-glyph", (e) => {
        if (!link?.dataset?.href)
            return;
        let mode = (app.vault as any).getConfig("defaultViewMode");
        app.workspace?.openLinkText(link.dataset.href, ".", true,
            { active: true, mode } as OpenViewState)
    })
    let moreMenu = new DeferredMenu();
    noteOptions(menu, ev,moreMenu);
    moreMenu.resolveWith(insertSubmenu(menu, "More","ellipsis"));

    menu.showAtMouseEvent(ev);
}

/**Sets contextual option to add a specific prop to the file */
function setPropItem(menu: Menu|DeferredMenu, title: string, icon: obsidianIcons, prop: string, value: any = true) {
    menu.addItem((item) =>
        item.setTitle(title)
            .setIcon(icon)
            .onClick(() => {
                let view = app.workspace.getActiveViewOfType(MarkdownView)
                var propDict = {};
                propDict[prop] = value;
                view?.["metadataEditor"].insertProperties(propDict)
            }
            )
    );
}

/**Same as {@link setPropItem} but sets the value through a function */
function setPropItemFunction(menu: Menu|DeferredMenu, title: string, icon: obsidianIcons, prop: string, valueFunc: (e?: MouseEvent) => any) {
    menu.addItem((item) =>
        item.setTitle(title)
            .setIcon(icon)
            .onClick((e: MouseEvent) => {
                let view = app.workspace.getActiveViewOfType(MarkdownView)
                var propDict = {};
                propDict[prop] = valueFunc(e);
                view?.["metadataEditor"].insertProperties(propDict)
            }
            )
    );
}

/**Sets contextual option to insert a specific code block to the file  */
function insertBlockItem(menu: Menu|DeferredMenu, title: string, icon: obsidianIcons, blockType: BlockName, content: string = "") {
    menu.addItem((item) =>
        item.setTitle(title)
            .setIcon(icon)
            .onClick(() => {
                let view = app.workspace.getActiveViewOfType(MarkdownView)
                view.editor.replaceSelection(`\`\`\`${blockType}\n${content}\n\`\`\``)
            }
            )
    );
}



/**Creates a context menu item that performs an action 
 * @param menu Menu that will hold the item
 * @param title Display text of the item
 * @param icon Display icon of the item
 * @param onclick Action to trigger on clicking the item
*/
function actionItem(menu: Menu|DeferredMenu, title: string, icon: obsidianIcons, onclick: (ev?: MouseEvent) => any) {
    menu.addItem((item) =>
        item.setTitle(title)
            .setIcon(icon)
            .onClick(onclick)
        //TODO: add option for expanding submenus on hover
    );
}