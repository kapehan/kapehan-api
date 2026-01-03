# Copilot Instructions for Kapehan Platform

Welcome to the Kapehan Platform codebase! This document provides essential guidelines for AI coding agents to be productive and effective contributors to this project. Please follow these instructions closely to maintain consistency and quality across the codebase.

## Project Overview

Kapehan Platform is a Next.js-based web application designed to connect coffee enthusiasts with coffee shops. The project uses modern web development tools and libraries, including:

- **Next.js**: For server-side rendering and routing.
- **Tailwind CSS**: For styling.
- **Framer Motion**: For animations.
- **Axios**: For HTTP requests.

The application is structured into feature-based directories under the `app/` and `components/` folders. It also includes utility functions, hooks, and services for shared logic.

## Key Directories and Files

- `app/`: Contains the main application pages and feature-specific subdirectories.
- `components/`: Houses reusable UI components, including `ui/` for atomic design elements.
- `services/`: Contains service files for API interactions (e.g., `addCoffeeShop.js`).
- `utils/`: Includes utility functions for shared logic (e.g., `apiService.js`, `auth-utils.js`).
- `data/`: Stores static data files (e.g., `coffee-categories.json`).
- `hooks/`: Custom React hooks (e.g., `useAuth.js`).

## Development Conventions

1. **Component Structure**:
   - Use functional components with React hooks.
   - Co-locate component-specific styles and logic.
   - Follow the atomic design methodology for `ui/` components.

2. **State Management**:
   - Use React Context for global state (e.g., `authContext.js`, `shopContext.jsx`).
   - Avoid prop drilling by leveraging context or custom hooks.

3. **API Integration**:
   - Use `axiosInstance` from `utils/axiosInstance.js` for HTTP requests.
   - Centralize API logic in `services/` to keep components clean.

4. **Styling**:
   - Use Tailwind CSS classes for styling.
   - Extend Tailwind configuration in `tailwind.config.js` when necessary.

5. **Routing**:
   - Follow Next.js file-based routing conventions.
   - Use dynamic routes (e.g., `[slug]`) for pages with variable content.

## Developer Workflows

### Building and Running the Project

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Run the development server:
   ```bash
   pnpm dev
   ```
3. Build for production:
   ```bash
   pnpm build
   ```
4. Start the production server:
   ```bash
   pnpm start
   ```

### Testing

- Currently, no explicit testing framework is set up. Add tests under a `__tests__/` directory when introducing new features.

### Debugging

- Use browser developer tools and Next.js debugging features.
- Check API requests in the network tab or via `axiosInstance` interceptors.

## Integration Points

- **External APIs**: Interact with external APIs via `services/` files.
- **Global State**: Use `authContext.js` and `shopContext.jsx` for shared state.
- **UI Components**: Reuse `ui/` components to maintain design consistency.

## Examples

### Adding a New API Service

1. Create a new file in `services/` (e.g., `getCoffeeShops.js`).
2. Use `axiosInstance` for HTTP requests:
   ```javascript
   import axiosInstance from '../utils/axiosInstance';

   export const getCoffeeShops = async () => {
     const response = await axiosInstance.get('/coffee-shops');
     return response.data;
   };
   ```
3. Import and use the service in your component or hook.

### Creating a New Component

1. Add the component file under `components/`.
2. Follow the atomic design methodology for `ui/` components.
3. Use Tailwind CSS for styling and ensure accessibility.

---

For any questions or clarifications, refer to the existing codebase or consult the project maintainers.