export async function POST(request: Request) {
  try {
    const { user_id, type, details, order_id } = await request.json();
    // Simulate ticket creation
    return new Response(
      JSON.stringify({
        message: `Ticket created for user ${user_id}`,
        type,
        details,
        order_id,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating ticket:", error);
    return new Response("Error creating ticket", { status: 500 });
  }
}
