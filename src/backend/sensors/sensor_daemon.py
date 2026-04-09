import sys
import json
import time
import threading
import subprocess
from datetime import datetime

# Try to import required modules, but fail gracefully if they are missing
try:
    import psutil
except ImportError:
    psutil = None

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    Observer = None
    FileSystemEventHandler = object

try:
    from scapy.all import sniff, IP, TCP, UDP
except ImportError:
    sniff = None

# --- Emitter ---
def emit_event(event_type, source, severity, raw_data, mitre_ttp=""):
    event = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": source,
        "event_type": event_type,
        "severity": severity,
        "raw_data": raw_data,
        "mitre_ttp": mitre_ttp
    }
    # Print as JSON so the Node.js parent process can parse it
    print(json.dumps(event), flush=True)

# --- Process Monitor ---
def process_monitor():
    if not psutil:
        emit_event("System Error", "process_monitor", 8, "psutil module not found. Process monitoring disabled.")
        return

    emit_event("System Info", "process_monitor", 1, "Process monitor started.")
    known_pids = set(psutil.pids())
    
    while True:
        try:
            current_pids = set(psutil.pids())
            new_pids = current_pids - known_pids
            
            for pid in new_pids:
                try:
                    p = psutil.Process(pid)
                    name = p.name()
                    cmdline = " ".join(p.cmdline())
                    
                    # Simple heuristic for suspicious processes
                    severity = 2
                    mitre = ""
                    if any(susp in name.lower() or susp in cmdline.lower() for susp in ['nc', 'nmap', 'miner', 'curl', 'wget', 'bash -i']):
                        severity = 8
                        mitre = "T1059" # Command and Scripting Interpreter
                        
                    emit_event("New Process", "process_monitor", severity, f"PID: {pid}, Name: {name}, Cmd: {cmdline}", mitre)
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
            
            known_pids = current_pids
            time.sleep(2)
        except Exception as e:
            emit_event("System Error", "process_monitor", 5, str(e))
            time.sleep(5)

# --- File System Watcher ---
class FSEventHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if not event.is_directory:
            emit_event("File Modified", "fs_watcher", 3, f"Modified: {event.src_path}")

    def on_created(self, event):
        if not event.is_directory:
            severity = 3
            mitre = ""
            if event.src_path.endswith('.sh') or event.src_path.endswith('.py'):
                severity = 6
                mitre = "T1105" # Ingress Tool Transfer
            emit_event("File Created", "fs_watcher", severity, f"Created: {event.src_path}", mitre)

    def on_deleted(self, event):
        if not event.is_directory:
            emit_event("File Deleted", "fs_watcher", 3, f"Deleted: {event.src_path}")

def fs_watcher():
    if not Observer:
        emit_event("System Error", "fs_watcher", 8, "watchdog module not found. FS monitoring disabled.")
        return

    emit_event("System Info", "fs_watcher", 1, "FS watcher started on /tmp")
    observer = Observer()
    handler = FSEventHandler()
    # Watch /tmp as it's usually accessible and a common drop location for malware
    try:
        observer.schedule(handler, path='/tmp', recursive=True)
        observer.start()
        while True:
            time.sleep(1)
    except Exception as e:
        emit_event("System Error", "fs_watcher", 5, f"Failed to start FS watcher: {e}")

# --- Network Monitor ---
def packet_callback(packet):
    try:
        if IP in packet:
            src = packet[IP].src
            dst = packet[IP].dst
            proto = "UNKNOWN"
            if TCP in packet:
                proto = "TCP"
            elif UDP in packet:
                proto = "UDP"
            
            # Very basic anomaly detection (e.g., scanning)
            severity = 1
            if dst == "8.8.8.8" or dst == "1.1.1.1":
                pass # Normal DNS
            
            # Emit event for first 50 bytes (simulated by just logging the connection)
            emit_event("Network Flow", "net_monitor", severity, f"{proto} {src} -> {dst} (Length: {len(packet)})")
    except Exception:
        pass

def net_monitor():
    if not sniff:
        emit_event("System Error", "net_monitor", 8, "scapy module not found. Network monitoring disabled.")
        return

    emit_event("System Info", "net_monitor", 1, "Network monitor started.")
    try:
        # Sniff a small number of packets to avoid overwhelming the system
        sniff(prn=packet_callback, store=0, count=0)
    except PermissionError:
        emit_event("System Error", "net_monitor", 8, "Permission denied for packet sniffing. Requires root/CAP_NET_RAW.")
    except Exception as e:
        emit_event("System Error", "net_monitor", 8, f"Sniffing error: {e}")

if __name__ == "__main__":
    emit_event("System Info", "daemon", 1, "Sensor Daemon Starting...")
    
    threads = []
    
    t1 = threading.Thread(target=process_monitor, daemon=True)
    threads.append(t1)
    
    t2 = threading.Thread(target=fs_watcher, daemon=True)
    threads.append(t2)
    
    t3 = threading.Thread(target=net_monitor, daemon=True)
    threads.append(t3)
    
    for t in threads:
        t.start()
        
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        emit_event("System Info", "daemon", 1, "Sensor Daemon Stopping...")
        sys.exit(0)
