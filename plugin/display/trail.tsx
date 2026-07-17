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

	let { isIndex, config:{ ignore, color: fnColor, listContent, nav, listBlocks }={}} = note;

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
	//Root
	let pathList = index?.getSplitPath() ?? [];
	let root = pathList.shift();
	// Trail
	let trailDiv: HTMLElement, el: HTMLElement; 
	fnDiv.append(<div tabindex="0" cls='FN-trail-scroller'>
		{trailDiv = <span cls='FN-trail'>
			{el=root?.fileLink()}
		</span>}
	</div>);

	let elements = [el].concat(pathList.flatMap(step=>[<span cls="FN-trail-arrow"> → </span>,step?.fileLink()]))
	
	elements.last().addClass("FN-current");
	trailDiv.append(...elements)

	if (nav){
		addNavArrows(note,fnDiv);
	}

	//Index
	let cnEl =el;
	if (isIndex) {
		addIndex(fnDiv, index);
	}
	else {
		trailDiv.append(<span cls="FN-trail-arrow FN-end-arrow" {...(fnColor && {"--text-normal":fnColor})} ondblclick={currentNoteMenu} oncontextmenu={currentNoteMenu} > ↓ </span>);
	}
	//Observer
	plugin.trailResizeObs.observe(fnDiv);
}



/**Resizing observer to deal with trail overflowing */
export function trailOverflow(elements, observer) {
	const cls = "FN-ellipsis";
	// TODO: Improve and optimize overflow
	for (let { target } of elements) {
		let trail:HTMLElement = target.querySelector(".FN-trail");
		let hasOverflow = DOMu.isOverflowing(trail);
		let steps= ()=>trail.querySelectorAll(".FN-link");
		if (hasOverflow) {
			for (let step of steps()) {
				
				step.addClass(cls);
				if (!DOMu.isOverflowing(trail))
					break;
			}
		}
		else if (DOMu.canGrow(trail, null, 10, "x")) {
			for (let step of [...steps()].reverse()) {
				if (!step.hasClass(cls))
					continue;
				step.removeClass(cls);
				if (DOMu.isOverflowing(trail)) {
					step.addClass(cls);
					break;
				}
			}
		}

	}

}
