import {TAbstractFile,MetadataCache, TFile, CachedMetadata, TFolder} from './imports/obsidian';
import FI_Plugin from "./main"
import {NoteConfig} from "./config"

var folderIndexes_ = new Map<TFolder, TFile>();

/** Dictionary for delayed initialization */
var delayed_ = new Map<TAbstractFile, TFile>() // TODO: Clean up after using


export function cleanup_(){
    // console.log(delayed)
    // console.log(folderIndexes)
    folderIndexes_.clear()
    delayed_.clear()
}

/** Marks indexed files as being linked by their indexes. Helps to view vault stucture properly*/
export async function setLinkToIndex_(file:TFile, plugin:FI_Plugin){
    const {metadataCache} = app;
    if(!isIndex(file, plugin)){
        let index = delayed_.get(file)
        if(index){ // Delayed linking
            delayed_.delete(file);
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
            let subindex = folderIndexes_.get(<TFolder>child);
            if(subindex){
                folderIndexes_.delete(<TFolder>child)
                connectWithIndex_(metadataCache, <TFile>subindex, file);
            }else{
                delayed_.set(child, file)
            }
            continue;
        }
        connectWithIndex_(metadataCache, <TFile>child, file);
        
    }
    
    //Link to parent index
    let {parent} = file;
    if(parent){
        // console.log(file.path)
        let superIndex = delayed_.get(parent) // This should never fail because of resolution order
        if(!superIndex){
            folderIndexes_.set(parent, file)
            return;
        }
        delayed_.delete(parent);
        await connectWithIndex_(metadataCache, file, superIndex)
    }
    
    
    
}

async function connectWithIndex_(metadataCache: MetadataCache, child: TFile, index: TFile) {
    let resolved = metadataCache.resolvedLinks[child.path];
    if(!resolved){
        delayed_.set(child,index);
        return;
    }

    resolved[index.path] ??= 1;
    metadataCache.resolvedLinks[child.path] = resolved
    
    let cache = metadataCache.getFileCache(child); // HACK: Repeated calling of GetFileCache
    if(!cache){
        console.error(`File ${child.path} has no cache`);
        return;
    }

    if(child.stat.size < 50 && !(cache.frontmatter?.['id'] || cache.frontmatter?.['aliases'])){ // TODO: Decide a better criteria for this
        // console.warn(`Can't generate unique hash for ${child.path}`)
        // TODO: Better way to display that a hash can't be generated
        return;
    }



    cache.frontmatterLinks ??= [];
    

    // if(cache.frontmatterLinks.filter(e => e.key.startsWith("index")).length>0){ // BUG: Repeated frontmatter links
    //     console.error(child.path, index.path, cache.frontmatterLinks.sort(e => e['time']))

    // }

    let entry = { key: 'index', link: index.path, original: `[[${index.path}|${index.basename}]]`, displayText: index.basename };
    cache.frontmatterLinks.push(entry);

    
}

/** Finds if it is the index*/
function isIndex(file: TFile, plugin: FI_Plugin): boolean {
    let parent = file.parent;
    if(parent?.isRoot() == false){
        if(file.basename == parent.name){
            return true;
        }
    }else{
        let path = file.path.replace(/\.md$/,'')
        if (plugin.RootIndexList?.contains(path))
            return true;
    }
    // Check for metadata
    let {frontmatter} = plugin.app.metadataCache.getCache(file.path); // TODO: Optimize fetching metadata ??
    if(frontmatter){
        return frontmatter['fn-useAsIndex']
    }
    return false;
    

    
}
