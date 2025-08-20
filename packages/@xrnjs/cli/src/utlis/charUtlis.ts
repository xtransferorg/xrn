/**
 * Capitalize the first letter of a string
 * Converts the first character to uppercase while keeping the rest unchanged
 * 
 * @param str - Input string to capitalize
 * @returns String with first letter capitalized
 * 
 * @example
 * capitalizeFirstLetter("hello world") // Returns: "Hello world"
 */
function capitalizeFirstLetter(str: string) {
    // Convert the first character of the string to uppercase
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export { capitalizeFirstLetter }