import { execSync } from 'child_process';
try {
  console.log(execSync('python3 -m pip install psutil watchdog scapy --break-system-packages').toString());
} catch (e: any) {
  console.error("Error:", e.message);
  if (e.stdout) console.error("Stdout:", e.stdout.toString());
  if (e.stderr) console.error("Stderr:", e.stderr.toString());
}
