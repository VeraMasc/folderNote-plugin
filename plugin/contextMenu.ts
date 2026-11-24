import { addIcon, MarkdownView, Menu, OpenViewState, Plugin, TFile, MetadataCache, Events, Notice, TFolder, View } from './imports/obsidian';
import { applyHighlight, DeferredMenu, insertSubmenu, obsidianIcons } from '../../.sharedModules/obsidian/obsidianUtils';
import { BlockName } from './blocks/Blocks';
import FI_Plugin from "./main"
import { xApp } from "./main"
import { getRandomColor_, getAnotherColor_ } from "./colors";


/**Context menu of the index element of the index file*/
export function indexMenu(ev: MouseEvent) {
    ev.preventDefault();
    const menu = new Menu();
    //Label
    menu.addItem(
        (item)=>item.setIsLabel(true).setTitle("Index Menu")
    )
    //Options
    setPropItemValue_(menu, "Keep Open", "expand-vertically", "FN-forceOpen")
    setPropItemValue_(menu, "Expanded by default", "fullscreen", "FN-expand")
    setPropItemValue_(menu, "Hide files", "eye-off" as obsidianIcons, "FN-hideRegExp", '"\\\\..+$(?<!\\\\.md$)"')
    setPropItemValue_(menu, "Make it sticky", "pin", "FN-isSticky")
    noteOptions_(menu, ev)
    menu.showAtMouseEvent(ev);
}

/**Gets the file whose link has generated the context menu */
function getOptionsTargetFile_(ev: MouseEvent): TFile {
    let link = ev.target as HTMLAnchorElement;
    var path = link?.dataset?.href;
    let {app} = this;
    //If target is actual link
    if (path) {
        return app.metadataCache.getFirstLinkpathDest(path, ".");
    }
    else { //Return current file
        return app.workspace.getActiveFile();
    }

}
/**Adds the Context menu options that are universal to all notes
 * @param [moreMenu=null] optional menu for extra options
*/
function globalOptions_(menu: Menu, _ev: MouseEvent, moreMenu:Menu|DeferredMenu=null) {
    moreMenu??=menu;
    actionItem_(moreMenu, 'Rebuild Tree','folder-sync' as obsidianIcons,()=>{FI_Plugin.instance.tree.prune()})
}


/**Adds the Context menu options that are universal to all notes
 * @param [moreMenu=null] optional menu for extra options
*/
function noteOptions_(menu: Menu, ev: MouseEvent, moreMenu:Menu|DeferredMenu=null) {

    let file = getOptionsTargetFile_(ev)
    moreMenu??=menu;
    //Folder note
    actionItem_(moreMenu, "Make Folder Note", "folder-root", () => {
        // TODO: Update folder note creation process
        new Notice("FN-Index: Update folder note creation process")
        let {isIndex} = FI_Plugin.instance.tree.getNode(file);
        //Check if already folder note
        if (isIndex) {
            new Notice(`Note '${file.basename}' is already a folder note of '${file.parent.name}'`, 0)
            return;
        }

        // TODO: move files

    });
    changePropItemFunction_(moreMenu, "Make Navigable", "arrow-right-left" as obsidianIcons, "FN-nav", ({p})=>!p)
    //View file in explorer
    actionItem_(menu, "View in explorer", "eye", () => {
        let explorerTab = app.workspace.getLeavesOfType("file-explorer")?.first(); //Get reveal function
        app.workspace.revealLeaf(explorerTab); //Reveal explorer leaf

        let view = explorerTab.view as View & { fileItems: { selfEl: HTMLElement }, tree: any };//Get view

        //Get element
        let {isIndex, isRoot} = FI_Plugin.instance.tree.getNode(file)??{};

        if (isIndex && isRoot) { //Get file or folder
            var path: string = file.parent?.path;
        }

        path ??= file.path;
        let fileElement = view.fileItems[path];

        //Focus
        view.tree.setFocusedItem(fileElement)
        applyHighlight(fileElement?.selfEl);

    })
    changePropItemFunction_(menu, "Add simple Alias", "import-glyph", 'aliases', ({v}) => {
        let node = FI_Plugin.instance.tree.getNode(v.file);
        if(!node) return []; //Do nothing
        let parent = node.isIndex? node.parent : node.index;
        let alias =`${parent?.name??'Root'} => ${v.file.basename}`;
        return [alias]
    })
    //Add global options to menu
    globalOptions_(menu,ev,moreMenu)
}

/**Adds the Context menu options of all the currently opened files*/
function currentNoteOptions_(menu: Menu, ev: MouseEvent) {
    let file = getOptionsTargetFile_(ev)
    menu.addItem(
        (item)=>item.setIsLabel(true).setTitle(`'${file?.basename}' Note Menu`)
    )
    changePropItemFunction_(menu, "Make it sticky", "pin", "FN-isSticky", ({p})=>!p)//Sticky index
    changePropItemFunction_(menu, "Use custom color", "highlight-glyph", "FN-color", 
        ({p})=> getAnotherColor_(p))//Custom link color
    let moreMenu = new DeferredMenu();
    insertBlockItem_(moreMenu, "Add content block", "clipboard-list", "contentList", "") //Insert header index
    changePropItemFunction_(menu, "List contents", "clipboard-list", "FN-listContent", ({p}) => (!p)) //List contents
    setPropItemValue_(moreMenu, "Use custom Icon", "scan-face", "FN-icon",' ')//Use icon
    noteOptions_(menu, ev,moreMenu) //Generate regular options
    //Resolve moremenu
    moreMenu.resolveWith(insertSubmenu(menu, "More","ellipsis"));
    
}

/**Generates the full context menu of all notes*/
export function noteMenu(ev: MouseEvent) {
    ev.preventDefault();
    const menu = new Menu();
    noteOptions_(menu, ev)
    menu.showAtMouseEvent(ev);
}

/**
 * Generates the full context menu of the current note 
 */
export function currentNoteMenu(ev: MouseEvent) {
    ev.preventDefault();
    const menu = new Menu();
    currentNoteOptions_(menu, ev)
    menu.showAtMouseEvent(ev);
}

/**Generates the Context menu of index links */
export function linkMenu(ev: MouseEvent) {
    let link = ev.target as HTMLAnchorElement;
    ev.preventDefault();
    const menu = new Menu();

    
    menu.addItem(
        (item)=>item.setIsLabel(true).setTitle(`'${link?.text}' Note Menu`)
    )
    actionItem_(menu, "Go to note", "note-glyph", () => link.click())
    actionItem_(menu, "Open in new tab", "open-elsewhere-glyph", () => {
        if (!link?.dataset?.href)
            return;
        let mode = (app.vault as any).getConfig("defaultViewMode");
        app.workspace?.openLinkText(link.dataset.href, ".", true,
            { active: true, mode } as OpenViewState)
    })
    let moreMenu = new DeferredMenu();
    noteOptions_(menu, ev,moreMenu);
    moreMenu.resolveWith(insertSubmenu(menu, "More","ellipsis"));

    menu.showAtMouseEvent(ev);
}

/**Sets contextual option to add a specific prop to the file */
function setPropItemValue_(menu: Menu|DeferredMenu, title: string, icon: obsidianIcons, prop: string, value: any = true) {
    return changePropItemFunction_(menu, title, icon, prop, ()=>value)
}

/**Changes the value of contextual option to add a specific prop to the file (lets you access previous value)*/
function changePropItemFunction_(menu: Menu|DeferredMenu, title: string, icon: obsidianIcons, prop: string, valueFunc: (v:{e?: MouseEvent, v?: MarkdownView, p?:any}) => any){
    menu.addItem((item) =>
        item.setTitle(title)
            .setIcon(icon)
            .onClick((e: MouseEvent) => {
                let view = app.workspace.getActiveViewOfType(MarkdownView)
                let previous = app.metadataCache.getFileCache(view.file)?.frontmatter?.[prop];
                let propDict = {prop:valueFunc({e,v:view, p:previous})};
                view?.["metadataEditor"].insertProperties(propDict)
            })
    );
}

/**Sets contextual option to insert a specific code block to the file  */
function insertBlockItem_(menu: Menu|DeferredMenu, title: string, icon: obsidianIcons, blockType: BlockName, content: string = "") {
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
function actionItem_(menu: Menu|DeferredMenu, title: string, icon: obsidianIcons, onclick: (ev?: MouseEvent) => any) {
    menu.addItem((item) =>
        item.setTitle(title)
            .setIcon(icon)
            .onClick(onclick)
    );
}