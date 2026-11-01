import { EventRef, FileView, TAbstractFile, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import FI_Plugin from '../main';
import { setLinkToIndex } from '../metadata';
import * as Display from "../display/display"
import { debounce, debounceReps } from '../../../.sharedModules/EventUtils';
import {getHeaderUI} from '../display/headerUI'


/**Manages all the plugin's events */
export class EventManager{
    plugin:FI_Plugin;
    activeLeafChange: EventRef = undefined;
	activeLeafSave: EventRef = undefined;
	layoutChange: EventRef = undefined;
    /**Event that triggers when changes are made in the editor */
	editorChange: EventRef=undefined;
	metaChange: EventRef = undefined;
	nameChange: EventRef = undefined;

    constructor(plugin:FI_Plugin){
        this.plugin=plugin;
    }

    /**Registers events for when you write, switch Obsidian "leafs" or switch editor modes */
    regLeafChangeEv_() {
        let {plugin} = this;
        var func = async (leaf:WorkspaceLeaf) => {
            if (plugin.settings.refreshOnNoteChange) {
                await plugin.redrawFN();
                if((leaf?.view as FileView)?.file){ // It's a leaf that views a file
                    getHeaderUI(leaf.view);
                }
                
                //console.warn("Refresh event")
            };
        };
        this.activeLeafChange = plugin.app.workspace.on("active-leaf-change", func);
        this.editorChange = plugin.app.workspace.on("editor-change", debounceReps(func,500));
        plugin.registerEvent(this.activeLeafChange);
        plugin.registerEvent(this.editorChange);
    }
    
    /**Registers the obsidian layout changes*/
    regLayoutChangeEv_() {
        this.layoutChange = this.plugin.app.workspace.on("layout-change", async () => {
            await this.plugin.redrawFN();
            //console.warn("Layout event")
        });
        this.plugin.registerEvent(this.layoutChange);
    }
     
    /**Registers the event for when a file's metadata (or Name) changes */
    regMetaChangeEvent_() {
        let {plugin} = this;
        const metaChange = async (file:TFile) => {
           // console.warn("File modified")
            plugin.tree.refreshNode(file)
            var view = Display.getActiveMDView();
            if(view.activeMDView?.file == file){
                //console.warn("Active File modified")
                await plugin.redrawFN();
            }
        };

        const nameChange = async (file:TFile|TFolder,oldpath:string) => {
            if((file as TFile)?.extension){
                plugin.tree.deleteNodeAt(oldpath)
                await metaChange(file as TFile)
            }
        };
        let {metadataCache, vault} = plugin.app;
        //On metadata change
        this.metaChange = metadataCache.on("changed", metaChange);
        plugin.registerEvent(this.metaChange);
        
        //On name change
        this.nameChange = vault.on("rename",nameChange)
        plugin.registerEvent(this.nameChange);

        plugin.metaResolve = metadataCache.on("resolve", (data)=>(setLinkToIndex(data,plugin)))
        plugin.registerEvent(plugin.metaResolve);

    }
    
    /**Registers the delete event*/
    regMetaDelEv_() {
        let {plugin} = this;
        plugin.metaDel = plugin.app.metadataCache.on("deleted", async (file) => {
            plugin.tree.deleteNode(file)
        });
        plugin.registerEvent(plugin.metaDel);
    }
}