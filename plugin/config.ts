/**Posibles parámetros de configuración de una nota */
export class noteConfig{
    /**If true, not will render with a header index */
    listContent:boolean;
    useAsIndex:boolean;
	/** Ignore this file when displaying an index */
    ignore:boolean;
	/** Use custom index */
    indexFile:any;
    forceOpen:boolean;
	/** Show in expanded mode by default */
    expand:boolean;
	/** Hide folders with no index */
    hideEmpty:boolean;
	hideRegExp:Array<string>|string;
	/** How much to prioritize showing this file first. */
	priority:number;
	/** Note text color */
	color:string;
	/** Note text bg */
	bgColor:string;
	/** Make index and trail sticky */
	isSticky:boolean;
    
    icon:string; /** Prueba */
    /** Allows Unknown Properties*/
    [key: string]: any; 
    
    fromMeta(metadata:Object){
        this.clear();

        for(let [prop,val] of Object.entries(metadata) as Array<[string, any]> ){
            if(!prop.startsWith("FN-"))
                continue;
            prop=prop.slice(3)
            this[prop]=val;
        }
       
    }

	normalize(){
		this.hideExt=[this.hideExt].flat();
		this.hideNote=[this.hideNote].flat();
	}
    clear(){
        for (const prop of Object.getOwnPropertyNames(this)) {
            delete this[prop];
          }
    }
}

/**Pool of default colors for notes*/
export var defaultColorOptions = [
    "darkred", //rgb(139, 0, 0)
    "firebrick", //rgb(178, 34, 34)
    "rgb(240,210,50)", 
    "dodgerblue", //rgb(30,144,255)
    "Chocolate", // rgb(210,105,30)
    "rgb(166, 77, 121)",
    "Orangered", // rgb(255,69,0)
    "rgb(255, 193, 69)", //Yellow Orange
    "rgb(205, 193, 255)", //Blue silver
    "rgb(194, 15, 90)", //Wine
    "rgb(26, 77, 217)", //Deep blue
    "Aqua", //rgb(0, 255, 255)
    "GreenYellow", //rgb(173, 255, 47)
    "Chartreuse", //rgb(127, 255, 0)
    "DarkKhaki", //rgb(189, 183, 107)
    "DarkOrchid", //rgb(153, 50, 204)
    "ForestGreen", //rgb(34, 139, 34)
    "HotPink", //rgb(255, 105, 180)
    "rgb(99, 207, 99)",
    "LimeGreen", //rgb(50, 205, 50)
    "OliveDrab", //rgb(107, 142, 35)
    "PaleTurquoise", //rgb(175, 238, 238)
    "Sienna", //rgb(160, 82, 45)
    "Silver", //rgb(192, 192, 192)
    "Tomato", //rgb(255, 99, 71)
]


export function getRandomColor(){
    return defaultColorOptions[defaultColorOptions.length * Math.random() | 0]
}