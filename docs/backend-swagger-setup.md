# Backend Swagger Setup

## Muc tieu
Tai lieu nay huong dan cach bat Swagger cho backend NestJS de team co endpoint docs de test API nhanh trong qua trinh dev/demo.

## Da setup trong source code
File da cap nhat: `backend/src/main.ts`

Da them:
- `DocumentBuilder` + `SwaggerModule` tu `@nestjs/swagger`
- Cau hinh OpenAPI co title, description, version
- Bearer auth button trong Swagger UI
- Endpoint docs: `GET /api/docs`

## Cach chay va kiem tra
1. Chay backend:
   ```bash
   cd backend
   npm run start:dev
   ```
2. Mo trinh duyet:
   - API docs UI: `http://localhost:3001/api/docs`
   - OpenAPI JSON: `http://localhost:3001/api/docs-json`

## Su dung JWT trong Swagger UI
1. Login qua API `POST /api/auth/login` de lay `token`
2. Bam nut `Authorize` tren Swagger UI
3. Nhap theo format:
   ```
   Bearer <your_token>
   ```
4. Goi cac endpoint can auth

## Goi y de docs dep hon (khuyen nghi)
Neu muon tai lieu day du hon, them decorator vao controller/dto:
- `@ApiTags('auth')`
- `@ApiOperation({ summary: '...' })`
- `@ApiBearerAuth()` cho route can JWT
- `@ApiResponse(...)`
- `@ApiProperty(...)` trong DTO

## Luu y
- Swagger hien tai dang bat cho moi moi truong de phuc vu demo.
- Neu deploy production, nen gate bang env flag (vi du chi bat khi `NODE_ENV !== 'production'`).
