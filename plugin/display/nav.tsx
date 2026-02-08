import * as DOMu from '.sharedModules/DOM Utils';
import { MarkdownView, MarkdownViewModeType } from 'obsidian';
import { createFNDiv, createContentDiv as getContentDiv, addIndex } from '.';
import { getContextOf } from '../blocks/BlockUtils';
import { contentBlock } from '../blocks/Blocks';
import { currentNoteMenu } from '../contextMenu';
import FI_Plugin from '../main';

import { IndexData } from '../indexing';

// TODO: Add commands for navigation


/**Adds the nav arrows to the dom */
export function addNavArrows(note: IndexData, fnDiv: HTMLDivElement) {
    // TODO: Improve nav arrows
    // TODO: How should the index behave?
    const nav = fnDiv.createEl('span', { cls: "FN-nav" });
    const hasprev = getNavPrev(note);
    const hasnext = getNavNext(note);
    const prevButton = nav.createEl('button', { cls: "FN-nav-button" + (hasprev ? "" : " disabled"), text: "<" })
    const nextButton = nav.createEl('button', { cls: "FN-nav-button" + (hasnext ? "" : " disabled"), text: ">" })
    nextButton.onclick = () => navigateNext(note);
    prevButton.onclick = () => navigatePrev(note);
}

/**Navigates to the next note */
export function navigateNext(note: IndexData) {
    const nextNote = getNavNext(note);
    if (nextNote == null)
        return;
    nextNote.OpenNote();
}

/**Gets the next note in navigation*/
export function getNavNext(note: IndexData) {
    if (!note?.parentFolder)
        return null;
    let list = getNavOrderRoot(note);
    let index = list.indexOf(note);
    index++;
    return list[index]
}

/**Gets the order of the navigable nodes in the environment of the note */
function getNavOrderRoot(note: IndexData) {
    //Is in flat subdirectory
    if(note.parentFolder.config.flatNav)
        return getNavOrderRoot(note.parentFolder.parentFolder)
    const index = note.parentFolder.index;
    let list = [...note.parentFolder.childNotes()]
        .filter(n => n.config.nav && (!n.isIndex || n===index || n.config.flatNav));
    // HACK: make better comparison
    
    list.sort((a, b) => (+(b === index) - +(a === index)));
    //Has flat subdirectories
    let flats = list.filter(n => n.config.flatNav)
    console.log(flats);
    
    // TODO: Fix reverse flattened navigation
    console.log(list)
    return list;
}

/**Gets the order of the navigable nodes in the specific subdirectory*/
function getNavOrderSub(note: IndexData) {
    const index = note.parentFolder.index;
    let list = [...note.parentFolder.childNotes()]
        .filter(n => n.config.nav && (!n.isIndex || n===index || n.config.flatNav));
    // HACK: make better comparison
    
    list.sort((a, b) => (+(b === index) - +(a === index)));
    //Has flat subdirectories
    let flats = list.filter(n => n.config.flatNav)
    console.log(flats);
    
    console.log(list)
    return list;
}


/**Navigates to the prev note */
export function navigatePrev(note: IndexData) {
    let prevNote = getNavPrev(note);
    if (prevNote == null)
        return;
    prevNote.OpenNote();
}

/**Gets the prev note in navigation*/
export function getNavPrev(note: IndexData) {
    if (!note?.parentFolder)
        return null;
    let list = getNavOrderRoot(note);
    let index = list.indexOf(note);
    index--;
    return list[index]

}

/**Gets the note index in navigation */
export function getNavIndex(note: IndexData): number {
    if (!note?.parentFolder)
        return null;
    let list = [...note.parentFolder.childNotes()].filter(n => n.config.nav)
    return list.indexOf(note);
}