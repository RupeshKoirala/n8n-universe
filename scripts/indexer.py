#!/usr/bin/env python3
"""
n8n Workflow Indexer

Parses n8n workflow JSON files and extracts metadata for the marketplace.
Extracts: triggers, actions, complexity, use cases, tags, descriptions.
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

class N8nIndexer:
    """Index n8n workflow JSON files for marketplace."""

    def __init__(self, workflows_dir: str):
        self.workflows_dir = Path(workflows_dir)
        self.indexed = []

    def index_workflows(self) -> List[Dict[str, Any]]:
        """Index all workflow JSON files in directory."""
        workflow_files = self.workflows_dir.glob("*.json")

        for wf_file in workflow_files:
            try:
                workflow = self._parse_workflow(wf_file)
                if workflow:
                    self.indexed.append(workflow)
                    print(f"✓ Indexed: {wf_file.name}")
            except Exception as e:
                print(f"✗ Error indexing {wf_file.name}: {e}")

        return self.indexed

    def _parse_workflow(self, file_path: Path) -> Dict[str, Any]:
        """Parse individual workflow and extract metadata."""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if 'nodes' not in data:
            return None

        nodes = data['nodes']

        # Extract metadata
        metadata = {
            'id': str(file_path.stem),
            'filename': file_path.name,
            'indexed_at': datetime.now().isoformat(),

            # Workflow info
            'name': data.get('name', file_path.stem),
            'description': data.get('settings', {}).get('executionOrder', '').replace('v1', ''),

            # Complexity
            'node_count': len(nodes),
            'connection_count': len(data.get('connections', {})),
            'complexity': self._calculate_complexity(nodes),

            # Triggers and actions
            'triggers': self._extract_triggers(nodes),
            'actions': self._extract_actions(nodes),
            'integrations': self._extract_integrations(nodes),

            # Categorization
            'tags': self._generate_tags(nodes),
            'category': self._categorize_workflow(nodes),
            'difficulty': self._assess_difficulty(nodes),

            # Status
            'is_active': data.get('active', False),
            'version': data.get('version', 1),

            # File info
            'file_path': str(file_path),
            'file_size': file_path.stat().st_size
        }

        return metadata

    def _calculate_complexity(self, nodes: List[Dict]) -> str:
        """Calculate workflow complexity level."""
        node_count = len(nodes)
        if node_count <= 3:
            return 'simple'
        elif node_count <= 7:
            return 'medium'
        else:
            return 'complex'

    def _extract_triggers(self, nodes: List[Dict]) -> List[str]:
        """Extract trigger node types."""
        trigger_nodes = [
            n for n in nodes
            if n.get('type', '').lower() in [
                'n8n-nodes-base.webhook', 'n8n-nodes-base.cron',
                'n8n-nodes-base.manualTrigger', 'n8n-nodes-base.emailTrigger'
            ]
        ]
        return [n.get('type', '').split('.')[-1] for n in trigger_nodes]

    def _extract_actions(self, nodes: List[Dict]) -> List[str]:
        """Extract action/integration node types."""
        return list(set([
            n.get('type', '').split('.')[-1]
            for n in nodes
            if n.get('type', '').startswith('n8n-nodes-base.')
            and 'trigger' not in n.get('type', '').lower()
        ]))

    def _extract_integrations(self, nodes: List[Dict]) -> List[str]:
        """Extract unique integrations (Slack, Gmail, etc.)."""
        integration_map = {
            'slack': ['slack'],
            'gmail': ['gmail'],
            'notion': ['notion'],
            'google': ['google', 'sheets', 'calendar', 'drive'],
            'openai': ['openai', 'chatgpt', 'gpt'],
            'airtable': ['airtable'],
            'trello': ['trello'],
            'hubspot': ['hubspot'],
            'shopify': ['shopify'],
            'stripe': ['stripe']
        }

        integrations = set()
        node_types = ' '.join([n.get('type', '').lower() for n in nodes])

        for integration, keywords in integration_map.items():
            if any(kw in node_types for kw in keywords):
                integrations.add(integration)

        return list(integrations)

    def _generate_tags(self, nodes: List[Dict]) -> List[str]:
        """Generate tags based on workflow content."""
        tags = []

        # Integration-based tags
        integrations = self._extract_integrations(nodes)
        tags.extend([f"{i}-automation" for i in integrations])

        # Trigger-based tags
        triggers = self._extract_triggers(nodes)
        if 'webhook' in triggers:
            tags.append('webhook-automation')
        if 'cron' in triggers:
            tags.append('scheduled-automation')

        # Complexity tags
        complexity = self._calculate_complexity(nodes)
        tags.append(f'{complexity}-workflow')

        return list(set(tags))

    def _categorize_workflow(self, nodes: List[Dict]) -> str:
        """Categorize workflow by purpose."""
        node_types = ' '.join([n.get('type', '').lower() for n in nodes])

        if 'email' in node_types:
            return 'email-automation'
        elif 'slack' in node_types:
            return 'communication'
        elif 'sheets' in node_types or 'airtable' in node_types:
            return 'data-management'
        elif 'shopify' in node_types or 'stripe' in node_types:
            return 'e-commerce'
        elif 'openai' in node_types or 'chatgpt' in node_types:
            return 'ai-automation'
        else:
            return 'general-automation'

    def _assess_difficulty(self, nodes: List[Dict]) -> str:
        """Assess difficulty for users."""
        node_count = len(nodes)
        if node_count <= 3:
            return 'beginner'
        elif node_count <= 10:
            return 'intermediate'
        else:
            return 'advanced'

    def save_index(self, output_path: str):
        """Save indexed workflows to JSON."""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.indexed, f, indent=2)
        print(f"\n✓ Saved {len(self.indexed)} workflows to {output_path}")


def main():
    """Run indexer."""
    # TODO: Update with actual workflows directory
    workflows_dir = "./workflows"
    output_path = "./src/workflow_index.json"

    indexer = N8nIndexer(workflows_dir)
    indexed = indexer.index_workflows()
    indexer.save_index(output_path)

    print(f"\n📊 Indexing complete:")
    print(f"   Total workflows: {len(indexed)}")
    print(f"   Unique integrations: {len(set(w.get('integrations', []) for w in indexed))}")
    print(f"   Categories: {len(set(w.get('category') for w in indexed))}")


if __name__ == '__main__':
    main()
