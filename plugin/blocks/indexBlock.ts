import {dotCommaObj as getConfig} from "../../../.sharedModules/Data Parsing"

import { MarkdownPostProcessorContext, Plugin, MetadataCache } from "obsidian";
import * as Display from '../display/display';
import * as createFNDiv from '../display';
import FI_Plugin from "../main";
import { IndexData } from '../indexing/indexData';
import { PPContext } from '../../../.sharedModules/obsidianUtils';

/**Block identifier */
export const Id = "index";


/** Generates the block from the source data */
export async function generateBlock(source:string, el, ctx:PPContext, plugin:FI_Plugin){
	try{
		//Get Config
		let config = {"FN-forceOpen": true, showTitle:true, ...getConfig(source)};
		let path: string = null;
		if (config.indexPath) {
			let meta = plugin.app.metadataCache.getFirstLinkpathDest(config.indexPath, ctx.sourcePath);
			if (meta == null && config.indexPath.contains("/")) { //Corregir si pone solo la carpeta
				var filePath = config.indexPath.replace(/(?<=\/|^)([^/\s]+)\/?$/gm, "$1/$1")
				meta = plugin.app.metadataCache.getFirstLinkpathDest(filePath, ctx.sourcePath);
			}
				
			path = meta?.path
			
		}
		else {
			path = ctx.sourcePath
		}
		
		
		
		
		let data = plugin.tree.getNodeAt(path)
		if (data == null)
			throw new Error(`No node in path "${path}"`)
		//Fill according to config
		fillBlock(el,config,ctx,data.clone());
	}catch(err){
		console.error(err);
		el.innerText=err+"";
	} 
}

/**Fills block according to the configuration */
function fillBlock(el:HTMLElement,config:any={},ctx:MarkdownPostProcessorContext,data:IndexData){
	let fnDiv=el.createDiv({
        cls: `FN-div-block`,
        
	});

	if (data && data.isIndex) {
		Object.assign(data.config, config);
		createFNDiv.addIndex(fnDiv, data);
	}else{
		fnDiv.createEl("span",{text:"No Index Data"})
	}
}
