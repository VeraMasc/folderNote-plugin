import { EventRef, TAbstractFile, TFile, TFolder, WorkspaceLeaf, View} from 'obsidian';


/** Finds the header of the specified view */
export function findHeader(view:View):HTMLElement{
    return view?.containerEl?.querySelector(" div.view-header > .view-header-title-container") as HTMLElement
}

/** Finds or generates the header of the specified view*/
export function getHeaderUI(view:View):HeaderUI{
    let header = findHeader(view);
    if(header == null){
        console.error("View has no header")
        return new HeaderUI(null, view?.leaf);
    }
    let UIelement = header.querySelector(":scope>.FN-note-title-UI");
    UIelement ??= header.createEl('span', {cls:"FN-note-title-UI", text:""});
    let UI = new HeaderUI(UIelement as HeaderUIElement, view.leaf);
    
    // console.log(UI)
    return UI;
}


export type HeaderUIElement = HTMLElement & {controller?:HeaderUI};

/** Controller of the header UI */
export class HeaderUI{
    /** Element which contains the UI */
    container:HeaderUIElement|null
    leaf:WorkspaceLeaf;
    toTopButton:HTMLButtonElement;

    constructor(element:HeaderUIElement|null, leaf:WorkspaceLeaf){
        if(element?.controller){
            return element.controller; // Returns existing controller if possible
        }
        this.container = element
        this.leaf = leaf
        this.reload()
    }

    /** Removes all the elements from the UI, use {@link reload} */
    clear(){
        while (this.container?.firstChild) {
            this.container.removeChild(this.container.lastChild);
        }
    }

    /** Regenerates the UI entirely when needed */
    reload(){
        this.clear();
        if(this.container == null)
            return; // No proper header found
        // TODO: Extract as method
        // Generate go to top button
        this.toTopButton = this.container.createEl('button',);
        this.toTopButton.onfocus = this.toTopButton.onclick=(ev: PointerEvent)=>{

            let state = this.leaf.view.getEphemeralState();
            state.scroll = 0;
            this.leaf.view.setEphemeralState(state);
            
        };
    }
}