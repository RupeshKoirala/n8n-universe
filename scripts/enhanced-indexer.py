#!/usr/bin/env python3
"""
Enhanced n8n Workflow Indexer

Features:
- Parses n8n workflow JSON files
- Extracts comprehensive metadata
- Generates OpenAI embeddings for semantic search
- Outputs Supabase-compatible SQL
- Handles 25,000+ workflows efficiently
"""

import json
import os
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
import hashlib

# Optional: OpenAI for embeddings (requires API key)
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠ OpenAI not available. Install with: pip install openai")


@dataclass
class WorkflowMetadata:
    """Structured workflow metadata for database storage."""
    id: str
    name: str
    description: str
    category: str
    tags: List[str]
    complexity: str  # beginner, intermediate, advanced, expert
    nodes_count: int
    file_path: str
    file_size: int
    price: float
    created_at: str
    updated_at: str
    embedding: Optional[List[float]] = None


class EnhancedN8nIndexer:
    """Enhanced indexer for n8n workflows with embedding support."""

    # Node type categories
    TRIGGER_NODES = {
        'n8n-nodes-base.webhook', 'n8n-nodes-base.cron',
        'n8n-nodes-base.manualTrigger', 'n8n-nodes-base.emailTrigger',
        'n8n-nodes-base.rabbitmqTrigger', 'n8n-nodes-base.kafkaTrigger'
    }

    # Category mappings
    CATEGORY_MAP = {
        'email-automation': ['email', 'gmail', 'outlook', 'mailgun', 'sendgrid'],
        'communication': ['slack', 'discord', 'telegram', 'whatsapp', 'teams'],
        'data-management': ['sheets', 'airtable', 'notion', 'mysql', 'postgres', 'mongodb'],
        'e-commerce': ['shopify', 'woocommerce', 'stripe', 'square', 'magento'],
        'ai-automation': ['openai', 'chatgpt', 'gpt', 'anthropic', 'claude', 'huggingface'],
        'social-media': ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok'],
        'crm': ['hubspot', 'salesforce', 'pipedrive', 'zoho'],
        'productivity': ['todoist', 'trello', 'asana', 'notion', 'monday'],
        'web-scraping': ['http', 'scrape', 'puppeteer', 'playwright'],
        'general-automation': []
    }

    # Integration patterns
    INTEGRATION_PATTERNS = {
        'slack': ['slack'],
        'gmail': ['gmail'],
        'notion': ['notion'],
        'google-sheets': ['sheets', 'google'],
        'google-calendar': ['calendar', 'google'],
        'google-drive': ['drive', 'google'],
        'openai': ['openai', 'chatgpt', 'gpt'],
        'airtable': ['airtable'],
        'trello': ['trello'],
        'hubspot': ['hubspot'],
        'shopify': ['shopify'],
        'stripe': ['stripe'],
        'salesforce': ['salesforce'],
        'todoist': ['todoist'],
        'asana': ['asana'],
        'twitter': ['twitter', 'x'],
        'linkedin': ['linkedin'],
        'mailgun': ['mailgun'],
        'sendgrid': ['sendgrid']
    }

    def __init__(self, workflows_dir: str, openai_api_key: Optional[str] = None):
        self.workflows_dir = Path(workflows_dir)
        self.openai_client = None

        if OPENAI_AVAILABLE and openai_api_key:
            self.openai_client = OpenAI(api_key=openai_api_key)
            print("✓ OpenAI embeddings enabled")
        else:
            print("⚠ Running without embeddings")

        self.indexed: List[WorkflowMetadata] = []
        self.stats = {
            'total': 0,
            'successful': 0,
            'errors': 0,
            'categories': {},
            'complexities': {}
        }

    def index_directory(self) -> List[WorkflowMetadata]:
        """Index all workflow JSON files in directory (recursive)."""
        print(f"\n🔍 Scanning {self.workflows_dir}...")

        # Find all JSON files recursively
        workflow_files = list(self.workflows_dir.rglob("*.json"))
        total_files = len(workflow_files)

        print(f"📁 Found {total_files} workflow files")

        for idx, wf_file in enumerate(workflow_files, 1):
            try:
                workflow = self._parse_workflow(wf_file)
                if workflow:
                    self.indexed.append(workflow)
                    self.stats['successful'] += 1

                    # Track stats
                    cat = workflow.category
                    self.stats['categories'][cat] = self.stats['categories'].get(cat, 0) + 1
                    self.stats['complexities'][workflow.complexity] = \
                        self.stats['complexities'].get(workflow.complexity, 0) + 1

                    # Progress indicator
                    if idx % 100 == 0:
                        print(f"  Progress: {idx}/{total_files} ({idx/total_files:.1%})")

            except Exception as e:
                self.stats['errors'] += 1
                print(f"✗ Error indexing {wf_file.name}: {str(e)[:100]}")

            self.stats['total'] += 1

        return self.indexed

    def _parse_workflow(self, file_path: Path) -> Optional[WorkflowMetadata]:
        """Parse individual workflow and extract metadata."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if 'nodes' not in data:
                return None

            nodes = data['nodes']
            node_count = len(nodes)

            # Generate ID from file path hash
            workflow_id = hashlib.md5(str(file_path).encode()).hexdigest()[:16]

            # Extract name
            name = data.get('name', file_path.stem)

            # Generate description
            description = self._generate_description(data, nodes)

            # Categorize
            category = self._categorize_workflow(nodes, name)

            # Extract tags
            tags = self._generate_tags(nodes, category)

            # Calculate complexity
            complexity = self._calculate_complexity(nodes)

            # Determine price based on complexity
            price = self._calculate_price(complexity, node_count)

            # Generate embedding if OpenAI is available
            embedding = None
            if self.openai_client:
                embedding = self._generate_embedding(name, description, tags)

            return WorkflowMetadata(
                id=workflow_id,
                name=name,
                description=description,
                category=category,
                tags=tags,
                complexity=complexity,
                nodes_count=node_count,
                file_path=str(file_path),
                file_size=file_path.stat().st_size,
                price=price,
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                embedding=embedding
            )

        except json.JSONDecodeError:
            return None
        except Exception:
            return None

    def _generate_description(self, data: Dict, nodes: List[Dict]) -> str:
        """Generate a human-readable description."""
        triggers = self._extract_triggers(nodes)
        integrations = self._extract_integrations(nodes)

        if not triggers:
            trigger_desc = "Manual or unknown trigger"
        else:
            trigger_desc = f"Triggered by {', '.join(triggers)}"

        if not integrations:
            integration_desc = "uses n8n core nodes"
        else:
            integration_desc = f"integrates with {', '.join(integrations)}"

        return f"A {len(nodes)}-node workflow that {trigger_desc.lower()} and {integration_desc}."

    def _calculate_complexity(self, nodes: List[Dict]) -> str:
        """Calculate workflow complexity level."""
        node_count = len(nodes)
        connections = len([n for n in nodes if n.get('type', '').startswith('n8n-nodes-base.')])

        # Count different node types
        unique_types = len(set(n.get('type', '') for n in nodes))

        if node_count <= 3 and unique_types <= 3:
            return 'beginner'
        elif node_count <= 10 and unique_types <= 7:
            return 'intermediate'
        elif node_count <= 25:
            return 'advanced'
        else:
            return 'expert'

    def _calculate_price(self, complexity: str, node_count: int) -> float:
        """Calculate price based on complexity and size."""
        base_prices = {
            'beginner': 1.0,
            'intermediate': 2.0,
            'advanced': 3.5,
            'expert': 5.0
        }

        price = base_prices.get(complexity, 2.0)

        # Small discount for simple workflows
        if node_count <= 3:
            price = min(price, 1.0)

        return round(price, 2)

    def _extract_triggers(self, nodes: List[Dict]) -> List[str]:
        """Extract trigger node types."""
        trigger_nodes = [
            n for n in nodes
            if n.get('type', '') in self.TRIGGER_NODES
        ]

        # Clean up node names
        return [n.get('type', '').split('.')[-1].replace('Trigger', '') for n in trigger_nodes]

    def _extract_integrations(self, nodes: List[Dict]) -> List[str]:
        """Extract unique integrations."""
        integrations = set()
        node_types_str = ' '.join([n.get('type', '').lower() for n in nodes])

        for integration, patterns in self.INTEGRATION_PATTERNS.items():
            if any(pattern in node_types_str for pattern in patterns):
                integrations.add(integration)

        return sorted(list(integrations))

    def _generate_tags(self, nodes: List[Dict], category: str) -> List[str]:
        """Generate tags based on workflow content."""
        tags = set()

        # Add category tag
        tags.add(category)

        # Add integration tags
        integrations = self._extract_integrations(nodes)
        for integration in integrations:
            tags.add(f"{integration}-automation")

        # Add trigger tags
        triggers = self._extract_triggers(nodes)
        for trigger in triggers:
            tags.append(f"{trigger.lower()}-trigger")

        # Add complexity tag
        complexity = self._calculate_complexity(nodes)
        tags.append(f"{complexity}-difficulty")

        return sorted(list(tags))

    def _categorize_workflow(self, nodes: List[Dict], name: str) -> str:
        """Categorize workflow by purpose."""
        node_types_str = ' '.join([n.get('type', '').lower() for n in nodes])
        name_lower = name.lower()

        # Check each category
        for category, keywords in self.CATEGORY_MAP.items():
            for keyword in keywords:
                if keyword in node_types_str or keyword in name_lower:
                    return category

        # Default
        return 'general-automation'

    def _generate_embedding(self, name: str, description: str, tags: List[str]) -> List[float]:
        """Generate OpenAI embedding for semantic search."""
        try:
            text = f"{name}. {description}. Tags: {', '.join(tags)}"

            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )

            return response.data[0].embedding
        except Exception as e:
            print(f"⚠ Embedding generation failed: {str(e)[:50]}")
            return None

    def save_to_json(self, output_path: str):
        """Save indexed workflows to JSON."""
        output = {
            'metadata': {
                'total_workflows': len(self.indexed),
                'indexed_at': datetime.now().isoformat(),
                'stats': self.stats
            },
            'workflows': [asdict(wf) for wf in self.indexed]
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2)

        print(f"\n✓ Saved {len(self.indexed)} workflows to {output_path}")

    def generate_sql_inserts(self) -> str:
        """Generate SQL INSERT statements for Supabase."""
        inserts = ["-- Insert workflows into Supabase\n"]

        for workflow in self.indexed:
            # Escape quotes in strings
            name_escaped = workflow.name.replace("'", "''")
            desc_escaped = workflow.description.replace("'", "''")
            tags_json = json.dumps(workflow.tags).replace("'", "''")

            # Handle embedding (or NULL if not available)
            embedding_val = "NULL"
            if workflow.embedding:
                embedding_val = f"'[{','.join(map(str, workflow.embedding))}]'"

            sql = f"""
INSERT INTO workflows (id, name, description, category, tags, complexity, nodes_count, file_path, file_size, price, download_count, rating, created_at, updated_at, embedding)
VALUES ('{workflow.id}', '{name_escaped}', '{desc_escaped}', '{workflow.category}', '{tags_json}'::jsonb, '{workflow.complexity}', {workflow.nodes_count}, '{workflow.file_path}', {workflow.file_size}, {workflow.price}, 0, 0, '{workflow.created_at}', '{workflow.updated_at}', {embedding_val});
"""
            inserts.append(sql)

        return '\n'.join(inserts)

    def save_sql(self, output_path: str):
        """Save SQL inserts to file."""
        sql = self.generate_sql_inserts()

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(sql)

        print(f"✓ Generated SQL for {len(self.indexed)} workflows: {output_path}")

    def print_stats(self):
        """Print indexing statistics."""
        print(f"\n📊 Indexing Statistics:")
        print(f"   Total files: {self.stats['total']}")
        print(f"   Successfully indexed: {self.stats['successful']}")
        print(f"   Errors: {self.stats['errors']}")

        print(f"\n   By Category:")
        for cat, count in sorted(self.stats['categories'].items(), key=lambda x: x[1], reverse=True):
            print(f"     {cat}: {count}")

        print(f"\n   By Complexity:")
        for comp, count in sorted(self.stats['complexities'].items()):
            print(f"     {comp}: {count}")


def main():
    """Run enhanced indexer."""
    import sys

    workflows_dir = sys.argv[1] if len(sys.argv) > 1 else "./workflows"
    openai_key = os.getenv('OPENAI_API_KEY')

    if not Path(workflows_dir).exists():
        print(f"❌ Error: Directory '{workflows_dir}' not found")
        sys.exit(1)

    print("🚀 Enhanced n8n Workflow Indexer")
    print("=" * 50)

    indexer = EnhancedN8nIndexer(workflows_dir, openai_key)
    indexed = indexer.index_directory()
    indexer.print_stats()

    # Save outputs
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    indexer.save_to_json(f"workflows_index_{timestamp}.json")
    indexer.save_sql(f"workflows_insert_{timestamp}.sql")

    print(f"\n✨ Indexing complete! Ready for database import.")


if __name__ == '__main__':
    main()
