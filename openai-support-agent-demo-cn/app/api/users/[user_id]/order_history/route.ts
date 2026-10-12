import { USER_INFO } from "@/config/demoData";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;
    console.log("Retrieving order history for user:", user_id);
    return new Response(JSON.stringify(USER_INFO.order_history), {
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving order history:", error);
    return new Response("Error retrieving order history", { status: 500 });
  }
}
