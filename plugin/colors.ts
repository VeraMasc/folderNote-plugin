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
    "rgb(167, 133, 47)", //Dark Gold
    "rgb(99, 207, 99)",
    "LimeGreen", //rgb(50, 205, 50)
    "OliveDrab", //rgb(107, 142, 35)
    "PaleTurquoise", //rgb(175, 238, 238)
    "Sienna", //rgb(160, 82, 45)
    "Silver", //rgb(192, 192, 192)
    "Tomato", //rgb(255, 99, 71)
];


export function getRandomColor() {
    return defaultColorOptions[defaultColorOptions.length * Math.random() | 0];
}
