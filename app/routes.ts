import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("new-book", "routes/new-book.tsx"),
] satisfies RouteConfig;