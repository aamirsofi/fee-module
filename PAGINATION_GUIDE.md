# Pagination Implementation Guide

This guide documents the pagination pattern used throughout the application.

## Backend Implementation

### 1. Use PaginationDto for Query Parameters

```typescript
import { PaginationDto } from '../common/dto/pagination.dto';

@Get('items')
getAllItems(@Query() paginationDto: PaginationDto) {
  const { page, limit } = paginationDto;
  return this.service.getAllItems(page, limit);
}
```

### 2. Use Pagination Utilities in Services

```typescript
import { getPaginationParams, createPaginatedResponse } from '../common/utils/pagination.util';

async getAllItems(page: number = 1, limit: number = 10) {
  const { skip, limit: take } = getPaginationParams(page, limit);
  
  const [items, total] = await this.repository.findAndCount({
    skip,
    take,
    order: { createdAt: 'desc' },
  });

  return createPaginatedResponse(items, total, page, limit);
}
```

### 3. Response Format

All paginated endpoints return:
```typescript
{
  data: T[],           // Array of items
  meta: {
    total: number,     // Total number of items
    page: number,      // Current page
    limit: number,     // Items per page
    totalPages: number,// Total number of pages
    hasNextPage: boolean,
    hasPrevPage: boolean
  }
}
```

## Frontend Implementation

### 1. State Management

```typescript
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(10);
const [items, setItems] = useState<Item[]>([]);
const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
```

### 2. API Call

```typescript
const loadItems = async () => {
  const response = await api.instance.get('/items', {
    params: { page, limit },
  });
  
  if (response.data.data && response.data.meta) {
    setItems(response.data.data);
    setPaginationMeta(response.data.meta);
  }
};

useEffect(() => {
  loadItems();
}, [page, limit]);
```

### 3. Pagination Component

Reuse the pagination UI pattern from `Schools.tsx`:
- Per page selector (5, 10, 20, 50, 100)
- Previous/Next buttons
- Page numbers with ellipsis
- Info text showing "Showing X to Y of Z items"

## Endpoints That Need Pagination

### Super Admin
- ✅ `/super-admin/schools` - DONE
- ⏳ `/super-admin/users` - TODO
- ⏳ `/super-admin/dashboard` (recent items) - TODO

### Regular Admin
- ⏳ `/students` - TODO
- ⏳ `/payments` - TODO
- ⏳ `/fee-structures` - TODO
- ⏳ `/fee-categories` - TODO

## Best Practices

1. **Default Values**: Always use `page=1` and `limit=10` as defaults
2. **Limit Validation**: Enforce max limit of 100 items per page
3. **Consistent Response**: Always return `{ data, meta }` format
4. **Error Handling**: Handle both old (array) and new (paginated) formats during migration
5. **Performance**: Use database-level pagination (skip/take) not application-level slicing

## Migration Strategy

When migrating existing endpoints:
1. Update backend to return paginated format
2. Update frontend to handle both formats temporarily
3. Add console warnings for old format
4. Remove fallback code after all endpoints are migrated

