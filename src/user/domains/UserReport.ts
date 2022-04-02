export default interface UserReport {
    username: string;
    name: string;
    createdAt: Date;
    cohort: {
        name: string;
    };
}
