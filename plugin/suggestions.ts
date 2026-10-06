import {Editor, EditorPosition, EditorSuggest,EditorSuggestTriggerInfo,FuzzyMatch, Plugin, TFile,EditorSuggestContext, SearchResult} from "obsidian";
import { NoteConfig } from "./config";

// TODO: Properly implement suggestions

export class TestSuggestions extends EditorSuggest<FuzzyMatch<NoteConfig>>{
	renderSuggestion(value: FuzzyMatch<NoteConfig>, el: HTMLElement): void {
		throw new Error("Method not implemented.");
	}
	selectSuggestion(value: FuzzyMatch<NoteConfig>, evt: MouseEvent | KeyboardEvent): void {
		throw new Error("Method not implemented.");
	}
	plugin;

	constructor(plugin: Plugin) {
		super(plugin.app)
		this.plugin = plugin;
	}
	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo {
		throw new Error("Method not implemented.");
	}

	getSuggestions(context: EditorSuggestContext): FuzzyMatch<NoteConfig>[] | Promise<FuzzyMatch<NoteConfig>[]> {
		
		return [{item:new NoteConfig(), match:(null as any) } as FuzzyMatch<NoteConfig> ];
	}
}