import {TAbstractFile,MetadataCache, TFile, CachedMetadata, TFolder} from 'obsidian';
import FI_Plugin from "./main"
import {NoteConfig} from "./config"
import Mutex from "../../.sharedModules/myMutex"

var folderIndexes = new Map<TFolder, TFile>();

/** Dictionary for delayed initialization */
var delayed = new Map<TAbstractFile, TFile>()

var mutex = new Mutex()

var startTime = Date.now();

/** Marks indexed files as being linked by their indexes. Helps to view vault stucture properly*/
export async function setLinkToIndex(file:TFile, plugin:FI_Plugin){
    const {metadataCache} = app;
    
    if(!isIndex(file, plugin)){
        let index = delayed.get(file)
        if(index){ // Delayed linking
            delayed.delete(file);
            connectWithIndex_(metadataCache, file, index)
        }
        return; // Handle only indexes for efficiency
    }
    let folder = file.parent;

    // Link children to parent
    for(let child of folder.children){
        if(child === file) // Skip index and subfolders
            continue;
        if(!(<TFile>child).basename){ //Register folder for delayed linking
            let subindex = folderIndexes.get(<TFolder>child);
            if(subindex){
                folderIndexes.delete(<TFolder>child)
                // console.warn(`${file.name} => ${(<TFile>subindex).name} (SubIndex)`)
                connectWithIndex_(metadataCache, <TFile>subindex, file);
            }else{
                //console.warn(`${file.basename} => ${child.name}`)
                delayed.set(child, file)
            }
            continue;
        }
        connectWithIndex_(metadataCache, <TFile>child, file);
        
    }
    
    //Link to parent index
    let {parent} = file;
    if(parent){
        global.delayed = delayed;
        global.folderIndexes = folderIndexes;
        // console.log(file.path)
        let superIndex = delayed.get(parent) // This should never fail because of resolution order
        if(!superIndex){
            folderIndexes.set(parent, file)
            return;
        }
        delayed.delete(parent);
        //console.warn(`${superIndex.name} => ${file.name} (Parent Index)`)
        await connectWithIndex_(metadataCache, file, superIndex)
    }
    
    
    
}

async function connectWithIndex_(metadataCache: MetadataCache, child: TFile, index: TFile) {
    let resolved = metadataCache.resolvedLinks[child.path];
    if(!resolved){
        // console.warn(`${index.basename} => ${child.basename}`)
        delayed.set(child,index);
        return;
    }

    resolved[index.path] ??= 1;
    metadataCache.resolvedLinks[child.path] = resolved
    
    let meta = child.stat;
    let cache = metadataCache.getFileCache(child); // HACK: Repeated calling of GetFileCache
    if(!cache){
        console.error(`File ${child.path} has no cache`);
        return;
    }

    if(child.stat.size < 50 && !(cache.frontmatter?.['id'] || cache.frontmatter?.['aliases'])){ // TODO: Decide a better criteria for this
        console.warn(`Can't generate unique hash for ${child.path}`)
        return;
    }



    cache.frontmatterLinks ??= [];
    

    // if(cache.frontmatterLinks.filter(e => e.key.startsWith("index")).length>0){ // BUG: Repeated frontmatter links
    //     console.error(child.path, index.path, cache.frontmatterLinks.sort(e => e['time']))

    // }

    let entry = <any>{ key: 'index', time:Date.now()-startTime, link: index.path, original: "[[" + index.path +'|'+index.basename+ "]]", displayText: index.basename };
    cache.frontmatterLinks.push(entry);

    
}

/** Finds if it is the index*/
function isIndex(file: TFile, plugin: FI_Plugin): boolean {
    let parent = file.parent;
    if(parent){
        if(file.basename == parent.name){
            return true;
        }
    }else{
        if (plugin.RootIndexList?.contains(file.path))
            return true;
    }
    // Check for metadata
    let {frontmatter} = plugin.app.metadataCache.getCache(file.path); // TODO: Optimize fetching metadata ??
    if(frontmatter){
        return frontmatter['fn-useAsIndex']
    }
    return false;
    

    
}
