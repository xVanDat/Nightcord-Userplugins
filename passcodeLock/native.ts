/*
 * Local Windows session-lock bridge for PasscodeLock.
 * Uses Electron's own powerMonitor event; no polling, network access or
 * operating-system configuration changes are performed.
 */

import { type IpcMainInvokeEvent, powerMonitor } from "electron";

type LockWaiter = (detected: boolean) => void;

const waiters = new Map<number, LockWaiter>();
let listenerInstalled = false;

function ensureLockListener() {
    if (listenerInstalled || process.platform !== "win32") return;

    powerMonitor.on("lock-screen", () => {
        for (const resolve of [...waiters.values()]) resolve(true);
    });
    listenerInstalled = true;
}

export function isWindowsLockDetectionSupported() {
    return process.platform === "win32";
}

export function waitForWindowsLock({ sender }: IpcMainInvokeEvent) {
    if (process.platform !== "win32") return Promise.resolve(false);
    ensureLockListener();

    waiters.get(sender.id)?.(false);

    return new Promise<boolean>(resolve => {
        const onDestroyed = () => finish(false);
        const finish: LockWaiter = detected => {
            if (waiters.get(sender.id) !== finish) return;
            waiters.delete(sender.id);
            sender.removeListener("destroyed", onDestroyed);
            resolve(detected);
        };

        waiters.set(sender.id, finish);
        sender.once("destroyed", onDestroyed);
    });
}

export function cancelWindowsLockWait({ sender }: IpcMainInvokeEvent) {
    waiters.get(sender.id)?.(false);
}
