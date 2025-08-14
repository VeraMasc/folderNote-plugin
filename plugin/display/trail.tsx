import * as DOMu from '.sharedModules/DOM Utils';
import { MarkdownView, MarkdownViewModeType } from 'obsidian';
import { createFNDiv, createContentDiv, addIndex } from '.';
import { getContextOf } from '../blocks/BlockUtils';
import { contentBlock } from '../blocks/Blocks';
import { currentNoteMenu } from '../contextMenu';
import FI_Plugin from '../main';
import { iterateCenter, iterateOuter } from './display';

//TODO: Mejorar y documentar proceso de renderizado
/**Renders the path trail and and additional elements
 * @param activeMDView what view we need to draw the trail on
 * @param mode mode of the view
 * @param plugin reference to the plugin
*/


export function Trail(activeMDView: MarkdownView, mode: MarkdownViewModeType, plugin: FI_Plugin) {
	if (!activeMDView)
		return;
	const { file } = activeMDView;


	let note = plugin.tree.getNode(file);

	let { isIndex } = note;
	let { ignore, color: fnColor, listContent } = note.config;
	const { basename, parent } = file;

	/*	Is Index?	*/
	if (ignore) {
		return;
	}


	let index = isIndex ? note : note?.parent;

	//Display
	let fnDiv = createFNDiv(activeMDView, mode, note);
	let contDiv = createContentDiv(activeMDView, mode, note);

	if (listContent && contDiv) { // * List content

		let ctx = getContextOf(note.file);
		
		contentBlock.regenerateBlock({customLinkEv:true}, contDiv, ctx, plugin);

        

	}
	// Trail
	let trailScroll = fnDiv.createEl('div', { cls: "FN-trail-scroller", attr: { tabindex: 0 } });
	let trailDiv = trailScroll.createEl('span', { cls: "FN-trail" });


	let pathList = index?.getSplitPath() ?? [];
	//Root
	let root = pathList.shift();
	let el = root?.fileLink();
	trailDiv.appendChild(el);

	for (let step of pathList) {
		trailDiv.createEl("span", { cls: "FN-trail-arrow", text: " → " });
		el = step?.fileLink();
		trailDiv.appendChild(el);
	}
	el.addClass("FN-current");



	if (isIndex) {
		addIndex(fnDiv, index);
		el.oncontextmenu = currentNoteMenu; //Set context menu
	}

	else {
		let arrow = trailDiv.createEl("span", { cls: "FN-trail-arrow FN-end-arrow", text: " ↓ " });
		arrow.oncontextmenu = currentNoteMenu;
		if (fnColor)
			arrow.style.setProperty("--text-normal", fnColor);
	}

	//Observer
	plugin.trailResizeObs.observe(fnDiv);
}
let trailSize = null;
/**Resizing observer to deal with trail overflowing */

export function trailOverflow(elements, observer) {

	for (let { target } of elements) {
		let trail = target.querySelector(".FN-trail");
		let hasOverflow = DOMu.isOverflowing(trail);

		if (hasOverflow) {
			let steps: HTMLElement[] = [...trail.querySelectorAll(".FN-link")];

			for (let step of iterateCenter(steps)) {

				step.addClass("FN-ellipsis");
				if (!DOMu.isOverflowing(trail))
					break;
			}
		}
		else if (DOMu.canGrow(trail, null, 10, "x")) {
			let steps: HTMLElement[] = [...trail.querySelectorAll(".FN-link")];
			for (let step of iterateOuter(steps)) {
				if (!step.hasClass("FN-ellipsis"))
					continue;
				step.removeClass("FN-ellipsis");
				if (DOMu.isOverflowing(trail)) {
					step.addClass("FN-ellipsis");
					break;
				}
			}
		}

	}

}
