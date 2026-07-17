import { getLuminance, lighten } from "color2k";
import { OpenViewState, TAbstractFile, TextFileView, TFile, TFolder } from "obsidian";
import { NoteConfig } from "../config";
import { linkMenu } from "../contextMenu";
import { IndexTree } from "./indexTree";
import * as JSX from ".sharedModules/JSX obj";



/**Indexing data of a specific folder or file*/
export class IndexData {
    /**Folder represented or folder that contains the file*/
    folder: TFolder;
    /**The file itself (index file if it's a folder)*/
    file: TFile;
    /**Detects if folder is a root of the Indexing Tree*/
    get isRoot() { return this.folder?.isRoot() }
    /**Was the indexing data generated from the folder or from an index file? */
    isFolder: boolean;
    /**This data is obsolete and should be updated or removed */
    isOutdated: boolean=false;
    /**Indicates folder or file exist */
    exists: boolean;
    /**Is index hidden */
    hidden?: boolean;
    /**Reference to the full index tree */
    tree: IndexTree;
    /** File extension (without leading ".") */
    ext?: string;
    type;
    /** Configuration of the file*/
    config = new NoteConfig();
    /**Unique Path Id of the node */
    id: string = null;
    prev: IndexData;
    next: IndexData;

    /**Gets partial name of the index (no extension) */
    get name() {
        if (!this.exists)
            return null;
        let name = this.file?.basename;
        name ??= this.folder?.name;
        name ??= "Unknown";
        return name
    }

    /**Gets full name of the file with extension (No path) */
    get fullName() {
        return this.name + (this.ext ? `.${this.ext}` : '')
    }
    /**Gets path of the folder containing the file () */
    get folderPath() {

        return this.folder?.path // ?.slice(1);
    }
    /**Gets path of the the file file itself */
    get filePath() {
        if (!(this.folder && this.file))
            return null;
        let path = this.folderPath;
        if (path.length > 1) path += "/" //Add slash if path not empty or "/"
        return path + this.file.basename;
    }

    clone(): IndexData {
        return Object.assign(Object.create(this), { config: Object.create(this.config) })
    }

    /** Checks if this file is acts as an index file */
    get isIndex() {
        if (this.isFolder || !!this.config.useAsIndex)
            return true;

        let { file, folder, isRoot, exists } = this;
        let ret = false;

        if (!exists || file.extension != "md")
            return false;

        return isRoot ?
            this.tree.plugin?.RootIndexList
                ?.contains(file.basename)
            : folder.name == file.basename
    }



    constructor(abstract: TFolder | TFile | TAbstractFile, indexer: IndexTree) {

        if (!(this.exists = (abstract != null))) // No File case
            return;

        this.id = abstract.path;
        this.isFolder = abstract instanceof TFolder;
        this.tree = indexer;


        //Get file and folder
        this.folder = this.isFolder ? abstract as TFolder : abstract.parent;
        this.file = this.isFolder ? this.findIndex() : abstract as TFile;
        this.ext = this.isFolder ? null : this.file?.extension ?? null;

        this.updateConfig()
    }
    /**Checks that the data is still valid */
    checkIsOutdated() { // TODO: Find way to use it to remove outdated shit
        if (this.isOutdated)
            return;
        let path = this.isFolder ? this.folder?.path : this.file?.path;
        if (path != this.id)
            this.isOutdated = true;

    }
    /**Gets the index of the file if available or calculates it */
    get index(): IndexData {

        if (this.isFolder) { //Is folder
            return this.explore(this.file)
        }else{
            return this.parentFolder?.index;
        }
        
    }



    /**Finds the file that will act as index of the folder */
    private findIndex():TFile {
        let { folder, isRoot, isFolder, exists } = this;
        if (!isFolder || !exists)
            return null;

        //Find candidates
        let files: TFile[] = (folder?.children ?? []).filter<TFile>(c => (c instanceof TFile))
        

        /**Default index function*/
        let findDefault = isRoot ?
            (f: TFile) => this.tree.plugin?.RootIndexList
                ?.contains(f.basename)
            : (f: TFile) => f.basename == folder.name; // TODO: implement non folder name indexes

        //Find default file
        let index = this.explore(files.find(findDefault));

        //Replace missing default index
        if(!index || index.config?.useAsIndex==false){
            let mapped = files.map(f => this.explore(f))
            .filter(n => n.config.useAsIndex)
            index = this.sortNodes(mapped)?.first()
        }
        

        return index?.file as TFile;
    }
    /**Gets the indexData of the current folder */
    get thisFolder(): IndexData {
        return this.isFolder ? this : this.explore(this?.folder);
    }
    /**Gets the index data of the parent folder */
    get parentFolder(): IndexData {
        let abstract = this.isFolder ? this?.folder?.parent : this?.folder;
        if (!abstract)
            return null;
        return this.explore(abstract)
    }

    /**Returns an array of all IndexData from root to this file */
    getSplitPath(this: IndexData): IndexData[] {
        let ret: IndexData[] = []; ret.unshift(this)
        let current = this?.folder?.parent;
        while (current != null) {
            ret.unshift(this.explore(current));
            current = current.parent;
        }
        return ret;
    }

    /** Generates an obsidian link to the file or folder index */
    fileLink() {
        let stepNote = this?.file, link = this.filePath;
        let text = this.name, content:any[]=[];
        let extraText = null;
        //Truncate
        if (text.length > 17) {
            extraText = text?.slice(15);
            text = text?.slice(0, 15);
            content = [<span cls="ellipsed" data-text={extraText}></span>]
        }
        content.unshift(text);

        let linkEl: HTMLElement;
        let props = {className:"internal-link FN-link",target:"_blank", rel:"noopener"};
        if (stepNote) { //Si la step note existe
            // Calculate color
            let baseCol =this.config.color || null;
            let hoverCol = baseCol && lighten(this.config.color, 0.15 * (1 - getLuminance(this.config.color)));
            let style = this.config.color?{"--link-color": this.config.color, "--link-color-hover":hoverCol}:null
            if(this.isRoot)
                props.className+=" FN-root";
            Object.assign(props,{style, title:this.name, href:link, 'data-href':link});
        }

        linkEl = <a {...props}>
                {...content}
            </a>;
        
        linkEl.onclick = stepNote ? (e) => {
            e.preventDefault()
            let mode = (app.vault as any).getConfig("defaultViewMode");
            let view = app.workspace.getActiveViewOfType(TextFileView)
            view?.leaf?.openFile(stepNote,
                { active: true, mode } as OpenViewState)
        }:null;
        linkEl.oncontextmenu = stepNote? linkMenu : (e) => {
            e.preventDefault()
            let state = { mode:(app.vault as any).getConfig("defaultViewMode") } as OpenViewState;
            app.workspace.openLinkText(this.folder.path + "/" + this.folder.name, ".", false, state)
        };

        return linkEl;
    }

    /**Opens the specified note */
    openNote() {
        let mode = (app.vault as any).getConfig("defaultViewMode");
        app.workspace.activeLeaf?.openFile(this.file,
            { active: true, mode } as OpenViewState);
    }

    /**Returns the index data of all child notes (except hidden)*/
    *childNotes(config: NoteConfig = null): Generator<IndexData, void, unknown> {
        //Map and sort notes
        let mapped = this.sortNodes(this.folder.children
            .map(child => this.explore(child)));


        let rawHideReg = config?.hideRegExp ?? [];
        rawHideReg = [rawHideReg].flat()
        let hideRegExp = rawHideReg?.map(exp => new RegExp(exp))

        for (let cData of mapped) {
            //Hide files from index
            let ignore = cData?.config?.ignore;
            ignore ||= hideRegExp?.find(reg => reg.test(cData.fullName)) != null;
            if (!ignore)
                yield cData;


        }
    }

    /**Handles the order of nodes */
    sortNodes(nodes: IndexData[], config: NoteConfig = null) {
        // TODO: Add sorting config
        //Locale Sort (Fixes number order and stuff)
        nodes = nodes.sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { numeric: true }));
        //Priority sort
        return nodes.sort((a, b) => (b?.config?.priority ?? 0) - (a?.config?.priority ?? 0))
    }

    /** Refreshes the config data of the file*/
    updateConfig() {
        let { file, exists } = this;
        if (!(file && exists)) {
            this.config = new NoteConfig();
            return;
        }

        const { frontmatter = {} } = (app.metadataCache.getFileCache(file) ?? {});

        this.config.fromMeta(frontmatter)
    }

    /** Explores another node in the tree */
    explore(abstract: TFolder | TFile | TAbstractFile) {
        return this.tree.getNode(abstract);
    }
    /** Gets the metadata of the note */
    getMetaData() {
        return (!this.isFolder) && app.metadataCache.getFileCache(this.file);
    }
}
