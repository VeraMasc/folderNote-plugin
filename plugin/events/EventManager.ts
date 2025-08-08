import { EventRef } from 'obsidian';
import FI_Plugin from '../main';
import { setLinkToIndex } from '../metadata';
import * as Display from "../display"
import { debounce } from '../../../.sharedModules/EventUtils';


/**Manages all the plugin's events */
export class EventManager{
    plugin:FI_Plugin;
    //TODO: Move event references from main to this class
    activeLeafChange:EventRef = undefined;
	activeLeafSave:EventRef = undefined;
	layoutChange:EventRef = undefined;
	metaChange:EventRef = undefined;

    constructor(plugin:FI_Plugin){
        this.plugin=plugin;
    }

    /**Registers events for when you write, switch Obsidian "leafs" or switch editor modes */
    registerLeafChangeEvents() {
        var func = async () => {
            if (this.plugin.settings.refreshOnNoteChange) {
                await this.plugin.redrawFN();
                //console.warn("Refresh event")
            };
        };
        this.plugin.activeLeafChange = this.plugin.app.workspace.on("active-leaf-change", func);
        this.plugin.editorChange = this.plugin.app.workspace.on("editor-change", debounce(func,100));
        this.plugin.registerEvent(this.plugin.activeLeafChange);
        this.plugin.registerEvent(this.plugin.editorChange);
    }
    
    /**Registers the obsidian layout changes*/
    registerLayoutChangeEvent() {
        this.plugin.layoutChange = this.plugin.app.workspace.on("layout-change", async () => {
            //TODO: Make this handle config changes
            await this.plugin.redrawFN();
            //console.warn("Layout event")
        });
        this.plugin.registerEvent(this.plugin.layoutChange);
    }
     
    /**Registers the event for when a file's metadata changes */
    registerMetaChangeEvent() {
        //Evento de archivo modificado
        this.plugin.metaChange = this.plugin.app.metadataCache.on("changed", async (file) => {
            //console.warn("File modified")
            this.plugin.tree.refreshNode(file)
            var view = Display.getActiveMDView();
            if(view.activeMDView?.file == file){
                //console.warn("Active File modified")
                await this.plugin.redrawFN();
            }
        });
        this.plugin.registerEvent(this.plugin.metaChange);

        this.plugin.metaResolve = this.plugin.app.metadataCache.on("resolve", (data)=>(setLinkToIndex(data,this.plugin)))
        this.plugin.registerEvent(this.plugin.metaResolve);

    }
    
    /**Registers the delete event*/
    registerMetaDelEvent() {
        this.plugin.metaDel = this.plugin.app.metadataCache.on("deleted", async (file) => {
            this.plugin.tree.deleteNode(file)
        });
        this.plugin.registerEvent(this.plugin.metaDel);
    }
}