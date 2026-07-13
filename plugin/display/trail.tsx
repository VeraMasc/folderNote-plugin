import * as DOMu from '.sharedModules/DOM Utils';
import { MarkdownView, MarkdownViewModeType } from 'obsidian';
import { createFNDiv, createContentDiv as getContentDiv, addIndex } from '.';
import { getContextOf } from '../blocks/BlockUtils';
import { contentBlock } from '../blocks/Blocks';
import { currentNoteMenu } from '../contextMenu';
import FI_Plugin from '../main';
import { addNavArrows } from './nav';
import { clearBlock } from '../blocks/contentBlock';
import * as JSX from '.sharedModules/JSX obj';

// TODO: Mejorar y documentar proceso de renderizado
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
	let { ignore, color: fnColor, listContent, nav, listBlocks } = note.config;
	const { basename, parent } = file;

	/*	Is Index?	*/
	if (ignore) {
		return;
	}

	

	let index = isIndex ? note : note?.parentFolder;

	//Display
	let fnDiv = createFNDiv(activeMDView, mode, note);
	let contDiv = getContentDiv(activeMDView, mode, note);

	if (listContent && contDiv) { // * List content
		let ctx = getContextOf(note.file);
		
		contentBlock.regenerateBlock({customLinkEv:true, listBlocks, maxDepth:null}, contDiv, ctx, plugin);

	}else{
		clearBlock(contDiv);
	}
	// Trail
	let trailDiv; 
	fnDiv.append(<div tabindex="0" className='FN-trail-scroller'>
		{trailDiv = <span className='FN-trail'></span>}
	</div>);


	let pathList = index?.getSplitPath() ?? [];
	//Root
	let root = pathList.shift();
	let el = root?.fileLink();
	trailDiv.appendChild(el);

	for (let step of pathList) {
		let span = <span className="FN-trail-arrow"> → </span>
		el = step?.fileLink();
		trailDiv.append(span, el);
	}
	el.addClass("FN-current");

	if (nav){
		addNavArrows(note,fnDiv);
	}

	//Index
	let cnEl =el;
	if (isIndex) {
		addIndex(fnDiv, index);
	}
	else {
		let arrow = <span className="FN-trail-arrow FN-end-arrow" {...(fnColor && {"--text-normal":fnColor})}> ↓ </span>
		trailDiv.append(cnEl=arrow);
	}
	
	cnEl.ondblclick = cnEl.oncontextmenu = currentNoteMenu; //Set context menu
	//Observer
	plugin.trailResizeObs.observe(fnDiv);
}
let trailSize = null;


/**Resizing observer to deal with trail overflowing */
export function trailOverflow(elements, observer) {
	// TODO: Improve and optimize overflow
	for (let { target } of elements) {
		let trail = target.querySelector(".FN-trail");
		let hasOverflow = DOMu.isOverflowing(trail);

		if (hasOverflow) {
			let steps: HTMLElement[] = [...trail.querySelectorAll(".FN-link")];
			
			for (let step of steps) {
				
				step.addClass("FN-ellipsis");
				if (!DOMu.isOverflowing(trail))
					break;
			}
		}
		else if (DOMu.canGrow(trail, null, 10, "x")) {
			let steps: HTMLElement[] = [...trail.querySelectorAll(".FN-link")];

			for (let step of steps.reverse()) {
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
