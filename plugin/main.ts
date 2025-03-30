
import { App, Editor, MarkdownView, Modal, Notice, Plugin, Command, MetadataCache, OpenViewState, TextFileView, View, MarkdownRenderer, MarkdownPreviewRenderer, EventRef } from 'obsidian';
import {sleep} from '../../.sharedModules/Async Utils'
import {IndexTree} from "./indexing"
import {setLinkToIndex} from "./metadata"
import * as Display from "./display"
import * as Blocks from "./blocks/Blocks"
// import * as Suggest from "./suggestions"
import { BlockSuggest } from './blocks/suggest/blockSuggest';
import { EventManager } from './events/EventManager';
import { DEFAULT_SETTINGS, MyPluginSettings, SettingsTab } from './Settings';



/**Exposed app interface */
export interface xApp extends App{
	commands:{
		commands:{
			[key:string]:Command
		},
		editorCommands:{
			[key:string]:Command
		}

	},
	viewRegistry:{
		typeByExtension:any,
		viewByType:any}
	plugins:{
		plugins:{
			[key:string]:Plugin
		}
	}
	internalPlugins:{
		plugins:{
			[key:string]:{
				instance:any
			}|any
		}
		
	}
}

//Declare the global variables that the plugin will have access to
declare global {
    var app: xApp;
}

/**Base structure of the Folder note Index plugin*/
export default class FI_Plugin extends Plugin {
	declare app:xApp;
	settings: MyPluginSettings;
	activeLeafChange:EventRef = undefined;
	activeLeafSave:EventRef = undefined;
	layoutChange:EventRef = undefined;
	metaChange:EventRef = undefined;
	//TODO: transfer events to manager
	events:EventManager = new EventManager(this);
	metaResolve = undefined;
	metaInit= undefined;
	metaDel = undefined;
	RootIndexList:Array<string>=[];
	/**Tree of all indexes */
	tree:IndexTree;
	trailResizeObs:ResizeObserver;
	divResizeObs:ResizeObserver;
	/** Codeblock Injectors */
	injectors:{}={};
	/** Codeblock Processors */
	mdProcessors:{}={};
	editorChange: any;
	/**Singleton for the plugin */
	static instance:FI_Plugin;

	async onload() {
		FI_Plugin.instance = (window as any).FNindex=this;
		await this.loadSettings();
		globalThis.app=this.app;

		//Register Blocks
		for(let block of Object.values(Blocks)){
			if(!block?.Id) continue;
			try{
				this.mdProcessors[block?.Id] = await this.registerMarkdownCodeBlockProcessor(block?.Id+'',(source, el, ctx)=>block.generateBlock(source, el, ctx,this))
				this.injectors[block?.Id+'']=block;
			}catch(err){
				console.error("Blocks Plugin Error: ",err)
			}
		}

		//Register suggest
		this.registerEditorSuggest(new BlockSuggest(this))
		
		//TODO: make main readable

		this.tree = new IndexTree(this);
		this.trailResizeObs = 
			new ResizeObserver(Display.trailOverflow);


		this.events.registerMetaChangeEvent();

		app.workspace.onLayoutReady(async () => {
            var _a;
            const noFiles = app.vault.getMarkdownFiles().length;
			await this.redrawFN()
            // console.warn("Load event")
			
            this.events.registerActiveLeafChangeEvent();
			this.events.registerLayoutChangeEvent();
			this.events.registerMetaDelEvent();


            app.workspace.iterateAllLeaves((leaf) => {
                if (leaf instanceof MarkdownView)
                    //@ts-ignore
                    leaf.view.previewMode.rerender(true);
            });
			
		});
		
		// Custom Save command
		// https://github.com/hipstersmoothie/obsidian-plugin-prettier/blob/main/src/main.ts
		const saveCommandDefinition = this.app.commands.commands["editor:save-file"];
		const save = saveCommandDefinition === null || saveCommandDefinition === void 0 ? void 0 : saveCommandDefinition.callback;
		if (typeof save === "function") {
			saveCommandDefinition.callback = async () => {
				await save();
				if (this.settings.refreshOnNoteSave) {
					
					await this.redrawFN()
				}
			};
		}

        for(let block of Object.values(Blocks)){
			if(!block?.Id) continue;
			try{
				this.registerMarkdownCodeBlockProcessor(block?.Id+'',(source, el, ctx)=>block.generateBlock(source, el, ctx,this))
				this.injectors[block?.Id+'']=block;
			}catch(err){
				console.log({err})
				console.warn("Blocks Plugin Error: ",err)
			}
		}

		this.addSettingTab(new SettingsTab(this.app, this));
	}


	async onunload() {
		this.trailResizeObs.disconnect()
		//Unregister Blocks
		for(let block of Object.values(Blocks)){
			if(!block?.Id) continue;
			try{
				//TODO: Fix post processors not unregistering
				MarkdownPreviewRenderer.unregisterPostProcessor(this.mdProcessors[block?.Id]);
				console.warn(`Unregistered block: ${block?.Id}`)
			}catch(err){
				console.error("Blocks Plugin Error: ",err)
			}
		}
	}
 
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.parseRootIndex();
			
	}

	/**Parses the root index names
	 * @param [resetTree=false] indicates if the {@link IndexTree} should be reset after parsing
	*/
	parseRootIndex(resetTree=false){
		this.RootIndexList = this.settings.rootIndex?.match(/(?:[^,\\]|\\.)+/g)
		?.map(s=>s?.trim())
		if(resetTree)
			this.tree = new IndexTree(this);
	} 

	async saveSettings() {
		await this.saveData(this.settings);
	}



	/**Redraws the Folder Note elements */
	async redrawFN() {
		
		try {
			const { RootIndexList=[], settings,  app } = this;

			const {activeMDView, mode} = Display.getActiveMDView() 
			if(activeMDView)
				Display.Trail(activeMDView,mode,this)	
		}
		catch (err) {
			console.error(err);
 
		}
	}
}

