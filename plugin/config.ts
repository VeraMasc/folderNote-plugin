/**Configuration parameters a note can have */
export class NoteConfig {
    /**If true, not will render with a header index */
    listContent: boolean;
    /**Forces the file to be used as an index or not */
    useAsIndex: boolean;
    /** Ignore this file when displaying an index */
    ignore: boolean;
    /** Use custom index */
    indexFile: any;
    forceOpen: boolean;
    /** Show in expanded mode by default */
    expand: boolean;
    /**Enables navigation between files */
    nav: boolean;
    /**Flattens the navigation (like the contents of the folder are in the parent) */
    flatNav: boolean;
    /** Hide folders with no index */
    hideEmpty: boolean;
    /**Regex for hiding files */
    hideRegExp: Array<string> | string;
    /**Hides files by extension */
    hideExt: string | string[];
    /**Hides specific notes by name */
    hideNote: string | string[];
    /** How much to prioritize showing this file first. */
    priority: number;
    /** Note text color */
    color: string;
    /** Note text bg */
    bgColor: string;
    /** Make index and trail sticky */
    isSticky: boolean;

    icon: string; /** Prueba */
    /** Allows Unknown Properties*/
    [key: string]: any;

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

    /**Normalizes all the config data for consistency*/
    normalize() {
        //Flatten
        this.hideExt &&= [this.hideExt].flat();
        this.hideNote &&= [this.hideNote].flat();
        this.color &&= this.color.trim();
    }

    clear() {
        for (const prop of Object.getOwnPropertyNames(this)) {
            delete this[prop];
        }
    }
}

