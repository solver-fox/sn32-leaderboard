import cron from 'node-cron';
import { ensureSyncConfig, runSyncJob } from '@/lib/sync/runner';

let started = false;
let currentTask: cron.ScheduledTask | null = null;

function scheduleCron(minutes: number) {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }

  const cronExpr = minutes >= 60 ? '0 * * * *' : `*/${minutes} * * * *`;
  currentTask = cron.schedule(cronExpr, () => {
    runSyncJob().catch(console.error);
  });
}

export async function startSyncScheduler() {
  if (started) return;
  started = true;

  const config = await ensureSyncConfig();
  scheduleCron(config.intervalMinutes);
  console.log(`[sync] Scheduled every ${config.intervalMinutes} minutes`);
}

export async function rescheduleSync(minutes: number) {
  scheduleCron(minutes);
}
