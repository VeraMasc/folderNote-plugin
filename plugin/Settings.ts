import { PluginSettingTab, App, Setting } from 'obsidian';
import FI_Plugin from './main';
import {addToggle, SettingsContext} from '.sharedModules/obsidian/SettingsUtils'


export class SettingsTab extends PluginSettingTab {
	plugin: FI_Plugin;

	constructor(app: App, plugin: FI_Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl, plugin } = this;
		const { settings } = plugin;
		const context = {containerEl, plugin, settings} as SettingsContext<MyPluginSettings>;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Folder Index settings' });
		containerEl.createEl('a', { text: 'see documentation', href:"https://github.com/VeraMasc/folderNote-plugin" });

		//Refresh on save
		addToggle<MyPluginSettings>(context,'refreshOnNoteSave',"Refresh on Save","Refresh Folder note index when a note is saved");

		//Refresh on change
		addToggle<MyPluginSettings>(context,'refreshOnNoteChange',"Refresh on Change","Refresh Folder note index when changing notes");
		
		addToggle<MyPluginSettings>(context,'blockSuggestions',"Codeblock Suggestions","Shows suggestions for the plugin's codeblock parameters")
		//Block suggestions
		addToggle<MyPluginSettings>(context,'bookmarkStartup',"Go to bookmark after vault startup","Ensures vault will open the last active file at the bookmarked ('^-' block identifier) location")
		
		

		new Setting(containerEl)
			.setName("Root Index Name")
			.setDesc("Name of the file in the root directory that will act as index")
			.addText(text => text
				.setPlaceholder('File Name')
				.setValue(this.plugin.settings.rootIndex)
				.onChange(async (value) => {
					this.plugin.settings.rootIndex = value;
					this.plugin.parseRootIndex(true);
					await this.plugin.saveSettings();
					await this.plugin.redrawFN();
				}));
	}
}
// Remember to rename these classes and interfaces!
export interface MyPluginSettings {
	refreshOnNoteSave: boolean;
	refreshOnNoteChange: boolean;
	/**File to use as index of the Root Folder */
	rootIndex: string;
	/**Enables suggestions for the plugin's blocks */
	blockSuggestions:boolean;
	/** Indicates that the app should go to the active file's bookmark after startup */
	bookmarkStartup:boolean;
}

/**Describes the default settings of the plugin */
export const DEFAULT_SETTINGS: MyPluginSettings = {
	refreshOnNoteSave: true,
	refreshOnNoteChange: true,
	rootIndex: 'Index',
	blockSuggestions:false,
	bookmarkStartup:true,
};

