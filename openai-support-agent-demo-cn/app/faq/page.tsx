"use client";
import ListArticles from "@/components/ListArticles";

// Page showing all FAQ articles in /faq folder
export default function KnowledgeBasePage() {
  return (
    <div>
      <ListArticles page="faq" folder="faq" title="常见问题" />
    </div>
  );
}
