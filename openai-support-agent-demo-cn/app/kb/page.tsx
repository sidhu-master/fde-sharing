"use client";
import ListArticles from "@/components/ListArticles";

// Page showing all knowledge base articles in /knowledge_base folder
export default function KnowledgeBasePage() {
  return (
    <div>
      <ListArticles
        page="kb"
        folder="knowledge_base"
        title="内部知识库"
      />
    </div>
  );
}
