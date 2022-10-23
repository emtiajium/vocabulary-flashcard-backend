enum MomentUnit {
    DAYS = 'DAYS',
    HOURS = 'HOURS',
    MINUTES = 'MINUTES',
    SECONDS = 'SECONDS',
}

export default MomentUnit;

export type DateFn = () => Date;

export function makeItOlder(now: Date, unit: MomentUnit, period: number): Date {
    const clonedNow = new Date(now.valueOf());

    const dateMap: Record<MomentUnit, DateFn> = {
        [MomentUnit.DAYS]: () => new Date(clonedNow.setDate(clonedNow.getDate() - period)),
        [MomentUnit.HOURS]: () => new Date(clonedNow.setHours(clonedNow.getHours() - period)),
        [MomentUnit.MINUTES]: () => new Date(clonedNow.setMinutes(clonedNow.getMinutes() - period)),
        [MomentUnit.SECONDS]: () => new Date(clonedNow.setSeconds(clonedNow.getSeconds() - period)),
    };

    return dateMap[unit]();
}

export function makeItNewer(now: Date, unit: MomentUnit, period: number): Date {
    const clonedNow = new Date(now.valueOf());

    const dateMap: Record<MomentUnit, DateFn> = {
        [MomentUnit.DAYS]: () => new Date(clonedNow.setDate(clonedNow.getDate() + period)),
        [MomentUnit.HOURS]: () => new Date(clonedNow.setHours(clonedNow.getHours() + period)),
        [MomentUnit.MINUTES]: () => new Date(clonedNow.setMinutes(clonedNow.getMinutes() + period)),
        [MomentUnit.SECONDS]: () => new Date(clonedNow.setSeconds(clonedNow.getSeconds() + period)),
    };

    return dateMap[unit]();
}

const oneMinuteInSeconds = 60;

const oneDayInHours = 24;

const oneSecondInMilliSeconds = 1000;

export function momentDiff(firstMoment: Date, secondMoment: Date, unit: MomentUnit): number {
    const differenceInSeconds = (firstMoment.getTime() - secondMoment.getTime()) / oneSecondInMilliSeconds;

    const differenceMap: Record<MomentUnit, () => number> = {
        [MomentUnit.DAYS]: () =>
            Math.abs(Math.floor(differenceInSeconds / (oneMinuteInSeconds * oneMinuteInSeconds * oneDayInHours))),
        [MomentUnit.HOURS]: () => Math.abs(Math.floor(differenceInSeconds / (oneMinuteInSeconds * oneMinuteInSeconds))),
        [MomentUnit.MINUTES]: () => Math.abs(Math.floor(differenceInSeconds / oneMinuteInSeconds)),
        [MomentUnit.SECONDS]: () => Math.abs(Math.floor(differenceInSeconds)),
    };

    return differenceMap[unit]();
}

export function getFormattedDate(moment: Date): string {
    const clonedMoment = new Date(moment.valueOf());
    return `${clonedMoment.getFullYear()}-${clonedMoment.getMonth() + 1}-${clonedMoment.getDate()}`;
}

export function getFormattedTomorrow(): string {
    const tomorrow = makeItNewer(new Date(), MomentUnit.DAYS, 1);
    return getFormattedDate(tomorrow);
}

export function delay(second: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, second * oneSecondInMilliSeconds);
    });
}
