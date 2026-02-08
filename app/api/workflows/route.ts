import { NextResponse } from 'next/server';
import type { PaginatedWorkflowsResponse, CreateWorkflowRequest } from './types';

export const dynamic = 'force-dynamic';

// Mock database for development (will be replaced with Supabase)
const workflows: any[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url).searchParams;
  
  let filteredWorkflows = workflows;
  let page = 1;
  let limit = 20;
  let has_more = true;

  // Apply filters
  if (searchParams.category) {
    filteredWorkflows = filteredWorkflows.filter(w => 
      w.category.toLowerCase() === searchParams.category.toLowerCase()
    );
  }

  if (searchParams.complexity) {
    filteredWorkflows = filteredWorkflows.filter(w => 
      w.complexity.toLowerCase() === searchParams.complexity.toLowerCase()
    );
  }

  if (searchParams.difficulty) {
    filteredWorkflows = filteredWorkflows.filter(w => 
      w.difficulty.toLowerCase() === searchParams.difficulty.toLowerCase()
    );
  }

  if (searchParams.integration) {
    filteredWorkflows = filteredWorkflows.filter(w => 
      w.integrations?.includes(searchParams.integration.toLowerCase())
    );
  }

  if (searchParams.min_price) {
    filteredWorkflows = filteredWorkflows.filter(w => 
      w.price !== undefined && w.price >= parseFloat(searchParams.min_price)
    );
  }

  if (searchParams.max_price) {
    filteredWorkflows = filteredWorkflows.filter(w => 
      w.price !== undefined && w.price <= parseFloat(searchParams.max_price)
    );
  }

  if (searchParams.search) {
    const searchTerm = searchParams.search.toLowerCase();
    filteredWorkflows = filteredWorkflows.filter(w => 
      w.name.toLowerCase().includes(searchTerm) ||
      w.description?.toLowerCase().includes(searchTerm) ||
      w.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Apply pagination
  if (searchParams.page) {
    page = parseInt(searchParams.page);
  }

  if (searchParams.limit) {
    limit = parseInt(searchParams.limit);
  }

  // Get paginated results
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedWorkflows = filteredWorkflows.slice(startIndex, endIndex);
  has_more = endIndex < filteredWorkflows.length;

  const response: PaginatedWorkflowsResponse = {
    workflows: paginatedWorkflows,
    page,
    limit,
    total: filteredWorkflows.length,
    has_more
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateWorkflowRequest;
    
    // Create new workflow (will be saved to database)
    const newWorkflow = {
      id: `wf-${Date.now()}`,
      name: body.name,
      description: body.description,
      complexity: body.complexity || 'simple',
      category: body.category || 'general',
      tags: body.tags || [],
      triggers: body.triggers || [],
      actions: body.actions || [],
      integrations: body.integrations || [],
      difficulty: body.difficulty || 'beginner',
      price: body.price || 1,
      popularity: 0,
      rating: null,
      file_path: '',
      file_size: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // In production, save to Supabase
    // For now, just add to in-memory array
    workflows.push(newWorkflow);

    return NextResponse.json({ workflow: newWorkflow }, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id } = new URL(request.url).searchParams;
    const body = await request.json() as Partial<CreateWorkflowRequest>;
    
    // Find workflow
    const workflowIndex = workflows.findIndex(w => w.id === id);
    
    if (workflowIndex === -1) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Update workflow
    const updatedWorkflow = {
      ...workflows[workflowIndex],
      ...body,
      updated_at: new Date().toISOString()
    };

    workflows[workflowIndex] = updatedWorkflow;

    return NextResponse.json({ workflow: updatedWorkflow });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = new URL(request.url).searchParams;
    
    // Find workflow
    const workflowIndex = workflows.findIndex(w => w.id === id);
    
    if (workflowIndex === -1) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Delete workflow
    workflows.splice(workflowIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}

export async function GET_ONE(request: Request) {
  try {
    const { id } = new URL(request.url).searchParams;
    
    // Find workflow
    const workflow = workflows.find(w => w.id === id);
    
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
  }
}
