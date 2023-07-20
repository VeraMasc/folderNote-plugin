import {dotCommaObj as getConfig} from "../../../.sharedModules/Data Parsing"

import { MarkdownPostProcessorContext, Plugin } from "obsidian";

/**Block identifier */
export const Id = "blockName";


/** Generates the block from the source data */
export async function generateBlock(source, el, ctx:MarkdownPostProcessorContext,plugin:Plugin){
	try{
		//Get Config
		let config = getConfig(source);
		//Fill according to config
		fillBlock(el,config,ctx);
	}catch(err){
		console.error(err);
		el.innerText=err+"";
	} 

}

/**Fills block according to the configuration */
function fillBlock(el,config:any={},ctx){
	el.createEl("span",{text:"Placeholder Block",
		attr:{style:"color:darkslateblue;"}})
}
