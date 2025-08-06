# Agent Guidelines for ASOM (Tauri + Nuxt 3 + Vue 3)

## Build/Test/Lint Commands

- `npx tauri dev` - Start development server
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm test` - Run all tests with Vitest
- `npm test -- --run` - Run tests once without watch mode
- `npm test -- path/to/test.spec.ts` - Run single test file
- `npm run generate:types` - Generate TypeScript bindings from Rust and format generated files with prettier
- `cd src-tauri && cargo test` - Run Rust tests
- `cd src-tauri && cargo fmt` - Format Rust code

## Code Style Guidelines

- **Imports**: Auto-organized by prettier-plugin-organize-imports
- **TypeScript**: Strict mode enabled, use proper typing with Vue 3 composition API
- **Vue Components**: Use `<script setup lang="ts">` with composition API
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Props**: Use `defineProps` with TypeScript interfaces, mark required props
- **Stores**: Use Pinia with `defineStore`, type state interfaces
- **Error Handling**: Use custom ErrFR type for error management
- **File Structure**: Components in `/components`, composables in `/composables`, types in `/types`
- **Rust**: Follow standard Rust conventions, use serde for serialization
