import { EditorPosition, Editor } from 'obsidian';

/**Finds the parent codeblock of a specific editor position 
 * @param attempts number of attempts before the function gives up 
*/
export function findParentCodeblock(pos:EditorPosition, editor:Editor, attempts:number=50):string|null{
    //Iterate lines
    for(var i=pos.line-1; i>=0; i--){
        let line = editor.getLine(i);

        //Skip empty
        if(line.length<3) // 3 because it can't be a variable or a "```"
            continue;

        //Detect codeblock start/end
        if(line.startsWith("```")){ //TODO: Handle spaced or tabulated blocks
            return line.match(/^\s*```(.*)/)?.[1]
        }

        //Close last line with ";" before next
        let index = line.length;
        do {
            index--;
            if(line[index]===';')
                break; //Closure found
            if(line[index]!==" ")
                return null; //Exposed non whitespace found
        } while (index>=0);
        


        //Max lines reached
        attempts--
        if(attempts==0)
            return null;
    }
}