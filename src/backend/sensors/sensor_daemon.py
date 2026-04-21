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

import os
import sys

# Suppress scapy warnings and errors from polluting stdout
os.environ["scapy_suppress_warnings"] = "1"
import logging
logging.getLogger("scapy.runtime").setLevel(logging.ERROR)

try:
    # Redirect stderr temporarily to catch scapy load errors
    old_stderr = sys.stderr
    with open(os.devnull, 'w') as f:
        sys.stderr = f
        from scapy.all import sniff, IP, TCP, UDP
    sys.stderr = old_stderr
except Exception as e:
    sys.stderr = old_stderr
    sniff = None
    print(json.dumps({"event_type": "System Warning", "source": "network_monitor", "severity": 3, "raw_data": f"scapy module failed to load: {e}. Network monitoring disabled."}), flush=True)

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
    def check_critical(self, file_path):
        is_critical = any(file_path.startswith(d) for d in ['/etc/', '/bin/', '/sbin/'])
        is_suspicious_ext = file_path.endswith('.sh') or file_path.endswith('.py') or file_path.endswith('.exe') or file_path.endswith('.bin') or file_path.endswith('.elf')
        
        severity = 3
        mitre = ""
        
        if is_suspicious_ext:
            severity = 6
            mitre = "T1105" # Ingress Tool Transfer
            
        if is_critical:
            severity = max(severity, 8)
            mitre = "T1543" # Create or Modify System Process
            
        if is_critical and is_suspicious_ext:
            severity = 10
            
        return severity, mitre

    def on_modified(self, event):
        if not event.is_directory:
            severity, mitre = self.check_critical(event.src_path)
            emit_event("File Modified", "fs_watcher", severity, f"Modified: {event.src_path}", mitre)

    def on_created(self, event):
        if not event.is_directory:
            severity, mitre = self.check_critical(event.src_path)
            # Increase severity slightly for creation of files in these areas
            if severity >= 8:
                severity = min(10, severity + 1)
            emit_event("File Created", "fs_watcher", severity, f"Created: {event.src_path}", mitre)

    def on_deleted(self, event):
        if not event.is_directory:
            severity, mitre = self.check_critical(event.src_path)
            emit_event("File Deleted", "fs_watcher", severity, f"Deleted: {event.src_path}", mitre)

def fs_watcher():
    if not Observer:
        emit_event("System Error", "fs_watcher", 8, "watchdog module not found. FS monitoring disabled.")
        return

    directories = ['/tmp', '/etc', '/bin', '/sbin']
    emit_event("System Info", "fs_watcher", 1, f"FS watcher starting on directories: {', '.join(directories)}")
    
    observer = Observer()
    handler = FSEventHandler()
    
    for directory in directories:
        try:
            if os.path.exists(directory):
                observer.schedule(handler, path=directory, recursive=True)
            else:
                emit_event("System Warning", "fs_watcher", 3, f"Directory not found for monitoring: {directory}")
        except PermissionError:
            emit_event("System Warning", "fs_watcher", 5, f"Permission denied to monitor: {directory}")
        except Exception as e:
            emit_event("System Error", "fs_watcher", 5, f"Failed to start FS watcher on {directory}: {e}")

    try:
        observer.start()
        while True:
            time.sleep(1)
    except Exception as e:
        emit_event("System Error", "fs_watcher", 5, f"FS watcher runtime error: {e}")

# --- Network Monitor ---
def packet_callback(packet):
    try:
        if IP in packet:
            src = packet[IP].src
            dst = packet[IP].dst
            proto = "UNKNOWN"
            sport = 0
            dport = 0
            
            if TCP in packet:
                proto = "TCP"
                sport = packet[TCP].sport
                dport = packet[TCP].dport
            elif UDP in packet:
                proto = "UDP"
                sport = packet[UDP].sport
                dport = packet[UDP].dport
            
            # Initial baseline
            severity = 1
            mitre = ""
            
            # Identify suspicious or unusual ports
            suspicious_ports = [4444, 1337, 31337, 6667, 4445, 12345, 5555, 3389, 445]
            if dport in suspicious_ports or sport in suspicious_ports:
                severity = 8
                mitre = "T1043" # Commonly Used Port / Command and Control
            
            # Ignore standard HTTP/HTTPS/DNS traffic to avoid noise, unless it's a known bad IP
            # For demonstration, assume 185.x or 193.x are flagged IPs (hypothetical blocklist)
            if dst.startswith("185.") or dst.startswith("193."):
                severity = 9
                mitre = "T1071" # Application Layer Protocol (C2)
            
            if severity >= 8:
                emit_event("Network Flow", "net_monitor", severity, f"{proto} {src}:{sport} -> {dst}:{dport} (Length: {len(packet)})", mitre)
            elif dst not in ["8.8.8.8", "1.1.1.1"] and (sport not in [80, 443, 53] and dport not in [80, 443, 53]):
                # Sample random traffic at a low severity
                emit_event("Network Flow", "net_monitor", severity, f"{proto} {src}:{sport} -> {dst}:{dport} (Length: {len(packet)})", mitre)
    except Exception:
        pass

def net_monitor():
    if not sniff:
        emit_event("System Warning", "net_monitor", 3, "scapy module not found. Network monitoring disabled.")
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
