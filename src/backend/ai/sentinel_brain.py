import json
import time
import sys
from typing import Dict, Any, List

# Graceful imports for heavy ML libraries
try:
    import chromadb
    from chromadb.config import Settings
    HAS_CHROMA = True
except ImportError:
    HAS_CHROMA = False

try:
    from langgraph.graph import StateGraph, END
    HAS_LANGGRAPH = True
except ImportError:
    HAS_LANGGRAPH = False

try:
    from langchain_community.llms import Ollama
    HAS_OLLAMA = True
except ImportError:
    HAS_OLLAMA = False

from response_engine import ResponseEngine, LayerHardener
from detection_engine import SigmaEngine, AnomalyDetector, MITREMapper, YaraScanner, KillChainCorrelator

class AttackMemory:
    def __init__(self, persist_directory="./chroma_db"):
        self.enabled = HAS_CHROMA
        if self.enabled:
            try:
                self.client = chromadb.PersistentClient(path=persist_directory)
                self.collection = self.client.get_or_create_collection(name="attack_memory")
            except Exception as e:
                print(json.dumps({"error": f"ChromaDB init failed: {e}"}), flush=True)
                self.enabled = False
                self.memory = []
        else:
            self.memory = []

    def add_incident(self, event_dict: Dict[str, Any]):
        incident_id = str(event_dict.get("id", int(time.time() * 1000)))
        
        if not self.enabled:
            self.memory.append(event_dict)
            return incident_id
        
        text_content = json.dumps(event_dict)
        
        try:
            self.collection.add(
                documents=[text_content],
                metadatas=[{"source": event_dict.get("source", "unknown"), "type": event_dict.get("event_type", "unknown")}],
                ids=[incident_id]
            )
        except Exception as e:
            print(json.dumps({"error": f"ChromaDB add failed: {e}"}), flush=True)
            
        return incident_id

    def find_similar(self, event: Dict[str, Any], threshold: float = 0.85) -> List[Dict[str, Any]]:
        if not self.enabled:
            # Mock similarity for fallback
            similar = []
            # Iterate backwards to get the most recent ones
            for mem in reversed(self.memory):
                if mem.get("event_type") == event.get("event_type") and mem.get("source_ip") == event.get("source_ip"):
                    similar.append(mem)
                    if len(similar) >= 5:
                        break
            return similar
            
        text_content = json.dumps(event)
        try:
            results = self.collection.query(
                query_texts=[text_content],
                n_results=1
            )
            
            similar_incidents = []
            if results and results['distances'] and len(results['distances'][0]) > 0:
                distance = results['distances'][0][0]
                # Convert L2 distance to a rough similarity score (0 to 1)
                similarity = 1.0 / (1.0 + distance)
                if similarity > threshold:
                    doc = results['documents'][0][0]
                    similar_incidents.append(json.loads(doc))
                    
            return similar_incidents
        except Exception as e:
            print(json.dumps({"error": f"ChromaDB query failed: {e}"}), flush=True)
            return []

    def get_response_playbook(self, incident_id: str) -> str:
        return f"Auto-response playbook for {incident_id}: Block IP at firewall, Isolate Host, Clear Temp Files."

class SentinelState(dict):
    pass

class AttackerProfiler:
    def __init__(self, llm=None):
        self.llm = llm

    def generate_profile(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not self.llm:
            return {
                "type": "Methodical",
                "traits": ["Patient", "Likely Insider", "Technical"],
                "description": "Heuristic analysis suggests a methodical attacker targeting specific internal services."
            }
        
        prompt = f"Analyze these attack events and build a psychological profile of the attacker. Events: {events}. Return ONLY a JSON object with 'type', 'traits' (list), and 'description'."
        try:
            res = self.llm.invoke(prompt)
            return json.loads(res)
        except:
            return {
                "type": "Persistent",
                "traits": ["Automated", "Broad Spectrum"],
                "description": "LLM failed to profile. Falling back to persistent automated profile."
            }

class CampaignNamer:
    def __init__(self, llm=None):
        self.llm = llm

    def name_campaign(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not self.llm:
            return {
                "name": "Operation SilentBat",
                "backstory": "A stealthy operation targeting shadow IT services discovered during routine scans."
            }
        
        prompt = f"Based on these attack patterns, generate a cool operation name (e.g. 'Operation X') and a short backstory. Events: {events}. Return ONLY a JSON object with 'name' and 'backstory'."
        try:
            res = self.llm.invoke(prompt)
            return json.loads(res)
        except:
            return {
                "name": "Operation VoidWalker",
                "backstory": "LLM failed to name. Defaulting to VoidWalker protocol."
            }

class SentinelAgent:
    def __init__(self):
        self.memory = AttackMemory()
        self.llm = Ollama(model="phi3") if HAS_OLLAMA else None
        self.response_engine = ResponseEngine()
        self.hardener = LayerHardener()
        self.profiler = AttackerProfiler(self.llm)
        self.namer = CampaignNamer(self.llm)
        self.base_threshold = 0.85
        
        # Detection Engine Layer
        self.sigma = SigmaEngine()
        self.anomaly = AnomalyDetector()
        self.mitre = MITREMapper()
        self.yara = YaraScanner()
        self.correlator = KillChainCorrelator()
        
        if HAS_LANGGRAPH:
            self.graph = self._build_graph()
        else:
            self.graph = None

    def _build_graph(self):
        workflow = StateGraph(SentinelState)
        
        workflow.add_node("analyze", self.analyze)
        workflow.add_node("memory_lookup", self.memory_lookup)
        workflow.add_node("decide_action", self.decide_action)
        workflow.add_node("execute", self.execute)
        workflow.add_node("store_memory", self.store_memory)
        
        workflow.set_entry_point("analyze")
        workflow.add_edge("analyze", "memory_lookup")
        workflow.add_edge("memory_lookup", "decide_action")
        workflow.add_edge("decide_action", "execute")
        workflow.add_edge("execute", "store_memory")
        workflow.add_edge("store_memory", END)
        
        return workflow.compile()

    def analyze(self, state: SentinelState):
        event = state.get("event", {})
        
        # Detection Engine Layer
        sigma_matches = self.sigma.match(event)
        anomaly_result = self.anomaly.process(event)
        mitre_tactic = self.mitre.classify(event)
        kill_chain = self.correlator.add_event(event)
        
        # Yara scan if file path provided
        yara_matches = []
        if "file_path" in event:
            yara_matches = self.yara.scan_file(event["file_path"])
            
        # Psych / Crazy Features
        similar_for_profiling = self.memory.find_similar(event, threshold=0.5)
        attacker_profile = self.profiler.generate_profile(similar_for_profiling + [event])
        campaign = self.namer.name_campaign(similar_for_profiling + [event])
            
        analysis_text = f"Analyzed event {event.get('event_type', 'unknown')} from {event.get('source_ip', 'unknown')}. "
        if sigma_matches:
            analysis_text += f"Sigma Matches: {', '.join(sigma_matches)}. "
        if anomaly_result.get("is_anomaly"):
            analysis_text += f"Anomaly Detected (Score: {anomaly_result.get('score', 0):.2f}). "
        analysis_text += f"MITRE: {mitre_tactic}. "
        if kill_chain.get("chain_detected"):
            analysis_text += f"Kill-Chain: {kill_chain.get('message')}. "
        if yara_matches:
            analysis_text += f"Yara Matches: {', '.join(yara_matches)}. "
            
        state["analysis"] = analysis_text
        state["mitre_tactic"] = mitre_tactic
        state["kill_chain"] = kill_chain
        state["anomaly_result"] = anomaly_result
        state["attacker_profile"] = attacker_profile
        state["campaign"] = campaign
        
        # Check for Layer 1 miss (e.g., if it's a critical alert that wasn't blocked by IPS)
        if event.get("severity") == "Critical" and not event.get("blocked_by_ips", False):
            hardening_result = self.hardener.record_miss(event)
            if hardening_result:
                state["hardening_action"] = hardening_result
                
        return state

    def memory_lookup(self, state: SentinelState):
        event = state.get("event", {})
        # Self-hardening: threshold auto-adjusts based on memory size
        current_threshold = max(0.60, self.base_threshold - (len(self.memory.memory) * 0.01))
        state["current_threshold"] = current_threshold
        
        similar = self.memory.find_similar(event, threshold=current_threshold)
        state["similar_events"] = similar
        if similar:
            state["auto_respond"] = True
            state["playbook"] = self.memory.get_response_playbook(similar[0].get("id", "unknown"))
            state["similarity_score"] = 0.92 # Mock score for demonstration
        else:
            state["auto_respond"] = False
            state["similarity_score"] = 0.0
        return state

    def decide_action(self, state: SentinelState):
        if state.get("auto_respond"):
            state["action"] = "AUTO_REMEDIATE"
            state["reasoning"] = "High similarity (>0.85) to past known attack. Applying proven playbook."
        else:
            if self.llm:
                try:
                    prompt = f"You are SENTINEL, an autonomous cybersecurity agent. Decide action for: {state.get('event')}"
                    state["action"] = "LLM_DECISION"
                    state["reasoning"] = self.llm.invoke(prompt)
                except Exception as e:
                    state["action"] = "MANUAL_REVIEW"
                    state["reasoning"] = f"LLM Error: {e}"
            else:
                state["action"] = "MANUAL_REVIEW"
                state["reasoning"] = "No similar past attacks found. Local LLM (phi3) not available. Escalating to human analyst."
        return state

    def execute(self, state: SentinelState):
        action = state.get("action")
        event = state.get("event", {})
        
        execution_details = []
        
        if action == "AUTO_REMEDIATE" or action == "LLM_DECISION":
            # Extract actions from playbook or reasoning
            text_to_parse = state.get("playbook", "") + " " + state.get("reasoning", "")
            text_to_parse = text_to_parse.lower()
            
            if "block ip" in text_to_parse or "block" in text_to_parse:
                ip = event.get("source_ip", "192.168.1.100")
                res = self.response_engine.block_ip(ip)
                execution_details.append(res)
                
            if "kill process" in text_to_parse or "kill" in text_to_parse:
                pid = event.get("pid", 9999)
                res = self.response_engine.kill_process(pid, "Malicious activity detected")
                execution_details.append(res)
                
            if "isolate" in text_to_parse:
                res = self.response_engine.isolate_network_interface("eth0")
                execution_details.append(res)
                
            if "honeypot" in text_to_parse:
                res = self.response_engine.deploy_honeypot(8080, "http")
                execution_details.append(res)
                
            if "trap" in text_to_parse or "deception" in text_to_parse:
                res = self.response_engine.deception.deploy_trap("honey_file", "/var/www/html")
                execution_details.append(res)
                
            if not execution_details:
                # Default action if none parsed
                res = self.response_engine.block_ip(event.get("source_ip", "unknown"))
                execution_details.append(res)
                
            state["execution_result"] = f"Executed {len(execution_details)} actions."
            state["execution_details"] = execution_details
            
            # Generate Post-Incident Report
            report = f"""# Post-Incident Report: {event.get('id', 'Unknown')}
## Campaign: {state.get('campaign', {}).get('name', 'Operation Unknown')}
> {state.get('campaign', {}).get('backstory', 'No backstory available.')}

## Attacker Profile
- **Type**: {state.get('attacker_profile', {}).get('type', 'Unknown')}
- **Traits**: {', '.join(state.get('attacker_profile', {}).get('traits', []))}
- **Psychological Analysis**: {state.get('attacker_profile', {}).get('description', 'N/A')}

## Summary
Event Type: {event.get('event_type', 'Unknown')}
Source IP: {event.get('source_ip', 'Unknown')}
Severity: {event.get('severity', 'Unknown')}

## Detection Details
- **MITRE ATT&CK**: {state.get('mitre_tactic', 'Unknown')}
- **Anomaly Score**: {state.get('anomaly_result', {}).get('score', 0):.2f} (Is Anomaly: {state.get('anomaly_result', {}).get('is_anomaly', False)})
- **Kill-Chain**: {state.get('kill_chain', {}).get('message', 'None detected')}

## Analysis
{state.get('analysis')}
Similarity Score: {state.get('similarity_score')}
Decision: {state.get('action')}
Reasoning: {state.get('reasoning', state.get('playbook', ''))}

## Actions Taken
"""
            for d in execution_details:
                report += f"- **{d['action']}**: {d['message']} ({d['status']})\n"
                
            if state.get("hardening_action"):
                report += f"\n## Self-Hardening\n{state['hardening_action']['message']}\n```yaml\n{state['hardening_action']['new_sigma_rule']}\n```\n"
                
            state["incident_report"] = report
            
        else:
            state["execution_result"] = "Pending human review or further LLM analysis."
            
        return state

    def store_memory(self, state: SentinelState):
        event = state.get("event", {})
        incident_id = self.memory.add_incident(event)
        state["stored_id"] = incident_id
        return state

    def process_event(self, event: Dict[str, Any]):
        if self.graph:
            try:
                return self.graph.invoke({"event": event})
            except Exception as e:
                print(json.dumps({"error": f"LangGraph execution failed: {e}"}), flush=True)
                return self._fallback_process(event)
        else:
            return self._fallback_process(event)
            
    def _fallback_process(self, event: Dict[str, Any]):
        state = SentinelState({"event": event})
        state = self.analyze(state)
        state = self.memory_lookup(state)
        state = self.decide_action(state)
        state = self.execute(state)
        state = self.store_memory(state)
        return state

if __name__ == "__main__":
    print(json.dumps({"status": "ready", "message": "SENTINEL AI Brain initialized."}), flush=True)
    agent = SentinelAgent()
    
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
            result = agent.process_event(event)
            print(json.dumps({"type": "sentinel_result", "data": result}), flush=True)
        except Exception as e:
            print(json.dumps({"type": "error", "message": str(e)}), flush=True)
