import { EventRef } from 'obsidian';
import FI_Plugin from '../main';


/**Manages all the plugin's events */
export class EventManager{
    plugin:FI_Plugin;
    //TODO: Move events from main to this class
    activeLeafChange:EventRef = undefined;
	activeLeafSave:EventRef = undefined;
	layoutChange:EventRef = undefined;
	metaChange:EventRef = undefined;
}