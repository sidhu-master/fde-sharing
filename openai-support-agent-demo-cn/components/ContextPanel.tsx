"use client";
import React from "react";
import CustomerDetails from "./CustomerDetails";
import RecommendedActions from "./RecommendedActions";
import RelevantArticles from "./RelevantArticles";
interface ContextPanelProps {
  className?: string;
}

export default function ContextPanel({ className = "" }: ContextPanelProps) {
  const titleClassName = "text-black text-md font-medium mb-2";
  return (
    <div className={`p-4 pb-0 w-full bg-[#F7F7F8] rounded-lg ${className}`}>
      <div className="flex flex-1 flex-col overflow-y-scroll h-full p-4 pb-0">
        <h2 className={titleClassName}>客户信息</h2>
        <CustomerDetails />
        <div className="border-b mt-6 mb-6 border-zinc-200"></div>
        <h2 className={titleClassName}>推荐操作</h2>
        <RecommendedActions />
        <div className="border-b mt-6 mb-6 border-zinc-200"></div>
        <h2 className={titleClassName}>相关资料</h2>
        <RelevantArticles />
      </div>
    </div>
  );
}
