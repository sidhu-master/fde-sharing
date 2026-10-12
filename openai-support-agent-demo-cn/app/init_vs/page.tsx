"use client";
import { KB_FOLDERS } from "@/config/demoData";
import { Copy } from "lucide-react";
import { useState } from "react";

interface KBFile {
  type: string;
  filename: string;
  filepath: string;
}

export default function InitVS() {
  const [loading, setLoading] = useState(false);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleInitialize = async () => {
    setLoading(true);
    setSuccess(false);
    setStatus("Creating vector store...");
    const response = await fetch("/api/vector_stores/create_store", {
      method: "POST",
      body: JSON.stringify({ name: "CS Knowledge Base" }),
    });
    if (response.status === 200) {
      const vs = await response.json();
      setVectorStoreId(vs.id);
      setStatus("Fetching files...");
      const filesList: KBFile[] = [];
      for (const folder of KB_FOLDERS) {
        const folderFiles = await fetch(
          `/api/list_files?folder=${folder}`
        ).then((res) => res.json());
        console.log(`Files found in folder ${folder}:`, folderFiles);
        filesList.push(
          ...folderFiles.map((file: string) => ({
            type: folder,
            filename: file.split(".")[0],
            filepath: `/public/${folder}/${file}`,
          }))
        );
      }
      setStatus(`Uploading ${filesList.length} files to vector store...`);
      for (const file of filesList) {
        console.log(`Uploading file ${file.filepath}...`);
        const response = await fetch("/api/vector_stores/upload_file", {
          method: "POST",
          body: JSON.stringify({ filePath: file.filepath }),
        });
        if (response.status === 200) {
          const fileData = await response.json();
          const fileId = fileData.id;
          const attributes = {
            type: file.type,
            filename: file.filename,
            filepath: file.filepath,
          };
          const addFileResponse = await fetch("/api/vector_stores/add_file", {
            method: "POST",
            body: JSON.stringify({ vectorStoreId: vs.id, fileId, attributes }),
          });
          if (addFileResponse.status === 200) {
            setStatus(`Uploaded ${file.type}/${file.filename}`);
          } else {
            setError(`Failed to add file ${file.filename} to vector store`);
          }
        } else {
          setError(`Failed to upload file ${file.filename} to vector store`);
        }
      }
      setStatus("Uploaded all files to vector store.");
      setLoading(false);
      setSuccess(true);
    } else {
      setError("Failed to create vector store");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col items-center pt-16 md:pt-32">
      <div className="flex flex-col gap-4 max-w-lg">
        <div className="text-2xl font-bold">Initialize the Vector Store</div>
        <div className="text-sm text-zinc-500 space-y-2">
          <p>
            For this demo to work, you need to load knowledge base content into
            a vector store. This vector store will be used by the File Search
            tool to search for relevant content that can help answer the user
            query.
          </p>
          <p>
            When you click on the button below, the content contained in the{" "}
            <span className="font-mono bg-zinc-100 rounded-md p-1">
              /public/knowledge_base
            </span>{" "}
            and{" "}
            <span className="font-mono bg-zinc-100 rounded-md p-1">
              /public/faq
            </span>{" "}
            folders will be loaded into a vector store.
          </p>
          <p>
            Feel free to update these articles with your own content. If you
            change the folder names, make sure to update the reference to the
            folders below. After you make changes, you can re-initialize the
            vector store to load the new content.
          </p>
          <p>
            Once the content is loaded, you will see the newly created vector
            store&apos;s ID below. You can then configure the vector store ID in{" "}
            <span className="font-mono bg-zinc-100 rounded-md p-1">
              /config/constants.ts
            </span>{" "}
            to use with the File Search tool.
          </p>
        </div>
        <div className="flex">
          {!loading ? (
            <div
              className="bg-black text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-zinc-800 cursor-pointer"
              onClick={handleInitialize}
            >
              Initialize vector store
            </div>
          ) : (
            <div className="text-sm text-zinc-500 animate-pulse">{status}</div>
          )}
        </div>
      </div>
      <div className="mt-6 text-left w-full max-w-lg">
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && !error && (
          <div className="text-zinc-600 text-sm">
            Knowledge base updated successfully.
            <div className="flex items-center gap-2 mt-4">
              <div className="text-zinc-900">Vector Store ID:</div>
              <div className="font-mono text-sm p-1 bg-zinc-100 rounded-md">
                {vectorStoreId ?? ""}
              </div>
              <Copy
                onClick={() => copyToClipboard(vectorStoreId ?? "")}
                size={16}
                className="cursor-pointer text-zinc-400 hover:text-zinc-600 transition-all duration-100"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
