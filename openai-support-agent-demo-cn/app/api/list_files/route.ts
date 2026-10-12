import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");
    const faqDir = path.join(process.cwd(), `public/${folder}`); // path to the faq directory
    const filesList = await fs.readdir(faqDir);
    console.log(`Files found in folder ${folder}:`, filesList);
    return new Response(JSON.stringify(filesList), { status: 200 });
  } catch (error) {
    console.error("Error fetching files:", error);
    return new Response("Error fetching files", { status: 500 });
  }
}
