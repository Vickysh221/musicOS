"""
Global node registry for Sonic Cartography vault.

Rule: a song by an artist is ONE permanent node. Before creating a node,
call node_exists(). If it exists, use put_node(node, enrich=True) to add
data — never create a duplicate.

Different versions of the same song share the same node UNLESS a version
has distinct historical significance as a separate cultural artifact.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from coverage import compute_coverage

NODES_DIR = Path(__file__).parent.parent / 'data' / 'nodes'


def node_exists(node_id: str) -> bool:
    return (NODES_DIR / f"{node_id}.json").exists()


def get_node(node_id: str) -> dict:
    path = NODES_DIR / f"{node_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Node not found in registry: {node_id}")
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def put_node(node: dict, enrich: bool = False) -> bool:
    """
    Save node to registry.
    Returns True if node was newly created, False if it already existed (enrich case).
    Raises ValueError if node exists and enrich=False.
    When enrich=True: merges narrative_slots (fills empty slots only) and sources (deduplicates).
    """
    if 'id' not in node:
        raise ValueError("Node must have an 'id' field")
    node_id = node['id']
    path = NODES_DIR / f"{node_id}.json"
    is_new = not path.exists()

    if not is_new and not enrich:
        raise ValueError(
            f"Node '{node_id}' already exists in registry. "
            "Use put_node(node, enrich=True) to add data without duplication."
        )

    if not is_new and enrich:
        existing = get_node(node_id)
        existing_slots = existing.setdefault('narrative_slots', {})
        for slot, value in node.get('narrative_slots', {}).items():
            if value and not existing_slots.get(slot):
                existing_slots[slot] = value
        existing['sources'] = list(dict.fromkeys(
            existing.get('sources', []) + node.get('sources', [])
        ))
        node = existing

    NODES_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(node, f, ensure_ascii=False, indent=2)
    return is_new


def list_all_node_ids() -> list:
    if not NODES_DIR.exists():
        return []
    return [p.stem for p in sorted(NODES_DIR.glob('*.json'))]


def update_coverage_for_node(node_id: str, tracks: list) -> dict:
    """Recompute and persist coverage for a single node."""
    node = get_node(node_id)
    node['user_coverage'] = compute_coverage(node, tracks)
    with open(NODES_DIR / f"{node_id}.json", 'w', encoding='utf-8') as f:
        json.dump(node, f, ensure_ascii=False, indent=2)
    return node['user_coverage']


def update_all_coverage(tracks: list):
    """Recompute coverage for every node in the registry."""
    node_ids = list_all_node_ids()
    for node_id in node_ids:
        update_coverage_for_node(node_id, tracks)
    print(f"Updated coverage for {len(node_ids)} nodes.")


def resolve_map(map_data: dict) -> dict:
    """
    Returns a copy of map_data with node_ids dereferenced into full node objects.
    Useful for playlist generation and self-checks.
    """
    resolved = dict(map_data)
    resolved['nodes'] = [get_node(nid) for nid in map_data.get('node_ids', [])]
    return resolved


if __name__ == '__main__':
    print("Registry nodes:", list_all_node_ids())
