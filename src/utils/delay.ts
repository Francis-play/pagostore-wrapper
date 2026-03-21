export function humanDelay() {
    const min = 1000;
    const max = 1400;
    const time = Math.random() * (max - min) + min;
    return new Promise(res => setTimeout(res, time));
}