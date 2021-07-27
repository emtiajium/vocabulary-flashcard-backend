enum MomentUnit {
    DAYS = 'DAYS',
    HOURS = 'HOURS',
    MINUTES = 'MINUTES',
    SECONDS = 'SECONDS',
}

export default MomentUnit;

export function makeItOlder(now: Date, unit: MomentUnit, period: number): Date {
    const clonedNow = new Date(now.valueOf());
    if (unit === MomentUnit.DAYS) {
        return new Date(clonedNow.setDate(clonedNow.getDate() - period));
    }
    if (unit === MomentUnit.HOURS) {
        return new Date(clonedNow.setHours(clonedNow.getHours() - period));
    }
    if (unit === MomentUnit.MINUTES) {
        return new Date(clonedNow.setMinutes(clonedNow.getMinutes() - period));
    }
    return new Date(clonedNow.setSeconds(clonedNow.getSeconds() - period));
}

export function makeItNewer(now: Date, unit: MomentUnit, period: number): Date {
    const clonedNow = new Date(now.valueOf());
    if (unit === MomentUnit.DAYS) {
        return new Date(clonedNow.setDate(clonedNow.getDate() + period));
    }
    if (unit === MomentUnit.HOURS) {
        return new Date(clonedNow.setHours(clonedNow.getHours() + period));
    }
    if (unit === MomentUnit.MINUTES) {
        return new Date(clonedNow.setMinutes(clonedNow.getMinutes() + period));
    }
    return new Date(clonedNow.setSeconds(clonedNow.getSeconds() + period));
}

const oneMinuteInSeconds = 60;

const oneDayInHours = 24;

const oneSecondInMilliSeconds = 1000;

export function momentDiff(firstMoment: Date, secondMoment: Date, unit: MomentUnit): number {
    const differenceInSeconds = Math.abs(firstMoment.getTime() - secondMoment.getTime()) / oneSecondInMilliSeconds;
    if (unit === MomentUnit.DAYS) {
        return Math.floor(differenceInSeconds / (oneMinuteInSeconds * oneMinuteInSeconds * oneDayInHours));
    }
    if (unit === MomentUnit.HOURS) {
        return Math.floor(differenceInSeconds / (oneMinuteInSeconds * oneMinuteInSeconds));
    }
    if (unit === MomentUnit.MINUTES) {
        return Math.floor(differenceInSeconds / oneMinuteInSeconds);
    }
    return Math.floor(differenceInSeconds);
}
