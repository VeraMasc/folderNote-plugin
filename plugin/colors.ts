/**Pool of default colors for notes*/

export var defaultColorOptions = shuffle([
    "darkred", //rgb(139, 0, 0)
    "firebrick", //rgb(178, 34, 34)
    "rgb(240,210,50)",
    "rgb(238, 237, 163)", // Pale yellow
    "dodgerblue", //rgb(30,144,255)
    "Chocolate", // rgb(210,105,30)
    "rgb(166, 77, 121)",
    "Orangered", // rgb(255,69,0)
    "rgb(255, 193, 69)", //Yellow Orange
    "rgb(205, 193, 255)", //Blue silver
    "rgb(194, 15, 90)", //Wine
    " rgb(27, 80, 228)", //Deep blue
    "Aqua", //rgb(0, 255, 255)
    "GreenYellow", //rgb(173, 255, 47)
    "Chartreuse", //rgb(127, 255, 0)
    "DarkKhaki", //rgb(189, 183, 107)
    "DarkOrchid", //rgb(153, 50, 204)
    "ForestGreen", //rgb(34, 139, 34)
    "HotPink", //rgb(255, 105, 180)
    "rgb(214, 78, 62)",//Danger
    "rgb(240, 202, 28)",//Corn
    "rgb(133, 139, 194)",//Clear purple
    "rgb(228, 186, 247)",// lavender
    "rgb(210, 152, 221)",// Violet Pink
    "rgb(172, 143, 69)", //Dark Gold
    "rgb(99, 207, 99)",
    "rgb(30, 255, 143)", // Jade
    "rgb(4, 228, 172)", // Turquoise
    "LimeGreen", //rgb(50, 205, 50)
    "OliveDrab", //rgb(107, 142, 35)
    "PaleTurquoise", //rgb(175, 238, 238)
    "rgb(148, 209, 238)", // Sky blue
    "Sienna", //rgb(160, 82, 45)
    "Silver", //rgb(192, 192, 192)
    "rgb(235, 235, 235)", //near white
    "Tomato", //rgb(255, 99, 71)
    "rgb(222, 175, 139)", //Skin color
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