import {OpenViewState, App, Editor,TAbstractFile, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Command, TFolder, TFile} from 'obsidian';
import FolderIndexPlugin from "./main"
import {noteConfig} from "./config"
import {lighten,getLuminance} from "color2k"
import { linkMenu } from './contextMenu';

export class indexData{
    folder:TFolder;
    file:TFile;
    get isRoot(){ return this.folder?.isRoot()}
    isFolder:boolean;
    exists:boolean;
	hidden?:boolean;
    indexer:IndexTree;
	/** File extension (without leading ".") */
    ext?:string;
    type;
    config=new noteConfig();
    id:string=null;
    prev:indexData;
    next:indexData;
    get name(){
        if(!this.exists)
            return null;
        let name = this.file?.basename;
        name ??= this.folder?.name;
        name ??= "Unknown";
        return name
    }
	get fullName(){
        return this.name + (this.ext?`.${this.ext}`:'')
    }
    get folderPath(){
        return this.folder?.path?.slice(1);
    }
    get filePath(){
        if(! (this.folder && this.file) )
            return null;
		let path = this.folderPath;
		if(path) path+="/"
        return path + this.file.basename;
    }
	/** Checks if the current file is an index file */
    get isIndex(){
		if(this.isFolder || !!this.config.useAsIndex)
			return true;

        let {file,folder,isRoot,exists}=this;
        let ret = false;

        if(!exists || file.extension != "md") 
            return false;

        if(isRoot){
            return this.indexer.plugin?.RootIndexList
                        ?.contains(file.basename)
        }
		else{
			return (folder.name == file.basename);
		}
    }

	

    constructor(abstract:TFolder | TFile | TAbstractFile,indexer:IndexTree){
        this.id = abstract.path;
        this.isFolder = abstract instanceof TFolder;
        if(!(this.exists= (abstract != null))) // No File case
            return;
        

        this.indexer=indexer;
        
        if(this.isFolder){
            // Folder
            this.folder = abstract as TFolder;
            this.file = this.findIndex();

        }else{
            // File
            this.folder = abstract.parent;
            this.file = abstract as TFile;
            this.ext =  this.file?.extension??null;
        }

        
        this.updateConfig()


        
        
        
    }
    
    findIndex(){
        let {folder,isRoot,isFolder,exists} = this;
        if(!(isFolder && exists)) 
            return null;

        let indexes;

        if(isRoot){
            indexes = folder?.children?.filter(c=>{
                    if(!(c instanceof TFile))
                        return false
                    let f = c as TFile;

                    return this.indexer.plugin?.RootIndexList
                        ?.contains(f.basename)
                })?? []
        }else{
            indexes = folder?.children?.filter(c=>{
                    if(!(c instanceof TFile))
                        return false
                    let f = c as TFile;
                    return f.basename == folder.name
                })?? []
        }
        return indexes?.first() as TFile;
    }
    get parent(){
		let abstract = this.isFolder? this?.folder?.parent : this?.folder;
        if (!abstract)
            return null;
        return this.explore(abstract)
    }
    getSplitPath(){
        let ret = [];ret.unshift(this)
        let current = this?.folder?.parent;
        while(current != null){
            ret.unshift(this.explore(current));
            current= current.parent;
        }
        return ret;
    }
    /** Generates an obsidian link to the file or folder index */
    fileLink(){
        let stepNote = this?.file;
  
        let link = this.filePath;
        let text = this.name;
        let extraText = null;
        if(text.length>17){
            extraText=text?.slice(15);
            text = text?.slice(0,15);
        }
        let linkEl:HTMLElement;
        if(stepNote){
            linkEl = createEl("a",{cls:"internal-link FN-link",
                href:link , title:this.name,text, 
				attr:{
					target:"_blank", rel:"noopener","data-href":link,
				}})
			if(this.config.color){
				try{
				linkEl.style.setProperty("--link-color", this.config.color)
				let lum= 1-getLuminance(this.config.color)
				linkEl.style.setProperty("--link-color-hover", lighten(this.config.color, 0.15*lum))
				}catch(err){
					console.error(err);
				}
			}
        
            linkEl.onclick=(e)=>{
                e.preventDefault()
                let mode =(app.vault as any).getConfig("defaultViewMode");
                app.workspace.activeLeaf?.openFile(stepNote,
                    {active:true, mode} as OpenViewState)
            }
			linkEl.oncontextmenu=linkMenu;
        }else{ 
            linkEl = createEl("a",{cls:"internal-link FN-link",
             attr:{target:"_blank", rel:"noopener",text}, 
            text})
            linkEl.ondblclick=(e)=>{
                e.preventDefault()
                let mode =(app.vault as any).getConfig("defaultViewMode");
                app.workspace.openLinkText(this.folder.path+"/"+this.folder.name,".",false,mode)
            }

        }
        if(extraText)
            linkEl.createEl("span",{cls:"ellipsed", attr:{"data-text":extraText}})
        return linkEl;
    }


    
    *childNotes(config:noteConfig=null){
        let mapped = this.folder.children
			.map(child => this.explore(child))
			.sort((a,b)=> (b?.config?.priority ?? 0) - (a?.config?.priority ?? 0))
        
		
		let rawHideReg = config?.hideRegExp ?? [];
		rawHideReg = [rawHideReg].flat()
		let hideRegExp = rawHideReg?.map(exp => new RegExp(exp))

        for(let cData of mapped){
			let ignore= cData?.config?.ignore;
			ignore ||= hideRegExp?.find(reg => reg.test(cData.fullName)) !=null;
            if(!ignore)
                yield cData;
            

        }
    }

    updateConfig(){
        let {file,exists} = this;
        if(!(file && exists)){
            this.config = new noteConfig();
            return;
        }

        const { frontmatter={} } = (app.metadataCache.getFileCache(file)??{});

        this.config.fromMeta(frontmatter)
    }

    explore(abstract:TFolder | TFile | TAbstractFile){
        return this.indexer.getNode(abstract);
    }
}

type fileTree= {
    [name:string]:indexData;
}

export class IndexTree{
    data:fileTree={};
    plugin:FolderIndexPlugin;

    constructor(plugin:FolderIndexPlugin){
        this.plugin = plugin;
    }

    getNode(abstract:TFolder| TFile | TAbstractFile){
		if(abstract==null)
			return null;

        let visited=this.data[abstract.path];
        if(!visited){
            
            visited = (this.data[abstract.path] = new indexData(abstract,this));
            // console.warn(`Visiting node "${visited.name}"`)
            
        }
        return visited;
    }
	/** Same as  {@link getNode} but for paths
	 * @param path Path of the node to retrieve
	*/
	getNodeAt(path:string){
		let abstract = app.vault.getAbstractFileByPath(path)
		return this.getNode(abstract);
	}

    refreshNode(abstract:TFolder| TFile | TAbstractFile){
        let data = new indexData(abstract,this);
        let old = this.data[abstract.path];
        this.data[abstract.path] = data;

        if(!data.isFolder){
            let anyIndex = data.isIndex || old?.isIndex;
            if (anyIndex)
                this.refreshNode(data.folder)
        }
    }

    deleteNode(abstract:TFolder| TFile | TAbstractFile){
        let old = this.data[abstract.path];
        delete this.data[abstract.path];

        if(old && !old.isFolder && old.isIndex){
                this.deleteNode(old.folder)
        }
    }
}

