import * as indexBlock from "./indexBlock"
import  * as contentBlock from './contentBlock';

type HeaderBlockType = {Id:'headerIndex'} ;
//TODO: Remove HeaderIndex block
let headerBlock = {...contentBlock, ...({Id:'headerIndex'} as HeaderBlockType)}

export {indexBlock,headerBlock,contentBlock};


//Get block names
import * as Blocks from './Blocks';
var blockNameList = Object.values(Blocks).map(b => b.Id) ;
/**List of all valid block names */
export type BlockName = typeof blockNameList[number];