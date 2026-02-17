import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Auth routes from @convex-dev/auth
auth.addHttpRoutes(http);

// Session validation endpoint for backend
http.route({
  path: "/validateSession",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ valid: true, userId: userId.toString() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
