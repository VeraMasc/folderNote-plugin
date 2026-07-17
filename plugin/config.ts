import { type Config } from "./blocks/contentBlock";
/** Configuration parameters a note can have */
export class NoteConfig {
    /** If true, note will render with a heading TOC */
    listContent: boolean;
    /** Requires {@link listContent}. Same as {@link Config.listBlocks} makes blocks be treated as headings in the TOC.*/
    listBlocks:boolean;
    /** Forces the file to be used as an index or not */
    useAsIndex: boolean | null;
    /** Ignore this file when displaying an index */
    ignore: boolean;
    /** Use other file as index instead*/
    indexFile: any;
    /** Forces this index to be open or closed. Null to not force*/
    forceOpen: boolean | null;
    /** Shows a title in the index. Useful for codeblocks*/
    showTitle:boolean;
    /** Show index in expanded mode by default */
    expand: boolean;
    /** Enables sequential navigation between files */
    nav: boolean;
    /** Requires {@link nav}Flattens the navigation (like the contents of the folder are in the parent) */
    flatNav: boolean;
    /** Hide folders with no index */
    hideEmpty: boolean;
    /** Regex for hiding files */
    hideRegExp: Array<string> | string;
    /** Hides files by extension */
    hideExt: string | string[];
    /** Hides specific notes by name. Use {@link hideRegExp} for pattern*/
    hideNote: string | string[];
    /** How much to prioritize showing this file first in the index */
    priority: number;
    /** Note text color */
    color: string;
    /** Note text bg */
    bgColor: string;
    /** Make index and trail sticky */
    isSticky: boolean;
    /** Adds a custom icon. Allows any unicode*/
    icon: string; 
    /** Allows Unknown Properties*/
    // [key: string]: any;

    fromMeta(metadata: Object) {
        this.clear();
        // TODO: Improve NoteConfig documentation

        for (let [prop, val] of Object.entries(metadata) as Array<[string, any]>) {
            if (!prop.startsWith("FN-"))
                continue;
            prop = prop.slice(3)
            this[prop] = val;
        }
        this.normalize();
    }

    /** Normalizes all the config data for consistency*/
    normalize() {
        //Flatten
        this.hideExt &&= [this.hideExt].flat();
        this.hideNote &&= [this.hideNote].flat();
        this.color &&= this.color.trim();
        this.icon &&= this.icon.trimEnd();
        if(this.icon?.length>1 && this.icon?.startsWith("'") && this.icon?.endsWith("'")){
            let match = this.icon.match(/^'(.+)'$/);
            if(match)
                this.icon= match[1];
        }
    }

    clear() {
        for (const prop of Object.getOwnPropertyNames(this)) {
            delete this[prop];
        }
    }
}

