export default class EnvVars {
    // TODO need to pass parser option as a parameter e.g., number/string
    static get(name: string): string | null {
        return name in process.env ? process.env[name] : null;
    }
}
