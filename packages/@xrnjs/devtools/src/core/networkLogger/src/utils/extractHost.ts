import parse from "url-parse";

const extractHost = (url: string) => {
  try {
    const { host } = parse(url, true);
    return host;
  } catch {
    return undefined;
  }
};

export default extractHost;
