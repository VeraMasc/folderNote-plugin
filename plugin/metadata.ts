import {TAbstractFile,MetadataCache, TFile} from 'obsidian';
import FI_Plugin from "./main"
import {NoteConfig} from "./config"

/** Marks indexed files as being linked by their indexes. Helps to view vault stucture properly*/
export function setLinkToIndex(file:TFile, plugin:FI_Plugin){
    var cache = app.metadataCache.getFileCache(file);
    if(!cache)
        return;

    var { indexPath, indexName, name } = findIndexOf(file.parent.path, plugin);

    if(indexPath == file.path){ //Is itself index
        ({ indexPath, indexName, name } = findIndexOf(file.parent.parent.path, plugin)) //Go to parent folder
    }

    // TODO: Fix linking not affecting graph view
    let resolved = app.metadataCache.resolvedLinks[file.path]
    resolved[indexPath] ??=1;
    cache.frontmatterLinks ??=[];
    cache.frontmatterLinks.push({key:'index', link:indexName, original:"[["+indexPath+"]]", displayText: name?.[0]})
        
    
}

/** Finds wich is the index of a file */
function findIndexOf(path: string, plugin: FI_Plugin): { indexPath: string; indexName: string; name: RegExpMatchArray; } {
    var name = path.match(/[^\/]*(?=\/?$)/);

    var indexPath: string;
    var indexName: string;
    if (path == "") { //Is root
        indexName = indexPath = plugin?.RootIndexList?.first();
    }
    else {
        // TODO: Implement forced types of linking in metadata
        indexPath = `${path}/${name?.[0]}.md`;
        indexName = name?.[0];
    }
    return { indexPath, indexName, name };
}
