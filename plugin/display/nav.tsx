

import { IndexData } from '../indexing/indexData'
import {FolderData} from '../indexing/folderData'
import * as JSX from '.sharedModules/JSX obj';



/**Adds the nav arrows to the dom */
export function addNavArrows(note: IndexData, fnDiv: HTMLDivElement) {
    // TODO: Improve nav arrows
    // TODO: How should the index behave?
    

      // TODO: Nav implement go to last
    const hasprev = getNavPrev_(note);
    const hasnext = getNavNext_(note);
    const baseCls= "FN-nav-button"
    fnDiv.append(<span cls="FN-nav">
        <button cls={baseCls+(hasprev ? "" : " disabled")} onclick={() => navigatePrev_(note)}>{"<"}</button>
        <button cls={baseCls+(hasnext ? "" : " disabled")} onclick={() => navigateNext_(note)}>{">"}</button>
    </span>)
    
}

/**Navigates to the next note */
export function navigateNext_(note: IndexData|null) {
    const nextNote = getNavNext_(note);
    if (nextNote == null)
        return;
    nextNote.openNote();
}

/**Gets the next note in navigation*/
export function getNavNext_(note: IndexData|null) {
    if (!note?.parentFolder)
        return null;
    let list = getNavOrderRoot_(note);
    let index = list.indexOf(note);
    index++;
    return list[index]
}

/**Gets the order of the navigable nodes in the environment of the note */
function getNavOrderRoot_(note: IndexData):IndexData[] {
    const index = note?.index;
    if(index == null)
        return [];
    //Is in flat subdirectory
    if(index?.config?.flatNav){
        const val = getNavOrderRoot_(index.parentFolder.parentFolder)
        return val
    }
    
    let list = [...index.parentFolder.childNotes()]
        .filter(n => n.config.nav && (!n.isIndex || n===index || n.config.flatNav));
    // HACK: make better comparison
    
    list.sort((a, b) => (+(b === index) - +(a === index)));
    //Has flat subdirectories
    list = list.flatMap(n => (n.isFolder && n.config.flatNav)?(getNavOrderSub_(n)):n)
    return list;
}

/**Gets the order of the navigable nodes in the specific subdirectory*/
function getNavOrderSub_(note: IndexData):IndexData[] {
    
    const index = note.index;
    let list = [...index.parentFolder.childNotes()]
        .filter(n => n.config.nav && (!n.isIndex || n===index || n.config.flatNav));
    // HACK: make better comparison
    
    list.sort((a, b) => (+(b === index) - +(a === index)));
    return list;
}


/**Navigates to the prev note */
export function navigatePrev_(note: IndexData) {
    let prevNote = getNavPrev_(note);
    if (prevNote == null)
        return;
    prevNote.openNote();
}

/**Gets the prev note in navigation*/
export function getNavPrev_(note: IndexData) {
    if (!note?.parentFolder)
        return null;
    let list = getNavOrderRoot_(note);
    let index = list.indexOf(note);
    index--;
    return list[index]

}

/**Gets the note index in navigation */
export function getNavIndex_(note: IndexData): number {
    if (!note?.parentFolder)
        return null;
    let list = [...note.parentFolder.childNotes()].filter(n => n.config.nav)
    return list.indexOf(note);
}