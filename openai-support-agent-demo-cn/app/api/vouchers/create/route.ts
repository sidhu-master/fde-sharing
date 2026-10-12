export async function POST(request: Request) {
  try {
    const { user_id, amount, reason } = await request.json();
    // Simulate voucher issuance
    return new Response(
      JSON.stringify({
        message: `Voucher of $${amount} issued to user ${user_id} for: ${reason}`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error issuing voucher:", error);
    return new Response("Error issuing voucher", { status: 500 });
  }
}
