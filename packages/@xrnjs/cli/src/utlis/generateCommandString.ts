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
  