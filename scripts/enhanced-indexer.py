#!/usr/bin/env python3
"""
Enhanced n8n Workflow Indexer

Parses n8n workflow JSON files, extracts metadata,
generates tags and descriptions, saves to database.

Supports:
- Batch processing of multiple workflows
- Metadata extraction (triggers, actions, integrations)
- Tag generation based on content
- Complexity analysis (node count, connections)
- Price estimation
- Similarity scoring (keyword + semantic)
"""

import json
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from collections import Counter
import os

class WorkflowIndexer:
    """Enhanced indexer for n8n workflows"""
    
    def __init__(self, workflows_dir: str = "/workflows"):
        self.workflows_dir = Path(workflows_dir)
        self.workflows_data = []
        self.tags_counter = Counter()
        self.integrations_counter = Counter()
        self.categories_counter = Counter()
        
        # Define complex node types
        self.trigger_nodes = {
            'webhook', 'cron', 'manual', 'email-trigger',
            'schedule', 'http-request'
        }
        
        self.action_nodes = {
            'http-request', 'set', 'get', 'delete',
            'http-response', 'transform', 'if-else',
            'code', 'function', 'merge', 'split', 'map', 'filter'
        }
        
        self.integrations = [
            'n8n', 'notion', 'google', 'slack', 'zapier', 'make',
            'airtable', 'shopify', 'woocommerce', 'magento', 'stripe',
            'salesforce', 'mailchimp', 'sendgrid', 'convertkit',
            'twitter', 'facebook', 'instagram', 'linkedin'
        ]
        
        self.categories = {
            'marketing', 'e-commerce', 'productivity', 'customer-support',
            'ai', 'data', 'finance', 'communication',
            'social-media', 'development'
        }
    
    def _count_nodes(self, nodes: List[Dict]) -> int:
        """Count total nodes in workflow"""
        return len(nodes)
    
    def _count_connections(self, nodes: List[Dict]) -> int:
        """Count connections between nodes"""
        if not nodes:
            return 0
        
        connections = 0
        for node in nodes:
            # Each node can have multiple connections
            connections += len(node.get('connections', []))
        return connections
    
    def _calculate_complexity(self, nodes: List[Dict]) -> str:
        """Calculate workflow complexity (simple, medium, complex)"""
        if not nodes:
            return 'simple'
        
        node_count = self._count_nodes(nodes)
        
        if node_count <= 5:
            return 'simple'
        elif node_count <= 15:
            return 'medium'
        else:
            return 'complex'
    
    def _determine_difficulty(self, nodes: List[Dict]) -> str:
        """Determine difficulty level (beginner, intermediate, advanced)"""
        complexity = self._calculate_complexity(nodes)
        node_count = self._count_nodes(nodes)
        
        # Check for complex patterns
        node_types = [node.get('type', '').lower() for node in nodes]
        
        has_logic = any(t in ['if', 'switch', 'function', 'merge'] for t in node_types)
        has_http = any(t in ['http-request', 'set', 'get', 'delete'] for t in node_types)
        has_data_manipulation = any(t in ['transform', 'map', 'filter', 'split', 'merge'] for t in node_types)
        
        # Advanced criteria
        if has_logic and has_http and has_data_manipulation:
            return 'advanced'
        
        if complexity == 'simple':
            return 'beginner'
        elif complexity == 'medium' and (has_logic or has_http):
            return 'advanced'
        elif complexity == 'simple':
            return 'beginner'
        else:
            return 'advanced'
    
    def _extract_tags(self, nodes: List[Dict]) -> List[str]:
        """Extract tags from node names, descriptions, and parameters"""
        tags = []
        
        for node in nodes:
            node_name = node.get('name', '').lower()
            node_parameters = str(node.get('parameters', {})).lower()
            node_type = node.get('type', '').lower()
            
            # Add node type as tag
            tags.append(node_type)
            
            # Extract from parameters
            if node_parameters:
                # Look for known integrations
                for integration in self.integrations:
                    if integration in node_parameters:
                        tags.append(integration)
                
                # Look for keywords
                keywords = ['http', 'webhook', 'api', 'database', 'sheet', 'mail', 
                          'email', 'slack', 'notion', 'google', 'stripe', 'shopify', 'woocommerce', 'magento']
                for keyword in keywords:
                    if keyword in node_parameters:
                        tags.append(keyword)
            
            # Add common workflow patterns as tags
            if 'webhook' in node_name or 'http-request' in node_type:
                tags.append('trigger')
            if 'set' in node_name:
                tags.append('data-operation')
            if 'get' in node_name:
                tags.append('data-operation')
            if 'transform' in node_name:
                tags.append('data-transformation')
            if 'if' in node_name:
                tags.append('conditional-logic')
            if 'switch' in node_name:
                tags.append('routing')
        
        # Remove duplicates
        tags = list(set(tags))
        
        # Add category tags
        category = self._determine_category(nodes)
        if category:
            tags.append(category)
        
        return tags
    
    def _extract_triggers(self, nodes: List[Dict]) -> List[str]:
        """Extract trigger node types"""
        triggers = []
        
        for node in nodes:
            node_type = node.get('type', '').lower()
            
            if node_type in self.trigger_nodes:
                triggers.append(node_type)
        
        return list(set(triggers))
    
    def _extract_actions(self, nodes: List[Dict]) -> List[str]:
        """Extract action node types"""
        actions = []
        
        for node in nodes:
            node_type = node.get('type', '').lower()
            
            if node_type in self.action_nodes:
                actions.append(node_type)
        
        return list(set(actions))
    
    def _extract_integrations(self, nodes: List[Dict]) -> List[str]:
        """Extract integrations from workflow"""
        integrations = []
        
        for node in nodes:
            node_name = node.get('name', '').lower()
            node_parameters = str(node.get('parameters', {})).lower()
            node_type = node.get('type', '').lower()
            
            # Check parameters for known integrations
            for integration in self.integrations:
                if integration in node_parameters:
                    integrations.append(integration)
            
            # Check node name for known integrations
            if 'slack' in node_name:
                integrations.append('slack')
            if 'notion' in node_name:
                integrations.append('notion')
            if 'google' in node_name:
                integrations.append('google-sheets')
                integrations.append('google-drive')
            if 'stripe' in node_name:
                integrations.append('stripe')
        
        return list(set(integrations))
    
    def _determine_category(self, nodes: List[Dict]) -> Optional[str]:
        """Determine workflow category based on nodes"""
        if not nodes:
            return 'general'
        
        node_types = [node.get('type', '').lower() for node in nodes]
        node_names = [node.get('name', '').lower() for node in nodes]
        all_text = ' '.join(node_names + node_types)
        
        # Category detection using keywords
        category_keywords = {
            'marketing': ['social', 'email', 'newsletter', 'campaign', 'post', 'content', 'twitter', 'facebook', 'instagram', 'linkedin'],
            'e-commerce': ['shop', 'store', 'order', 'inventory', 'product', 'sales', 'woocommerce', 'shopify', 'magento', 'stripe', 'payment', 'checkout', 'cart'],
            'productivity': ['task', 'time', 'project', 'notion', 'calendar', 'schedule', 'reminder', 'todo', 'automation', 'sheet', 'document', 'report', 'data', 'chart', 'graph', 'database', 'api', 'webhook'],
            'customer-support': ['support', 'help', 'chat', 'bot', 'faq', 'ticket', 'zendesk', 'intercom', 'assist'],
            'ai': ['ai', 'automation', 'machine', 'learning', 'nlp', 'gpt', 'openai', 'llm', 'chatgpt', 'claude', 'model', 'training', 'n8n'],
            'data': ['analytics', 'data', 'report', 'dashboard', 'insight', 'metric', 'chart', 'graph', 'database', 'sql', 'api', 'webhook', 'export', 'import', 'transform', 'visualization'],
            'finance': ['accounting', 'invoice', 'payment', 'stripe', 'billing', 'tax', 'calculator', 'budget', 'expense', 'transaction'],
            'communication': ['slack', 'discord', 'telegram', 'whatsapp', 'email', 'message', 'notification'],
            'social-media': ['social', 'media', 'twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'interest', 'content', 'post', 'share'],
            'development': ['code', 'api', 'webhook', 'function', 'class', 'interface', 'library', 'package', 'module', 'npm', 'python', 'javascript', 'typescript', 'react', 'next']
        }
        
        # Check for keywords in workflow
        text_lower = all_text.lower()
        
        for category, keywords in category_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return category
        
        # Default if no match
        return 'general'
    
    def _generate_description(self, triggers: List[str], actions: List[str], integrations: List[str]) -> str:
        """Generate workflow description"""
        if not triggers and not actions and not integrations:
            return "Automates a business process end-to-end"
        
        # Build description
        parts = []
        
        if triggers:
            triggers_str = 'Triggers: ' + ', '.join(triggers)
            parts.append(triggers_str)
        
        if actions:
            actions_str = 'Actions: ' + ', '.join(actions)
            parts.append(actions_str)
        
        if integrations:
            integ_str = 'Integrations: ' + ', '.join(integrations)
            parts.append(integ_str)
        
        # Add details
        description = ' '.join(parts)
        
        # Add details
        description += " Features automation, data processing, and task management."
        
        return description
    
    def _estimate_price(self, nodes: List[Dict]) -> int:
        """Estimate workflow price ($1-50)"""
        if not nodes:
            return 3  # Default base price
        
        node_count = self._count_nodes(nodes)
        complexity = self._calculate_complexity(nodes)
        
        # Base price tiers
        price_tiers = {
            'simple': (2, 5),      # $2-5
            'medium': (5, 15),     # $5-15
            'complex': (15, 50)    # $15-50
        }
        
        min_price, max_price = price_tiers[complexity]
        
        # Adjust for node count
        if node_count > 10:
            max_price = max_price + 10
        
        if node_count > 20:
            max_price = max_price + 25
        
        # Calculate final price (weighted average)
        price = min_price + (max_price - min_price) // 2
        
        return max(1, price)
    
    def parse_workflow(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Parse a single n8n workflow JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                workflow_data = json.load(f)
            
            # Extract basic metadata
            metadata = {
                'name': workflow_data.get('name', 'Untitled Workflow'),
                'description': workflow_data.get('settings', {}).get('executionOrder', ''),
                'node_count': self._count_nodes(workflow_data.get('nodes', [])),
                'connection_count': self._count_connections(workflow_data.get('nodes', [])),
                'file_path': file_path,
                'file_size': os.path.getsize(file_path),
                'complexity': self._calculate_complexity(workflow_data.get('nodes', [])),
                'category': self._determine_category(workflow_data.get('nodes', [])),
                'difficulty': self._determine_difficulty(workflow_data.get('nodes', [])),
                'tags': self._extract_tags(workflow_data.get('nodes', [])),
                'triggers': self._extract_triggers(workflow_data.get('nodes', [])),
                'actions': self._extract_actions(workflow_data.get('nodes', [])),
                'integrations': self._extract_integrations(workflow_data.get('nodes', [])),
                'price': self._estimate_price(workflow_data.get('nodes', [])),
                'popularity': 0,  # Will be set based on downloads
                'rating': None,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Generate auto description if none exists
            if not metadata['description']:
                metadata['description'] = self._generate_description(
                    metadata['triggers'],
                    metadata['actions'],
                    metadata['integrations']
                )
            
            return metadata
            
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            return None
    
    def index_directory(self) -> List[Dict[str, Any]]:
        """Index all workflow JSON files in directory"""
        if not self.workflows_dir.exists():
            print(f"Workflows directory not found: {self.workflows_dir}")
            return []
        
        print(f"Indexing workflows from {self.workflows_dir}...")
        
        # Find all JSON files
        workflow_files = list(self.workflows_dir.glob('*.json'))
        print(f"Found {len(workflow_files)} workflow files")
        
        # Parse all workflows
        indexed_workflows = []
        
        for file_path in workflow_files:
            metadata = self.parse_workflow(str(file_path))
            if metadata:
                indexed_workflows.append(metadata)
        
        # Update counters
        for workflow in indexed_workflows:
            self.tags_counter.update(workflow.get('tags', []))
            self.integrations_counter.update(workflow.get('integrations', []))
            self.categories_counter.update([workflow.get('category')])
        
        # Print summary
        print(f"\nIndexing Summary:")
        print(f"  Total Workflows: {len(indexed_workflows)}")
        print(f"  Unique Tags: {len(self.tags_counter)}")
        print(f"  Top Tags: {self.tags_counter.most_common(10)}")
        print(f"  Unique Integrations: {len(self.integrations_counter)}")
        print(f"  Top Integrations: {self.integrations_counter.most_common(10)}")
        print(f"  Unique Categories: {len(self.categories_counter)}")
        print(f"  Categories Breakdown: {dict(self.categories_counter)}")
        print(f"\nComplexity Distribution:")
        complexity_dist = Counter(w['complexity'] for w in indexed_workflows)
        for comp, count in complexity_dist.items():
            print(f"  {comp}: {count}")
        
        print(f"\nPrice Distribution:")
        price_dist = Counter(str(w['price']) for w in indexed_workflows)
        for price_range in ['$1-5', '$6-10', '$11-20', '$21-50']:
            count = sum(1 for p in price_dist if price_range in str(p))
            print(f"  {price_range}: {count}")
        
        return indexed_workflows

def main():
    """Main execution function"""
    import argparse
    parser = argparse.ArgumentParser(description='Enhanced n8n Workflow Indexer')
    parser.add_argument('--workflows-dir', type=str, default='/workflows/workflows',
                        help='Directory containing workflow JSON files')
    parser.add_argument('--output', type=str, default='workflows-index.json',
                        help='Output JSON file for indexed workflows')
    parser.add_argument('--verbose', action='store_true',
                        help='Enable verbose output')
    
    args = parser.parse_args()
    
    # Create indexer and run
    indexer = WorkflowIndexer(workflows_dir=args.workflows_dir)
    indexed_workflows = indexer.index_directory()
    
    # Save to JSON if output specified
    if args.output:
        output_data = {
            'indexed_at': datetime.now(timezone.utc).isoformat(),
            'total_workflows': len(indexed_workflows),
            'workflows': indexed_workflows,
            'summary': {
                'unique_tags': len(indexer.tags_counter),
                'top_tags': dict(indexer.tags_counter.most_common(10)),
                'unique_integrations': len(indexer.integrations_counter),
                'top_integrations': dict(indexer.integrations_counter.most_common(10)),
                'unique_categories': len(indexer.categories_counter),
                'categories_breakdown': dict(indexer.categories_counter),
                'complexity_distribution': {comp: count for comp, count in 
                                       Counter(w['complexity'] for w in indexed_workflows).items()},
                'price_distribution': {f"${price}": count for price, count in 
                                        Counter(str(w['price']) for w in indexed_workflows).items()}
            }
        }
        
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"\nIndexed workflows saved to: {args.output}")
    
    print(f"\nIndexing complete!")
    print(f"Total workflows: {len(indexed_workflows)}")
    print(f"Ready to import to Supabase database")

if __name__ == '__main__':
    main()
