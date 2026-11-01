import {TAbstractFile,MetadataCache} from 'obsidian';
import FI_Plugin from "./main"
import {NoteConfig} from "./config"

/** Marks indexed files as being linked by their indexes. Helps to view vault stucture properly*/
export function setLinkToIndex(file:TAbstractFile, plugin:FI_Plugin){
    // TODO: Implement marking indexed files as being linked for graph reasons
    var resolved = app.metadataCache.resolvedLinks[file.path];
    if(!resolved)
        return;

    var name = file.parent.path.match(/[^\/]*(?=\/?$)/);
   

    var indexPath:string;
    if( file.parent.name == ""){
        indexPath = plugin?.RootIndexList?.first() // TODO: Mejorar (Mejorar qué?)
    }
    else{
        indexPath = `${file.parent.path}/${name?.[0]}.md`;
    }

    if(indexPath == file.path)
        return; //Avoid loops with itself
    resolved[indexPath] ??=1;
        
    
}