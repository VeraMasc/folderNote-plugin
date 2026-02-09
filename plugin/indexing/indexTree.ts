import { OpenViewState, App, Editor, TAbstractFile, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Command, TFolder, TFile, Vault, TextFileView } from 'obsidian';
import FI_Plugin from "../main"
import { NoteConfig } from "../config"
import { lighten, getLuminance } from "color2k"
import { linkMenu } from '../contextMenu';
import {FolderData} from './folderData'
import {IndexData} from './indexData'

/** Holds the tree structure of files and their indexes*/
type fileTree = {
    [name: string]: IndexData;
}

/**Holds the full tree structure of all the cached indexes  */
export class IndexTree {
    data: fileTree = {};
    plugin: FI_Plugin;

    constructor(plugin: FI_Plugin) {
        this.plugin = plugin;
    }

    /**Explore a node if not yet visited or recover the existing data */
    getNode(abstract: TFolder | TFile | TAbstractFile) {
        if (abstract == null)
            return null;

        let visited = this.data[abstract.path];
        //If not visited:
        visited ||= (this.data[abstract.path] = new IndexData(abstract, this));

        return visited;
    }
    /** Same as  {@link getNode} but for paths
     * @param path Path of the node to retrieve
    */
    getNodeAt(path: string) {
        let abstract = app.vault.getAbstractFileByPath(path)
        return this.getNode(abstract);
    }

    /**Recalculates and replaces a node */
    refreshNode(abstract: TFolder | TFile | TAbstractFile) {
        let data = new IndexData(abstract, this);
        let old = this.data[abstract.path];
        this.data[abstract.path] = data;

        //If index was changed, update its corresponding folder
        if (!data.isFolder && (data.isIndex || old?.isIndex)) {
            this.refreshNode(data.folder)
        }
    }
    /**Recalculates and refreshes a node by ID */
    refreshNodeAt(path: string){
        this.deleteNodeAt(path)
        return this.getNodeAt(path)
    }

    /**Removes the node specified by the file from the tree */
    deleteNode(abstract: TFolder | TFile | TAbstractFile) {
        this.deleteNodeAt(abstract.path)
    }
    /**Removes the node with the given path from the tree */
    deleteNodeAt(path: string) {
        let old = this.data[path];
        delete this.data[path];
        if (old && !old.isFolder && old.isIndex) {
            this.deleteNode(old.folder)
        }
    }

    /**Cleans up the tree to avoid using too much memory */
    prune() {
        // TODO: Implement
        this.data ={};
    }
}

