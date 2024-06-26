import {TAbstractFile,MetadataCache} from 'obsidian';
import FolderIndexPlugin from "./main"
import {noteConfig} from "./config"

/** Marca el índice como uno de los archivos a los que conecta este archivo */
export function setLinkToIndex(file:TAbstractFile, plugin:FolderIndexPlugin){
    //console.log(file.path)
    var resolved = app.metadataCache.resolvedLinks[file.path];
    if(!resolved)
        return;

    

    
    var name = file.parent.path.match(/[^\/]*(?=\/?$)/);
   

    var indexPath:string;
    if( file.parent.name == ""){
        indexPath = plugin?.RootIndexList.first() //TODO: Mejorar
    }
    else{
        indexPath = `${file.parent.path}/${name?.[0]}.md`;
    }

    if(indexPath == file.path)
        return; //Avoid loops with itself
    resolved[indexPath] ??=1;
        
    
    // file.parent
    
}