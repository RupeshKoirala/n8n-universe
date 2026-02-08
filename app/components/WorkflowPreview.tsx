'use client';

import type { Workflow } from '../types';

interface WorkflowPreviewProps {
  workflow: Workflow;
  onEdit?: (workflowId: string) => void;
}

export default function WorkflowPreview({ workflow, onEdit }: WorkflowPreviewProps) {
  const nodes = parseWorkflowNodes(workflow.file_path || '');
  const connections = parseWorkflowConnections(workflow.file_path || '');
  const nodeCount = nodes.length;
  const connectionCount = connections.length;

  return (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg shadow-xl overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {workflow.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                {workflow.category}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                {workflow.difficulty}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                {workflow.difficulty}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                {workflow.difficulty}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {nodeCount} nodes • {connectionCount} connections
            </span>
            <span className={`px-3 py-1 rounded-full text-white font-semibold ${
              workflow.difficulty === 'simple' ? 'bg-green-500' :
              workflow.difficulty === 'medium' ? 'bg-orange-500' :
              'bg-red-500'
            }`}>
              {workflow.difficulty}
            </span>
            <span className="px-2 py-1 rounded bg-blue-500 text-white font-semibold text-sm">
              ${workflow.price || '1'}$
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button className="px-6 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400">
            Overview
          </button>
          <button className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            Nodes
          </button>
          <button className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            Connections
          </button>
          <button className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            JSON Preview
          </button>
          <button className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            Requirements
          </button>
        </div>

        {/* Overview Tab */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {workflow.description || 'This workflow automates a complex process'}
          </h3>

          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-white mb-3">
              What It Does
            </h4>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {generateWhatItDoes(workflow)}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-green-900 dark:text-white mb-3">
              Benefits
            </h4>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400">✓</span>
                <span>{workflow.file_size ? 'Handles ' + formatBytes(workflow.file_size) + ' files' : 'Lightweight and fast'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400">✓</span>
                <span>{workflow.difficulty === 'simple' ? 'Easy to modify' : 'Pro-level automation'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400">✓</span>
                <span>Save {workflow.popularity ? Math.round(workflow.popularity * 2) : '50'}+ hours per month</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Requirements Tab */}
        <div className="hidden">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Requirements
          </h3>
          <div className="space-y-4">
            {workflow.integrations.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                  Required Accounts
                </h4>
                <ul className="space-y-2">
                  {workflow.integrations.map((integration) => (
                    <li key={integration} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-gray-900 dark:text-white">{integration}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {workflow.triggers.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                  Triggers
                </h4>
                <ul className="space-y-2">
                  {workflow.triggers.map((trigger) => (
                    <li key={trigger} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-gray-900 dark:text-white">{trigger}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

function parseWorkflowNodes(filePath: string): any[] {
  // Parse n8n workflow JSON and extract node data
  return [];
}

function parseWorkflowConnections(filePath: string): any[] {
  // Parse connections between nodes
  return [];
}

function generateWhatItDoes(workflow: Workflow): string {
  const actions = workflow.actions || [];
  
  if (actions.includes('http-request')) {
    return 'Makes HTTP requests to external APIs to fetch or send data';
  }
  
  if (actions.includes('set')) {
    return 'Updates or creates data in external services (Google Sheets, Notion, etc.)';
  }
  
  if (actions.includes('if-else')) {
    return 'Executes different actions based on conditions';
  }
  
  if (actions.includes('transform')) {
    return 'Manipulates data (filter, map, format, etc.)';
  }
  
  if (actions.includes('delay')) {
    return 'Waits a specified time before executing next step';
  }
  
  return 'Automates a business process end-to-end';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function WorkflowDetails({ workflow, onEdit }: WorkflowPreviewProps) {
  const nodes = parseWorkflowNodes(workflow.file_path || '');
  
  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {workflow.name}
      </h3>
      
      {onEdit && (
        <button 
          onClick={() => onEdit(workflow.id)}
          className="mb-4 px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
        >
          Edit Workflow
        </button>
      )}
      
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Trigger
            </h4>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {workflow.triggers.length > 0 ? workflow.triggers[0] : 'Manual trigger'}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Difficulty
            </h4>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {workflow.difficulty}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Complexity
            </h4>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {workflow.complexity}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Category
            </h4>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {workflow.category}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Est. Setup Time
            </h4>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {workflow.difficulty === 'simple' ? '5-15 minutes' :
               workflow.difficulty === 'medium' ? '30-60 minutes' :
               workflow.difficulty === 'complex' ? '1-2 hours'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
