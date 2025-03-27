import { PluginSettingTab, App, Setting } from 'obsidian';
import FI_Plugin from './main';


export class SettingsTab extends PluginSettingTab {
	plugin: FI_Plugin;

	constructor(app: App, plugin: FI_Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl, plugin } = this;
		const { settings } = plugin;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

		//Refresh on save
		new Setting(containerEl)
			.setName("Refresh on Save")
			.setDesc("Refresh Folder note index when a note is saved")
			.addToggle((toggle) => toggle.setValue(settings.refreshOnNoteSave).onChange(async (value) => {
				settings.refreshOnNoteSave = value;
				await plugin.saveSettings();
			}
			));

		//Refresh on change
		new Setting(containerEl)
			.setName("Refresh on Change")
			.setDesc("Refresh Folder note index when changing notes")
			.addToggle((toggle) => toggle.setValue(settings.refreshOnNoteChange).onChange(async (value) => {
				settings.refreshOnNoteChange = value;
				await plugin.saveSettings();
			}
			));

		//Codeblock suggestions
		new Setting(containerEl)
			.setName("Codeblock Suggestions")
			.setDesc("Shows suggestions for the plugin's codeblock parameters")
			.addToggle((toggle) => 
				toggle
				.setValue(settings.blockSuggestions)
				.onChange(async (value) => {
					settings.blockSuggestions = value;
					await plugin.saveSettings();
				}
			));

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
}

/**Describes the default settings of the plugin */
export const DEFAULT_SETTINGS: MyPluginSettings = {
	refreshOnNoteSave: true,
	refreshOnNoteChange: true,
	rootIndex: null,
	blockSuggestions:false,
};

