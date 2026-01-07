import * as DOMu from '.sharedModules/DOM Utils';
import { MarkdownView, MarkdownViewModeType } from 'obsidian';
import { createFNDiv, createContentDiv as getContentDiv, addIndex } from '.';
import { getContextOf } from '../blocks/BlockUtils';
import { contentBlock } from '../blocks/Blocks';
import { currentNoteMenu } from '../contextMenu';
import FI_Plugin from '../main';

import { IndexData } from '../indexing';




/**Adds the nav arrows to the dom */
export function addNavArrows(note:IndexData,fnDiv:HTMLDivElement){
    // TODO: Improve nav arrows
    // TODO: Handle index
    const nav = fnDiv.createEl('span', { cls: "FN-nav" });
    const hasprev= getNavPrev(note);
    const hasnext = getNavNext(note);
    const prevButton = nav.createEl('button', { cls: "FN-nav-button"+ (hasprev?"":" disabled"), text:"<"})
    const nextButton = nav.createEl('button', {  cls: "FN-nav-button"+ (hasnext?"":" disabled"),text:">"})
    nextButton.onclick = ()=> navigateNext(note);
    prevButton.onclick = ()=> navigatePrev(note);
}

/**Navigates to the next note */
export function navigateNext(note:IndexData){
    const nextNote = getNavNext(note);
    if(nextNote == null)
        return;
    nextNote.OpenNote();
}

/**Gets the next note in navigation*/
export function getNavNext(note:IndexData){
    if(!note?.parent)
        return null;
    let list = [...note.parent.childNotes()].filter(n => n.config.nav)
    let index =  list.indexOf(note);
    index++;
    return list[index]
}


/**Navigates to the prev note */
export function navigatePrev(note:IndexData){
    let prevNote = getNavPrev(note);
    if(prevNote == null)
        return;
    prevNote.OpenNote();
}

/**Gets the prev note in navigation*/
export function getNavPrev(note:IndexData){
    if(!note?.parent)
        return null;
    let list = [...note.parent.childNotes()].filter(n => n.config.nav)
    let index =  list.indexOf(note);
    index--;
    return list[index]
    
}

/**Gets the note index in navigation */
export function getNavIndex(note:IndexData):number{
    if(!note?.parent)
        return null;
    let list = [...note.parent.childNotes()].filter(n => n.config.nav)
    return list.indexOf(note);
}