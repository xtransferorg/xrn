/**
 * Generate a command string from base command and options object
 * Converts an options object into command-line arguments string
 * Handles boolean flags and value-based options appropriately
 * 
 * @param baseCommand - The base command to execute
 * @param options - Object containing command options and their values
 * @returns Formatted command string ready for execution
 * 
 * @example
 * generateCommandString("npm install", { 
 *   save: true, 
 *   package: "react-native" 
 * })
 * // Returns: "npm install --save --package 'react-native'"
 */
export const generateCommandString = (
    baseCommand: string,
    options: Record<string, any>
  ) => {
    const commandParts = [baseCommand];
  
    for (const [key, value] of Object.entries(options)) {
      if (typeof value === "boolean" || value === "true" || value === "false") {
        if (value && value !== "false") {
          commandParts.push(`--${key}`);
        }
      } else if (value) {
        commandParts.push(`--${key} '${value}'`);
      }
    }
  
    return commandParts.join(" ");
  };
  