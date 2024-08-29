
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Command, MetadataCache, OpenViewState, TextFileView, View } from 'obsidian';
import {sleep} from '../../.sharedModules/Async Utils'
import {IndexTree} from "./indexing"
import {setLinkToIndex} from "./metadata"
import * as Display from "./display"
import * as Blocks from "./blocks/Blocks"
// import * as Suggest from "./suggestions"

interface xApp extends App{
	commands:any,
	viewRegistry:{
		typeByExtension:any,
		viewByType:any}
}

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	refreshOnNoteSave: boolean;
	refreshOnNoteChange:boolean;
	RootIndex:string;
	
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	refreshOnNoteSave: true,
	refreshOnNoteChange:true,
	RootIndex:null,

}

export default class FolderIndexPlugin extends Plugin {
	declare app:xApp;
	settings: MyPluginSettings;
	activeLeafChange = undefined;
	activeLeafSave = undefined;
	layoutChange = undefined;
	metaChange = undefined;
	metaResolve = undefined;
	metaInit= undefined;
	metaDel = undefined;
	RootIndexList:Array<string>=[];
	map:IndexTree;
	trailResizeObs:ResizeObserver;
	divResizeObs:ResizeObserver;
	/** Codeblock Injectors */
	injectors:{}={};
	editorChange: any;

	async onload() {
		(window as any).FNindex=this;
		await this.loadSettings();

		//Register Blocks
		for(let block of Object.values(Blocks)){
			if(!block?.Id) continue;
			try{
				this.registerMarkdownCodeBlockProcessor(block?.Id+'',(source, el, ctx)=>block.generateBlock(source, el, ctx,this))
				this.injectors[block?.Id+'']=block;
			}catch(err){
				console.error("Blocks Plugin Error: ",err)
			}
		}
		


		this.map = new IndexTree(this);
		this.trailResizeObs = 
			new ResizeObserver(Display.trailOverflow);


		this.registerMetaChangeEvent();

		app.workspace.onLayoutReady(async () => {
            var _a;
            const noFiles = app.vault.getMarkdownFiles().length;
			await this.drawTrail()
            // console.warn("Load event")
			
            this.registerActiveLeafChangeEvent();
			this.registerLayoutChangeEvent();
			
			this.registerMetaDelEvent();
			this.registerBlockSuggestions();



            

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
					
					await this.drawTrail()
				}
			};
		}

        for(let block of Object.values(Blocks)){
			if(!block?.Id) continue;
			try{
				this.registerMarkdownCodeBlockProcessor(block?.Id+'',(source, el, ctx)=>block.generateBlock(source, el, ctx,this))
				this.injectors[block?.Id+'']=block;
			}catch(err){
				console.error("Blocks Plugin Error: ",err)
			}
		}

		this.addSettingTab(new SettingTab(this.app, this));
	}

	registerBlockSuggestions() {
		//this.registerEditorSuggest(new Suggest.TestSuggestions(this))
	}

	onunload() {
		this.trailResizeObs.disconnect()
	}
 
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.parseRootIndex();
			
	}

	parseRootIndex(){
		this.RootIndexList = this.settings.RootIndex?.match(/(?:[^,\\]|\\.)+/g)
		?.map(s=>s?.trim())
	} 

	async saveSettings() {
		await this.saveData(this.settings);
	}

	registerActiveLeafChangeEvent() {
		var func = async () => {
			if (this.settings.refreshOnNoteChange) {
				await this.drawTrail();
				console.warn("Refresh event")
			};
		};
		this.activeLeafChange = this.app.workspace.on("active-leaf-change", func);
		this.editorChange = this.app.workspace.on("editor-change", func);
		this.registerEvent(this.activeLeafChange);
		this.registerEvent(this.editorChange);
    }

	registerLayoutChangeEvent() {
        this.layoutChange = this.app.workspace.on("layout-change", async () => {
            //TODO: Make this handle config changes
			await this.drawTrail();
			console.warn("Layout event")
        });
        this.registerEvent(this.layoutChange);
    }
 
	registerMetaChangeEvent() {
		//Evento de archivo modificado
        this.metaChange = this.app.metadataCache.on("changed", async (file) => {
			//console.warn("File modified")
			this.map.refreshNode(file)
			var view = Display.getActiveMDView();
			if(view.activeMDView.file == file){
				//console.warn("Active File modified")
				await this.drawTrail();
			}
        });
        this.registerEvent(this.metaChange);

		this.metaResolve = this.app.metadataCache.on("resolve", (data)=>(console.log("res"),setLinkToIndex(data,this)))
		this.registerEvent(this.metaResolve);

		
		// this.metaInit = this.app.vault.on("create", (data)=>(console.log("init"),setLinkToIndex(data)));
		// this.registerEvent(this.metaInit);
    }
	registerMetaDelEvent() {
        this.metaDel = this.app.metadataCache.on("deleted", async (file) => {
			this.map.deleteNode(file)
        });
        this.registerEvent(this.metaDel);
    }

	async drawTrail() {
		
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

class SampleModal extends Modal {
	constructor(app: App ) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SettingTab extends PluginSettingTab {
	plugin: FolderIndexPlugin;

	constructor(app: App, plugin: FolderIndexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl,plugin} = this;
		const { settings } = plugin;
		containerEl.empty();
		
		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName("Refresh on Save")
			.setDesc("Refresh Folder note index when a note is saved")
			.addToggle((toggle) => toggle.setValue(settings.refreshOnNoteSave).onChange(async (value) => {
				settings.refreshOnNoteSave = value;
				await plugin.saveSettings();
			}
		));

		new Setting(containerEl)
			.setName("Refresh on Change")
			.setDesc("Refresh Folder note index when changing notes")
			.addToggle((toggle) => toggle.setValue(settings.refreshOnNoteChange).onChange(async (value) => {
				settings.refreshOnNoteChange = value;
				await plugin.saveSettings();
			}
		));

		new Setting(containerEl)
			.setName("Root Index Name")
			.setDesc("Name of the file in the root directory that will act as index")
			.addText(text => text
				.setPlaceholder('File Name')
				.setValue(this.plugin.settings.RootIndex)
				.onChange(async (value) => {
					this.plugin.settings.RootIndex = value;
					this.plugin.parseRootIndex();
					await this.plugin.saveSettings();
					await this.plugin.drawTrail();
				}));
	}
}
