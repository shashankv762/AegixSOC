import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { systemService } from './system_service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sensorBridge = {
  start: () => {
    console.log("Initializing Python Sensor Daemon...");
    
    // Attempt to install dependencies
    try {
      console.log("Checking Python dependencies...");
      const installCmd = 'pip install psutil watchdog scapy --break-system-packages || pip install psutil watchdog scapy || python3 -m pip install psutil watchdog scapy --break-system-packages || python3 -m pip install psutil watchdog scapy || python -m pip install psutil watchdog scapy';
      execSync(installCmd, { stdio: 'ignore' });
      console.log("Python dependencies check complete.");
    } catch (e) {
      console.log("Failed to install Python dependencies. Daemon will run with degraded features.");
    }

    const scriptPath = path.join(__dirname, '../sensors/sensor_daemon.py');
    
    // Attempt to spawn with python3, fallback to python
    const spawnPython = (command: string) => {
      const pythonProcess = spawn(command, [scriptPath]);

      pythonProcess.on('error', (err: any) => {
        if (err.code === 'ENOENT') {
          if (command === 'python3') {
            console.log("python3 not found, trying python...");
            spawnPython('python');
          } else {
            console.error("Neither python3 nor python found. Sensor Daemon will not start.");
          }
        } else {
          console.error(`Failed to start Python Sensor Daemon: ${err.message}`);
        }
      });

      let buffer = '';
      pythonProcess.stdout?.on('data', async (data) => {
        buffer += data.toString();
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          
          if (!line) continue;
          
          try {
            const event = JSON.parse(line);
            
            // Map Python sensor events to our systemService format
            if (event.event_type === 'New Process') {
              await systemService.processData({
                type: 'process',
                details: {
                  pid: parseInt(event.raw_data.match(/PID: (\d+)/)?.[1] || '0'),
                  name: event.raw_data.match(/Name: ([^,]+)/)?.[1] || 'Unknown',
                  cpu_percent: 0,
                  memory_usage: 0,
                  exe_path: event.raw_data.match(/Cmd: (.*)/)?.[1] || '',
                  status: 'Running'
                },
                risk_score: event.severity / 10,
                flagged: event.severity >= 7
              });
            } else if (event.event_type === 'Network Flow') {
              // Very basic mapping
              const match = event.raw_data.match(/([A-Z]+) ([\d\.]+) -> ([\d\.]+)/);
              if (match) {
                 await systemService.processData({
                  type: 'network',
                  details: {
                    local_address: match[2],
                    remote_address: match[3],
                    status: match[1],
                    pid: 0
                  },
                  risk_score: event.severity / 10,
                  flagged: event.severity >= 7
                });
              }
            } else if (event.event_type === 'File Created' || event.event_type === 'File Modified') {
               // We can log this as a special process or alert
               if (event.severity >= 6) {
                 await systemService.processData({
                    type: 'process',
                    details: {
                      pid: 0,
                      name: 'fs_watcher',
                      cpu_percent: 0,
                      memory_usage: 0,
                      exe_path: event.raw_data,
                      status: 'File Event'
                    },
                    risk_score: event.severity / 10,
                    flagged: true
                 });
               }
            }
            
            // Also log to console for debugging
            if (event.severity >= 5) {
              console.log(`[SENSOR] ${event.event_type}: ${event.raw_data} (Severity: ${event.severity})`);
            }
          } catch (e) {
            // Not JSON or parse error
            console.log(`[SENSOR RAW] ${line}`);
          }
        }
      });

      pythonProcess.stderr?.on('data', (data) => {
        console.error(`[SENSOR ERROR] ${data.toString()}`);
      });

      pythonProcess.on('close', (code) => {
        if (code !== null) {
          console.log(`Python Sensor Daemon exited with code ${code}`);
          // Restart after 5 seconds
          setTimeout(sensorBridge.start, 5000);
        }
      });
    };

    spawnPython('python3');
  }
};
