export async function POST(request: Request) {
  try {
    const { user_id, type, details, order_id } = await request.json();
    // Simulate complaint creation.
    return new Response(
      JSON.stringify({
        message: `Complaint created for user ${user_id}`,
        type,
        details,
        order_id,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating complaint:", error);
    return new Response("Error creating complaint", { status: 500 });
  }
}
