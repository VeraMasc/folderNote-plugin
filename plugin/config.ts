export class noteConfig{
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