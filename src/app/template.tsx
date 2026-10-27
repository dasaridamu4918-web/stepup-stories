import React from "react";

export default function RootTemplate({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-page-enter">{children}</div>;
}
