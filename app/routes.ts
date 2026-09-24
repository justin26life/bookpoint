import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  route("category/:slug", "routes/category.tsx"),
  route("memes/:id", "routes/meme.tsx"),
] satisfies RouteConfig;