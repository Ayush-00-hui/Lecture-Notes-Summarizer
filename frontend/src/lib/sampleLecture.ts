export const SAMPLE_LECTURE_TITLE = "Distributed Systems: Consensus Protocols & The Raft Algorithm";

export const SAMPLE_LECTURE_TEXT = `--- Slide 1: Introduction to Distributed Consensus ---
In distributed computing, consensus is the foundational problem of getting a cluster of autonomous machines to agree on a state machine sequence or single data value despite unreliable networks, packet delays, and node failures.
The FLP Impossibility Theorem (Fischer, Lynch, Paterson, 1985) proves that no deterministic consensus protocol can guarantee both safety and liveness in an asynchronous network if even a single node is subject to unannounced fail-stop crash.
Practically, systems prioritize Safety (never returning an incorrect or split-brain result) over Liveness (guaranteeing immediate progress).

--- Slide 2: The Raft Consensus Algorithm ---
Designed by Ongaro and Ousterhout at Stanford (2014) as an understandable alternative to Paxos, Raft decomposes consensus into three independent sub-problems:
1. Leader Election: A cluster operates with exactly one leader at any given term. Nodes begin in Follower state. If a follower receives no heartbeat before a randomized election timeout (150-300ms) expires, it transitions to Candidate, increments term, votes for itself, and broadcasts RequestVote RPCs.
2. Log Replication: The leader accepts command entries from clients, appends them to its local write-ahead log, and broadcasts AppendEntries RPCs. When an entry is replicated across a strict majority quorum (floor(N/2)+1 nodes), the entry is officially committed.
3. State Safety: Raft enforces the Leader Completeness property: if a log entry is committed in a given term, then that entry will be present in the logs of the leaders for all higher terms.

--- Slide 3: Failure Modes & Quorum Tradeoffs ---
Split-Vote Scenarios: If multiple candidates request votes concurrently, votes may divide evenly, preventing any candidate from achieving a quorum. Raft prevents prolonged split-vote livelock through randomized election timeouts.
Network Partitions: When a network partition divides a 5-node cluster into partitions of 2 and 3 nodes:
- The minority partition (2 nodes) cannot reach quorum and cannot commit client writes.
- The majority partition (3 nodes) elects a new leader and continues committing transactions safely.
- Upon partition healing, minority nodes reconcile their logs against the majority leader, rolling back uncommitted divergent entries.

--- Slide 4: Real-World Applications & Paxos Comparison ---
Raft is now the backbone for metadata replication in modern cloud infrastructure:
- etcd: Kubernetes coordination and configuration store.
- HashiCorp Consul: Service mesh and distributed service discovery.
- Apache Kafka (KRaft mode): Metadata event bus replacing legacy ZooKeeper ensembles.
While Multi-Paxos provides identical theoretical throughput, Raft provides significantly superior operational understandability, deterministic leader failover, and formal correctness proofs.`;
