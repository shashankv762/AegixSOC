import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AegixBridge extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  public isReady = false;
  private history: any[] = [];

  start() {
    console.log("Initializing AEGIX AI Brain...");
    
    const scriptPath = path.join(__dirname, '../ai/aegix_brain.py');
    
    const spawnPython = (command: string) => {
      this.pythonProcess = spawn(command, [scriptPath], {
        env: {
            ...process.env,
            GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
        }
      });

      this.pythonProcess.on('error', (err: any) => {
        if (err.code === 'ENOENT') {
          if (command === 'python3') {
            console.log("python3 not found, trying python...");
            spawnPython('python');
          } else {
            console.error("Neither python3 nor python found. AEGIX AI Brain will not start.");
          }
        } else {
          console.error(`Failed to start AEGIX AI Brain: ${err.message}`);
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
              console.log(`[AEGIX] ${msg.message}`);
            } else if (msg.type === 'sentinel_result' || msg.type === 'aegix_result') {
              this.history.unshift({
                timestamp: new Date().toISOString(),
                ...msg.data
              });
              // Keep only last 50
              if (this.history.length > 50) this.history.pop();
              
              // Process Autonomous Actions from the Brain
              const action = msg.data.action;
              const executions = msg.data.execution_details || [];
              const eventSeverity = msg.data.event?.severity;
              const tiResult = msg.data.ti_result;
              const sourceIp = msg.data.event?.source_ip;
              const logId = msg.data.event?.id || msg.data.event?.log_id;
              
              if (logId && msg.data.mitre_tactic) {
                  import('../database.js').then(({ db }) => {
                      db.prepare("UPDATE logs SET mitre_tactic = ? WHERE id = ?").run(msg.data.mitre_tactic, logId);
                  }).catch(e => console.error("Failed to update mitre tactic", e));
              }
              
              // Auto-block based on Threat Intel
              if (tiResult?.malicious && sourceIp) {
                  import('./ips_service.js').then(({ ipsService }) => {
                      const blockReason = `[Auto-TI Block] Flagged as malicious by OSINT feed (${tiResult.source}).`;
                      ipsService.blockIp(sourceIp, blockReason, 24); // Default 24 hour block
                      console.log(`[THREAT INTEL] Auto-blocked malicious IP: ${sourceIp}`);
                  }).catch(e => console.error("Failed to dynamically import ipsService:", e));
              }
              
              if (eventSeverity === 'Critical') {
                  import('./alert_service.js').then(({ alertService }) => {
                     // Fire automatic high severity alert since Aegix Python identified it
                     let reason = `[Aegix Brain Critical] AI evaluated multi-layered threat path over threshold. ${msg.data.reasoning || ''}`;
                     
                     if (tiResult?.malicious) {
                         reason = `[Threat Intel Hit] ${tiResult.source} flags IP as highly malicious. ${msg.data.reasoning || ''}`;
                     } else if (msg.data.kill_chain?.confidence === 'Critical') {
                         reason = `[Kill-Chain Detected] ${msg.data.kill_chain.message}`;
                     } else if (msg.data.analysis && msg.data.analysis.includes("evil.exe")) {
                         reason = `[Sigma Rule Trigger] Critical process interaction (evil.exe) detected.`;
                     }
                        
                     alertService.createAlert({
                        log_id: msg.data.event?.id || Math.floor(Math.random() * 1000000),
                        severity: "Critical",
                        reason: reason,
                        score: msg.data.dl_threat_score || 0.95,
                        mitigations: `Action taken by AI: ${action}`
                     }, true); // skipAegix to prevent infinity loop
                  }).catch(e => console.error("Failed to dynamically import alertService:", e));
              }

              if (action && action !== "MANUAL_REVIEW" && action !== "IGNORE" && action !== "LLM_DECISION") {
                const sourceIp = msg.data.event?.source_ip;
                const reasoning = msg.data.reasoning || "Autonomous Aegix RL Response";
                
                // Handle Specialized Playbook Defences
                if (action.includes("DATA_FORTRESS") || action.includes("RANSOMWARE") || action.includes("FORENSIC")) {
                    import('./alert_service.js').then(({ alertService }) => {
                       alertService.createAlert({
                          log_id: msg.data.event?.id || Math.floor(Math.random() * 1000000),
                          severity: "Critical",
                          reason: `[SCORCHED EARTH LAYER] Protocol: ${action}`,
                          score: 0.99,
                          mitigations: `Aegix activated Last Resort Protocol. ${msg.data.reasoning || 'Encrypted files shifted to vault, memory dumped to forensics dir, network isolated.'}`
                       }, true);
                       console.log(`[AEGIX SCORCHED EARTH] ${action} triggered.`);
                    });
                }
                
                // Handle Specialized Playbook Defences
                if (action.includes("DATA_FORTRESS") || action.includes("RANSOMWARE") || action.includes("FORENSIC")) {
                    import('./alert_service.js').then(({ alertService }) => {
                       alertService.createAlert({
                          log_id: msg.data.event?.id || Math.floor(Math.random() * 1000000),
                          severity: "Critical",
                          reason: `[SCORCHED EARTH LAYER] Protocol: ${action}`,
                          score: 0.99,
                          mitigations: `Aegix activated Last Resort Protocol. ${msg.data.reasoning || 'Encrypted files shifted to vault, memory dumped to forensics dir, network isolated.'}`
                       }, true);
                       console.log(`[AEGIX SCORCHED EARTH] ${action} triggered.`);
                    });
                }
                
                // Handle Deceptions
                if (action.includes("HONEYPOT") || action.includes("CREDENTIALS") || action.includes("HONEYPOT_TRIGGER")) {
                    import('./alert_service.js').then(({ alertService }) => {
                       alertService.createAlert({
                          log_id: msg.data.event?.id || Math.floor(Math.random() * 1000000),
                          severity: "High",
                          reason: `[Deception Deployed] ${action}. ${msg.data.reasoning}`,
                          score: 0.95,
                          mitigations: `Aegix Brain advanced mimicry layer triggered. Fingerprint analysis complete. The system automatically isolated attacker IP and mapped the vector.`
                       }, true); // skipAegix to prevent infinity loop
                       console.log(`[AEGIX AUTO-RESPONSE] ${action} detailed response generated.`);
                    });
                }

                // Handle Sub-Agents
                const multiAgentSpawn = executions.find((e: any) => e.action === "MULTI_AGENT_SPAWN");
                if (multiAgentSpawn) {
                    import('./alert_service.js').then(({ alertService }) => {
                       alertService.createAlert({
                          log_id: msg.data.event?.id || Math.floor(Math.random() * 1000000),
                          severity: "High",
                          reason: `[Aegix Orchestration] Core spawning specialised defense sub-Agents.`,
                          score: 0.90,
                          mitigations: multiAgentSpawn.message
                       }, true);
                       console.log(`[AEGIX ORCHESTRATION] Sub-Agents deployed for Multi-Agent execution.`);
                    });
                }
                
                if (sourceIp) {
                  import('./ips_service.js').then(({ ipsService }) => {
                    if (action === "BLOCK_IP") {
                      ipsService.blockIp(sourceIp, `[RL Brain] ${reasoning}`, 1); // 1 hr block
                      console.log(`[AEGIX AUTO-RESPONSE] Blocked IP: ${sourceIp}`);
                    } else if (action === "ISOLATE_ENDPOINT") {
                      ipsService.blockIp(sourceIp, `[RL Brain] Endpoint Isolation: ${reasoning}`, 24); // 24 hr block
                      console.log(`[AEGIX AUTO-RESPONSE] Isolated Endpoint IP: ${sourceIp}`);
                    }
                  }).catch(e => console.error("Failed to dynamically import ipsService:", e));
                }
              }
              
              // Handle autonomous Sigma rule generation (Layer Hardening)
              if (msg.data.hardening_action) {
                  import('./alert_service.js').then(({ alertService }) => {
                     alertService.createAlert({
                        log_id: msg.data.event?.id || Math.floor(Math.random() * 1000000),
                        severity: "High",
                        reason: `[Auto-Hardening] System generated autonomous detection rule.`,
                        score: 0.90,
                        mitigations: `Aegix detected repeated IPS misses and generated new Sigma Rules. Details: ${msg.data.hardening_action.message}`
                     }, true);
                     console.log(`[AEGIX AUTO-HARDENING] Dynamic Sigma rules configured.`);
                  });
              }

              this.emit('result', msg.data);
            } else if (msg.error) {
              console.error(`[AEGIX ERROR] ${msg.error}`);
            } else if (msg.status === 'warning') {
              console.warn(`[AEGIX WARNING] ${msg.message}`);
            } else {
              console.log(`[AEGIX RAW] ${line}`);
            }
          } catch (e) {
            console.log(`[AEGIX OUTPUT] ${line}`);
          }
        }
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        console.error(`[AEGIX STDERR] ${data.toString()}`);
      });

      this.pythonProcess.on('close', (code) => {
        if (code !== null) {
          console.log(`AEGIX AI Brain exited with code ${code}`);
          this.isReady = false;
          // Restart after 5 seconds
          setTimeout(() => this.start(), 5000);
        }
      });
    };

    try {
      console.log("Checking Aegix Python dependencies...");
      import('child_process').then(({ exec }) => {
         const installCmd = 'python3 -m pip install --no-cache-dir scikit-learn PyYAML transformers stable-baselines3 gymnasium torch google-genai --extra-index-url https://download.pytorch.org/whl/cpu --break-system-packages || (wget -qO- https://bootstrap.pypa.io/get-pip.py | python3 - --break-system-packages && python3 -m pip install --no-cache-dir scikit-learn PyYAML transformers stable-baselines3 gymnasium torch google-genai --extra-index-url https://download.pytorch.org/whl/cpu --break-system-packages)';
         exec(installCmd, (error, stdout, stderr) => {
           if (error) {
             console.warn(`[AEGIX DEPS] Installation warning: ${error.message}`);
           } else {
             console.log("Aegix Python dependencies check complete.");
           }
           // Start python process after dependencies are checked/installed
           spawnPython('python3');
         });
      }).catch(() => {
        // Fallback if import fails
        spawnPython('python3');
      });
    } catch (e) {
      console.log("Failed to initiate Aegix Python dependencies check.");
      spawnPython('python3');
    }
  }

  processEvent(event: any) {
    if (!this.isReady || !this.pythonProcess) {
      console.warn("AEGIX is not ready to process events.");
      return;
    }
    this.pythonProcess.stdin?.write(JSON.stringify(event) + '\n');
  }

  getHistory() {
    return this.history;
  }
}

export const aegixBridge = new AegixBridge();
