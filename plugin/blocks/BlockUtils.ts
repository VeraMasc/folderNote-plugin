import { TFile, MarkdownPostProcessorContext} from 'obsidian';
import { NoteConfig } from '../config';


/**Generates the Codeblock context of a file
 * @param file File that executes the block
 * @param frontmatter Frontmatter config to use when rendering
*/
export function getContextOf(file:TFile,frontmatter=<NoteConfig>{}):MarkdownPostProcessorContext{

    let ret = <MarkdownPostProcessorContext>{
        docId: generateDocId(),
        sourcePath: file.path,
        frontmatter,
        //Empty functions to prevent errors
        addChild: (child)=>null, 
        getSectionInfo: (el)=> null,
    }

    return ret;
}

/**Genera una DocID nueva*/
export function generateDocId(size:number=16){
    for (var t = [], n = 0; n < size; n++)
        t.push((16 * Math.random() | 0).toString(16));
    return t.join("")
}