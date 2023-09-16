import {Editor, EditorPosition, EditorSuggest,EditorSuggestTriggerInfo,FuzzyMatch, Plugin, TFile,EditorSuggestContext} from "obsidian";
import { noteConfig } from "./config";

export class TestSuggestions extends EditorSuggest<FuzzyMatch<noteConfig>>{
	plugin;

	constructor(plugin: Plugin) {
		super(plugin.app)
		this.plugin = plugin;
	}
	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo {
		
	}

	getSuggestions(context: EditorSuggestContext): FuzzyMatch<noteConfig>[] | Promise<FuzzyMatch<noteConfig>[]> {
		return [{item=null, match=null,new noteConfig()}];
	}
}