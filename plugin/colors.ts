/**Pool of default colors for notes*/

export var defaultColorOptions = shuffle([
    "darkred", //rgb(139,0,0)
    "firebrick", //rgb(178,34,34)
    "#f0d232",
    "#eeeda3", // Pale yellow
    "dodgerblue", //rgb(30,144,255)
    "Chocolate", // rgb(210,105,30)
    "#a64d79",
    "Orangered", // rgb(255,69,0)
    "#ffc145", //Yellow Orange
    "#cdc1ff", //Blue silver
    "#c20f5a", //Wine
    "#1b50e4", //Deep blue
    "Aqua", //rgb(0,255,255)
    "GreenYellow", //rgb(173,255,47)
    "Chartreuse", //rgb(127,255,0)
    "DarkKhaki", //rgb(189,183,107)
    "DarkOrchid", //rgb(153,50,204)
    "ForestGreen", //rgb(34,139,34)
    "HotPink", //rgb(255,105,180)
    "#d64e3e",//Danger
    "#f0ca1c",//Corn
    "#858bc2",//Clear purple
    "#e4baf7",// lavender
    "#d298dd",// Violet Pink
    "#ac8f45", //Dark Gold
    "#63cf63",
    "#1eff8f", // Jade
    "#04e4ac", // Turquoise
    "LimeGreen", //rgb(50,205,50)
    "OliveDrab", //rgb(107,142,35)
    "PaleTurquoise", //rgb(175,238,238)
    "#94d1ee", // Sky blue
    "Sienna", //rgb(160,82,45)
    "Silver", //rgb(192,192,192)
    "#ebebeb", //near white
    "Tomato", //rgb(255,99,71)
    "#deaf8b", //Skin color
]);


/**Gets a new random color string */
export function getRandomColor() {
    return defaultColorOptions[defaultColorOptions.length * Math.random() | 0];
}

/**Get sthe next color in the list of random colors */
export function getAnotherColor(color:string) {
    var index;
    if(color === null ||(index=defaultColorOptions.indexOf(color)) == -1)
        return getRandomColor();
    index = (index+1)%defaultColorOptions.length
    return defaultColorOptions[index];
}

/**Fisher-Yates Shuffle */
function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}