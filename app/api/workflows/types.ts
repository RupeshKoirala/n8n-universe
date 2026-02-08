export type Workflow = {
  id: string;
  name: string;
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
  category: string;
  tags: string[];
  triggers: string[];
  actions: string[];
  integrations: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  popularity: number;
  rating: number | null;
  file_path: string;
  file_size: number;
  created_at: string;
  updated_at: string;
};

export type PaginatedWorkflowsResponse = {
  workflows: Workflow[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
};

export type CreateWorkflowRequest = {
  name: string;
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
  category: string;
  tags: string[];
  triggers: string[];
  actions: string[];
  integrations: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  file_path: string;
};

export type UpdateWorkflowRequest = Partial<CreateWorkflowRequest> & {
  id: string;
};

export type SearchFilters = {
  category?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  integrations?: string;
  triggers?: string[];
  tags?: string[];
  min_price?: number;
  max_price?: number;
  search?: string;
  page?: number;
  limit?: number;
};
