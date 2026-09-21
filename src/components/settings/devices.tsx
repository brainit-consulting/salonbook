"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  revokeDeviceAction,
  signOutEverywhereElseAction,
} from "@/app/(owner)/settings/security/actions";
import { CONTROL_HEIGHT, FormNote, type Note } from "./field";
import type { SettingsResult } from "./result";

export type Device = {
  id: string;
  name: string;
  ip: string | null;
  started: string;
  current: boolean;
};

export function Devices({ devices }: { devices: Device[] }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<Note>(null);
  const others = devices.filter((d) => !d.current);

  function run(work: () => Promise<SettingsResult>, done: string) {
    startTransition(async () => {
      const result = await work();
      setNote(result.ok ? { kind: "done", text: done } : { kind: "problem", text: result.error });
    });
  }

  return (
    <div className="grid gap-4">
      <ul className="border-t">
        {devices.map((device) => (
          <li
            key={device.id}
            className="flex flex-col gap-2 border-b py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-semibold">
                {device.name}
                {device.current ? <span className="font-normal"> · This device</span> : null}
              </p>
              <p className="figures text-sm text-muted-foreground">
                {device.ip ?? "No address kept"} · since {device.started}
              </p>
            </div>
            {device.current ? null : (
              <Button
                type="button"
                variant="outline"
                className={CONTROL_HEIGHT}
                disabled={pending}
                onClick={() =>
                  run(() => revokeDeviceAction(device.id), `${device.name} has been signed out.`)
                }
              >
                Revoke
              </Button>
            )}
          </li>
        ))}
      </ul>

      {others.length === 0 ? (
        <p className="max-w-[62ch] text-muted-foreground">
          You are signed in on this device only. Sign in on another phone or computer and it
          will be listed here.
        </p>
      ) : (
        <div>
          <Button
            type="button"
            variant="outline"
            className={CONTROL_HEIGHT}
            disabled={pending}
            onClick={() =>
              run(signOutEverywhereElseAction, "Every other device has been signed out.")
            }
          >
            Sign out everywhere else
          </Button>
        </div>
      )}
      <FormNote note={note} />
    </div>
  );
}
