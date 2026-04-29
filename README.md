# Folder Note Index plugin

## Getting started

This plugin is meant to be used alongside a folder note plugin like [this one](https://github.com/LostPaul/obsidian-folder-notes) and with an index structure of `/**/FolderName/FolderName.md`. These files are the so called "index files" and are necessari for most of the plugin's features.

### Root

> [!WARNING]
> Because of how folders are structured, the root folder doesn't have a regular index, it has a root index. Its name has to be set in the setting of the plugin or it will be 'Index' by default. The plugin will work without it, but the root index is meant to act as the core hub between Vault sections and you might not even realize it's not working otherwise.


## Main Features

### Folder Indexes

The main functionality of the plugin revolves around indexes. These serve to list all contents from a folder so you don't have to manually link them or use the same dataview queries over and over again.

// TODO: Add picture

Folders default to using the file with the same name inside them as index, but you can override this in many ways (see [properties](#full-list-of-properties)).

// TODO: indexes

### Path Trail

// TODO: trail

### Tables of contents

// TODO: TOC

## Full list of properties


```ts
class NoteConfig {
    /**If true, not will render with a header index */
    FN-listContent: boolean;
    /** Forces the file to be (or not be) used as an index*/
    FN-useAsIndex: boolean | null;
    /** Ignore this file when displaying an index */
    FN-ignore: boolean;
    /** Use other file as index instead */
    FN-indexFile: any;
    /** Forces the index to be open or closed. Null to not force*/
    FN-forceOpen: boolean | null;
    /** Show in expanded mode by default */
    FN-expand: boolean;
    /**Enables navigation between files */
    FN-nav: boolean;
    /**Flattens the navigation (like the contents of the folder are in the parent) */
    FN-flatNav: boolean;
    /** Hide folders with no index */
    FN-hideEmpty: boolean;
    /**Regex for hiding files */
    FN-hideRegExp: Array<string> | string;
    /**Hides files by extension */
    FN-hideExt: string | string[];
    /**Hides specific notes by name */
    FN-hideNote: string | string[];
    /** How much to prioritize showing this file first. */
    FN-priority: number;
    /** Note text color */
    FN-color: string;
    /** Note text bg */
    FN-bgColor: string;
    /** Make index and trail sticky */
    FN-isSticky: boolean;
    /** Changes its icon */
    FN-icon: string; 
    /** Allows Unknown Properties*/
}
```

## Known Issues

- Text might randomly move up and down for a second while you're writing in a note with FN-listContent.
  - I have reduced it a lot, but for some reason the TOC seems to not render for a frame.