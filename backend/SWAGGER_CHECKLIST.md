# Swagger Documentation Checklist

This checklist ensures that all API endpoints have proper Swagger documentation.

## Required Decorators for Each Endpoint

### Controller Level
- [ ] `@ApiTags('Controller Name')` - Groups endpoints by controller
- [ ] `@ApiBearerAuth('JWT-auth')` - Indicates JWT authentication required
- [ ] `@ApiExtraModels(...)` - If using custom DTOs/models

### Endpoint Level

#### For ALL Endpoints:
- [ ] `@ApiOperation({ summary: 'Clear description' })` - Describes what the endpoint does
- [ ] `@ApiOkResponse({ description: '...', type: Entity })` - Success response (200/201)
- [ ] `@ApiResponse({ status: 400, description: '...' })` - Bad request errors
- [ ] `@ApiResponse({ status: 404, description: '...' })` - Not found errors
- [ ] `@ApiResponse({ status: 401, description: '...' })` - Unauthorized (if applicable)
- [ ] `@ApiResponse({ status: 403, description: '...' })` - Forbidden (if applicable)

#### For GET Endpoints:
- [ ] `@ApiQuery({ name: 'param', required: false, type: Type, description: '...' })` - For each query parameter
- [ ] `@ApiParam({ name: 'id', description: '...', type: Number })` - For path parameters

#### For POST/PATCH/PUT Endpoints:
- [ ] `@ApiBody({ type: DtoClass })` - Request body schema
- [ ] `@ApiQuery({ name: 'schoolId', ... })` - If schoolId is a query parameter
- [ ] `@ApiParam({ name: 'id', ... })` - For path parameters

#### For DELETE Endpoints:
- [ ] `@ApiParam({ name: 'id', ... })` - Path parameter
- [ ] `@ApiQuery({ name: 'schoolId', ... })` - If schoolId is a query parameter

## Controllers Status

### ✅ Fully Documented
- [x] **Classes** (`/classes`) - Complete with all decorators
- [x] **Fee Categories** (`/fee-categories`) - Complete with all decorators
- [x] **Fee Structures** (`/fee-structures`) - Complete with all decorators
- [x] **Category Heads** (`/category-heads`) - Complete with all decorators
- [x] **Super Admin** (`/super-admin/*`) - Complete with all decorators

### ⚠️ Needs Enhancement
- [ ] **Users** (`/users`) - Has basic Swagger but missing some `@ApiQuery` and `@ApiParam` details
- [ ] **Schools** (`/schools`) - Has basic Swagger but missing some `@ApiQuery` and `@ApiParam` details
- [ ] **Students** (`/students`) - Needs review
- [ ] **Payments** (`/payments`) - Needs review
- [ ] **Auth** (`/auth`) - Needs review

## Best Practices

1. **Always add Swagger decorators when creating new endpoints**
2. **Update Swagger when modifying endpoints** (parameters, responses, etc.)
3. **Use `@ApiOkResponse` instead of `@ApiResponse({ status: 200 })`** for consistency
4. **Include `type: Number` or `type: String` in `@ApiParam` and `@ApiQuery`**
5. **Provide clear descriptions** - Explain what the parameter does, not just its name
6. **Document all query parameters** - Even optional ones
7. **Include examples** where helpful: `example: 1` or `example: 'search term'`
8. **Document error responses** - List all possible error codes (400, 404, 401, 403, 500)

## When to Update Swagger

- ✅ Adding a new endpoint
- ✅ Modifying request/response structure
- ✅ Adding/removing query parameters
- ✅ Changing response status codes
- ✅ Adding new error responses
- ✅ Modifying DTOs (ensure `@ApiProperty` is on all fields)

## Quick Reference

```typescript
// Controller
@ApiTags('Resource Name')
@ApiBearerAuth('JWT-auth')
@Controller('resource-name')

// GET endpoint with query params
@Get()
@ApiOperation({ summary: 'Get all resources' })
@ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
@ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID' })
@ApiOkResponse({ type: [ResourceEntity], description: 'List of resources' })

// GET by ID
@Get(':id')
@ApiOperation({ summary: 'Get resource by ID' })
@ApiParam({ name: 'id', description: 'Resource ID', type: Number })
@ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'Filter by school ID' })
@ApiOkResponse({ type: ResourceEntity, description: 'Resource found' })
@ApiResponse({ status: 404, description: 'Resource not found' })

// POST
@Post()
@ApiOperation({ summary: 'Create a new resource' })
@ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'School ID' })
@ApiBody({ type: CreateResourceDto })
@ApiOkResponse({ type: ResourceEntity, description: 'Resource created successfully', status: 201 })
@ApiResponse({ status: 400, description: 'Bad request - validation error' })

// PATCH
@Patch(':id')
@ApiOperation({ summary: 'Update resource' })
@ApiParam({ name: 'id', description: 'Resource ID', type: Number })
@ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'School ID' })
@ApiBody({ type: UpdateResourceDto })
@ApiOkResponse({ type: ResourceEntity, description: 'Resource updated successfully' })
@ApiResponse({ status: 404, description: 'Resource not found' })
@ApiResponse({ status: 400, description: 'Bad request - validation error' })

// DELETE
@Delete(':id')
@ApiOperation({ summary: 'Delete resource' })
@ApiParam({ name: 'id', description: 'Resource ID', type: Number })
@ApiQuery({ name: 'schoolId', required: false, type: Number, description: 'School ID' })
@ApiOkResponse({ description: 'Resource deleted successfully' })
@ApiResponse({ status: 404, description: 'Resource not found' })
@ApiResponse({ status: 400, description: 'Cannot delete - resource is in use' })
```

## Verification

After updating Swagger:
1. ✅ Start the backend server
2. ✅ Navigate to `/api-docs` (Swagger UI)
3. ✅ Verify all endpoints are visible
4. ✅ Check that request/response schemas are correct
5. ✅ Test "Try it out" feature for key endpoints
6. ✅ Verify all query parameters are documented
7. ✅ Check that error responses are listed

