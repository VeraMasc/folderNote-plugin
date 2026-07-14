# Bookmarks

Bookmarks in this plugin serve the same purpose as bookmarks in a physical book: to remind your future self that you left something unfinished and where exactly you stopped. That's why I only allow one per note, because they are supposed to be a simple and immediate way to snap back without having to remember names or searching for dummy sections with headings like "Work In Progress" or stuff like that.

Bookmarks are supposed to be temporary. Either to edit/read a long note throughout several sessions or to add a temporary shortcut to something that you know you will have to quickly check out later.

## Syntax

Bookmarks are actually just the `^-` [block identifier](https://obsidian.md/help/links#Link+to+a+block+in+a+note), so it's mostly handled by obsidian, unlikely to cause conflicts and won't be visible in reading mode or exported PDFs. Just put it in its own like or at the end of a paragraph and it will work without issues.

## Behavior

There's three ways to make use of bookmarks: the startup setting, the content list and commands.

The startup setting makes it so that obsidian will immediately jump to the active note's bookmark after opening obsidian. It's not just for mobile devices, but mainly meant for them as closing and opening the app is much more common.

Alternatively, the content list will always display the bookmark as if it were the first heading in the note, regardless of its actual location, in order to facilitate navigation.

If you also want to add shortcuts or make automated use of this feature, there are commands for both creating/erasing bookmarks and jumping to their location.


Also see [Q&A (Bookmarks)](Q&A.md#bookmarks)