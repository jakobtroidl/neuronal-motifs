export function getRandomColor()
{
    // returns random color as a hex code
    let hex_code = Math.floor(Math.random()*16777215).toString(16);
    return  "#" + hex_code;
}