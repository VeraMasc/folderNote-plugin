import * as indexBlock from "./indexBlock"
import  * as headerBlock from './headerBlock';

export {indexBlock,headerBlock};


//Get block names
import * as Blocks from './Blocks';
var blockNameList = Object.values(Blocks).map(b => b.Id) ;
/**List of all valid block names */
export type BlockName = typeof blockNameList[number];