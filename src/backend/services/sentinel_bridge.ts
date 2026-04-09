import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SentinelBridge extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  private isReady = false;
  private history: any[] = [];

  start() {
    console.log("Initializing SENTINEL AI Brain...");
    
    try {
      console.log("Checking Sentinel Python dependencies...");
      import('child_process').then(({ exec }) => {
         const installCmd = 'pip install scikit-learn PyYAML --break-system-packages || pip install scikit-learn PyYAML || python3 -m pip install scikit-learn PyYAML --break-system-packages || python3 -m pip install scikit-learn PyYAML || python -m pip install scikit-learn PyYAML';
         exec(installCmd, (error, stdout, stderr) => {
           if (error) {
             console.warn(`[SENTINEL DEPS] Installation warning: ${error.message}`);
           } else {
             console.log("Sentinel Python dependencies check complete.");
           }
         });
      }).catch(() => {});
    } catch (e) {
      console.log("Failed to initiate Sentinel Python dependencies check.");
    }
    
    const scriptPath = path.join(__dirname, '../ai/sentinel_brain.py');
    
    const spawnPython = (command: string) => {
      this.pythonProcess = spawn(command, [scriptPath]);

      this.pythonProcess.on('error', (err: any) => {
        if (err.code === 'ENOENT') {
          if (command === 'python3') {
            console.log("python3 not found, trying python...");
            spawnPython('python');
          } else {
            console.error("Neither python3 nor python found. SENTINEL AI Brain will not start.");
          }
        } else {
          console.error(`Failed to start SENTINEL AI Brain: ${err.message}`);
        }
      });

      let buffer = '';
      this.pythonProcess.stdout?.on('data', (data) => {
        buffer += data.toString();
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          
          if (!line) continue;
          
          try {
            const msg = JSON.parse(line);
            if (msg.status === 'ready') {
              this.isReady = true;
              console.log(`[SENTINEL] ${msg.message}`);
            } else if (msg.type === 'sentinel_result') {
              this.history.unshift({
                timestamp: new Date().toISOString(),
                ...msg.data
              });
              // Keep only last 50
              if (this.history.length > 50) this.history.pop();
              
              this.emit('result', msg.data);
            } else if (msg.error) {
              console.error(`[SENTINEL ERROR] ${msg.error}`);
            } else {
              console.log(`[SENTINEL RAW] ${line}`);
            }
          } catch (e) {
            console.log(`[SENTINEL OUTPUT] ${line}`);
          }
        }
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        console.error(`[SENTINEL STDERR] ${data.toString()}`);
      });

      this.pythonProcess.on('close', (code) => {
        if (code !== null) {
          console.log(`SENTINEL AI Brain exited with code ${code}`);
          this.isReady = false;
          // Restart after 5 seconds
          setTimeout(() => this.start(), 5000);
        }
      });
    };

    spawnPython('python3');
  }

  processEvent(event: any) {
    if (!this.isReady || !this.pythonProcess) {
      console.warn("SENTINEL is not ready to process events.");
      return;
    }
    this.pythonProcess.stdin?.write(JSON.stringify(event) + '\n');
  }

  getHistory() {
    return this.history;
  }
}

export const sentinelBridge = new SentinelBridge();
