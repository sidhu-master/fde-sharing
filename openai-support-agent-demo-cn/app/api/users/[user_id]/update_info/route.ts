export async function POST(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;
    const { info } = await request.json();
    // Simulate updating user information
    return new Response(
      JSON.stringify({
        message: `User ${user_id} info updated`,
        updatedField: info.field,
        newValue: info.value,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user info:", error);
    return new Response("Error updating user info", { status: 500 });
  }
}
