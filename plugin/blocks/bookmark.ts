import { HeadingCache, BlockCache, Plugin } from "obsidian"

/** Defines the bookmark pattern */
export const bmPattern = "-"

/** Defines what the bookmark pattern looks like as a heading */
export const bmHeadingPattern = "^" + bmPattern

/**Converts the blocks and makes them be treated as headings */
export function insertBlockAsHeading(headings: HeadingCache[], blocks: BlockCache[]) {
	let ret = [...headings];
	let iHead = 0, iBlock = 0;
	while (iHead < ret.length && iBlock < blocks.length) {
		//Find position to insert
		if (ret[iHead].position.start.offset > blocks[iBlock].position.start.offset) {
			//Create fake heading
			let headedBlock = blockAsHeading(blocks[iBlock]);
			ret.splice(iHead, 0, headedBlock);
			iBlock++;
		}
		iHead++;
	}
	// Add missing
	ret.push(...blocks.slice(iBlock).map(blockAsHeading));
	return ret;
}

/** Converts a block into a heading */
export function blockAsHeading(block: BlockCache, level: number = null): HeadingCache {
	return {
		heading: '^' + block.id,
		level: level ?? 7, //Treat as super deep block
		position: block.position
	};
}

/** Jumps to the active note's bookmark on startup */
export function bmStartupEvent(plugin:Plugin){
    try{
        (plugin.app as any).commands.executeCommandById('FolderNote-index:goto-bookmark')
    }catch(err){
        console.error(err)
    }
}
