#!/usr/bin/env python3
"""
Enhanced n8n Workflow Indexer
Processes all workflow JSON files, extracts rich metadata, and uploads to Supabase
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Try to load Supabase client
try:
    from supabase import createClient, Client
    load_dotenv()
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print('⚠️  Supabase credentials not found')
        print('Database upload will be skipped')
        supabase = None
    else:
        print('✅ Supabase client initialized')
        supabase: Client = createClient(supabase_url, supabase_key)
except ImportError:
    print('⚠️  Supabase client not available, install with: pip install supabase')
    supabase = None

# ========================================
# METADATA EXTRACTION FUNCTIONS
# ========================================

def extract_nodes(workflow: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract all nodes from workflow"""
    nodes = []
    
    if 'nodes' in workflow and isinstance(workflow['nodes'], list):
        nodes = workflow['nodes']
    elif 'nodes' in workflow and isinstance(workflow['nodes'], dict):
        nodes = [workflow['nodes']]
    
    return nodes

def extract_connections(workflow: Dict[str, Any]) -> Dict[str, int]:
    """Count connections between nodes"""
    connections = {}
    nodes = extract_nodes(workflow)
    
    for node in nodes:
        node_id = node.get('id', 'unknown')
        if node_id in node.get('connections', {}):
            for target_id, count in node['connections'][node_id].items():
                connections[target_id] = connections.get(target_id, 0) + count
    
    return connections

def extract_triggers(workflow: Dict[str, Any]) -> List[str]:
    """Extract trigger node types"""
    triggers = []
    nodes = extract_nodes(workflow)
    
    for node in nodes:
        node_type = node.get('type', '').lower()
        if node_type in ['n8n-nodes-base.trigger', 'n8n-nodes-base.webhook', 'n8n-nodes-base.scheduleTrigger']:
            triggers.append(node_type)
    
    return list(set(triggers))

def extract_actions(workflow: Dict[str, Any]) -> List[str]:
    """Extract action node types"""
    actions = []
    nodes = extract_nodes(workflow)
    
    for node in nodes:
        node_type = node.get('type', '').lower()
        if node_type in ['n8n-nodes-base.function', 'n8n-nodes-base.functionCall']:
            actions.append(node_type)
        elif node_type in ['n8n-nodes-base.httpRequest']:
            actions.append('http-request')
        elif node_type in ['n8n-nodes-base.set']:
            actions.append('set')
        elif node_type in ['n8n-nodes-base.get']:
            actions.append('get')
        elif node_type in ['n8n-nodes-base.if', 'n8n-nodes-base.switch']:
            actions.append('if-else')
    
    return list(set(actions))

def extract_integrations(workflow: Dict[str, Any]) -> List[str]:
    """Extract integrations from node names"""
    integrations = []
    nodes = extract_nodes(workflow)
    
    integration_keywords = {
        'email': ['imap', 'smtp', 'gmail', 'outlook', 'mailchimp', 'sendgrid', 'brevo', 'postmark', 'sparkpost', 'ses'],
        'social': ['twitter', 'facebook', 'instagram', 'linkedin', 'pinterest', 'tiktok', 'youtube', 'discord', 'slack', 'telegram', 'whatsapp', 'medium', 'reddit', 'notion'],
        'ecommerce': ['shopify', 'woocommerce', 'magento', 'bigcommerce', 'opencart', 'salesforce', 'stripe', 'paypal', 'braintree', 'square', 'adyen'],
        'storage': ['google-sheets', 'notion', 'airtable', 'excel', 'dropbox', 'onedrive', 'box', 'aws-s3', 'cloudinary', 'firebase'],
        'communication': ['twilio', 'nexmo', 'plivo', 'sendinblue', 'messagebird', 'webhook', 'mattermost', 'rocketchat'],
        'ai': ['openai', 'anthropic', 'cohere', 'claude', 'gemini', 'gpt-4', 'llama', 'huggingface', 'langchain', 'pinecone'],
        'database': ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'firestore', 'supabase', 'mongodb', 'airtable', 'notion'],
        'data': ['json', 'xml', 'csv', 'api', 'webhook', 'http-request', 'transform', 'parse'],
        'finance': ['stripe', 'paypal', 'braintree', 'square', 'quickbooks', 'xero', 'freshbooks', 'wave', 'plaid', 'notion'],
        'productivity': ['trello', 'asana', 'jira', 'basecamp', 'notion', 'slack', 'discord', 'google-calendar', 'outlook-calendar'],
        'marketing': ['mailchimp', 'hubspot', 'salesforce', 'mailgun', 'sendgrid', 'convertkit', 'clevertap', 'activecampaign'],
        'crm': ['hubspot', 'salesforce', 'pipedrive', 'airtable', 'notion', 'monday', 'zoho'],
        'analytics': ['google-analytics', 'mixpanel', 'amplitude', 'segment', 'hotjar', 'posthog', 'plausible', 'fathom'],
        'automation': ['zapier', 'make', 'ifttt', 'integromat', 'parabola', 'tray.io', 'automateio', 'power-automate'],
        'cloud': ['aws', 'azure', 'gcp', 'digitalocean', 'heroku', 'vercel', 'netlify', 'cloudflare', 'firebase'],
        'api': ['rest', 'graphql', 'webhook', 'http-request', 'api', 'json', 'xml', 'csv', 'api-gateway'],
        'dev': ['github', 'gitlab', 'bitbucket', 'code', 'git', 'vercel', 'netlify', 'webhook'],
        'security': ['auth0', 'okta', 'cognito', 'lastpass', 'vault', 'encryption', 'ssh', 'ssl', 'oauth', 'jwt'],
        'files': ['google-drive', 'dropbox', 'onedrive', 'box', 'aws-s3', 'cloudinary', 'firebase-storage', 'notion'],
        'search': ['algolia', 'elasticsearch', 'opensearch', 'meilisearch', 'typesense', 'pinecone', 'weaviate', 'pgvector'],
        'n8n': ['n8n', 'node', 'workflow', 'webhook', 'integration', 'trigger', 'action', 'function', 'http-request', 'api', 'json', 'xml', 'csv']
    }
    
    for node in nodes:
        node_name = node.get('name', '').lower()
        node_type = node.get('type', '').lower()
        
        for category, keywords in integration_keywords.items():
            if node_type == 'n8n-nodes-base.' + category or category in node_name:
                integrations.append(category)
                if len(integrations) >= 20:
                    break
                
                for keyword in keywords:
                    if keyword in node_name:
                        integrations.append(category)
    
    return list(set(integrations))

def calculate_complexity(nodes: List[Dict[str, Any]], connections: Dict[str, int]) -> str:
    """Calculate complexity based on node count and connections"""
    node_count = len(nodes)
    connection_count = sum(connections.values())
    
    if node_count <= 3 and connection_count <= 3:
        return 'simple'
    elif node_count <= 8 and connection_count <= 10:
        return 'medium'
    else:
        return 'complex'

def calculate_difficulty(workflow: Dict[str, Any], complexity: str, integrations: List[str]) -> str:
    """Calculate difficulty based on complexity and integrations"""
    integrations = extract_integrations(workflow)
    
    has_ai = any(tech in integrations for tech in ['openai', 'anthropic', 'cohere', 'claude', 'gemini', 'gpt-4', 'llama', 'huggingface', 'langchain', 'pinecone'])
    
    unique_platforms = len(set([tech for tech in integrations for tech in ['shopify', 'woocommerce', 'stripe', 'gmail', 'outlook', 'slack', 'discord', 'whatsapp', 'webhook']))
