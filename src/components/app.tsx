import { useState } from "react";
import { clsx } from "clsx";
import { CreateTab } from "./create-tab";
import { FilesTab } from "./files-tab";
import { AboutTab } from "./about-tab";
import { UploadIcon, FileIcon, InfoIcon } from "./icons";

type TabId = "create" | "files" | "about";

interface Tab {
	id: TabId;
	label: string;
	icon: React.ReactNode;
}

const tabs: Tab[] = [
	{ id: "create", label: "Create", icon: <UploadIcon className="w-4 h-4" /> },
	{ id: "files", label: "Files", icon: <FileIcon className="w-4 h-4" /> },
	{ id: "about", label: "About", icon: <InfoIcon className="w-4 h-4" /> },
];

export function App() {
	const [activeTab, setActiveTab] = useState<TabId>("create");

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="border-b border-border">
				<div className="max-w-4xl mx-auto px-4 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold">
								txt<span className="text-accent">2</span>mcp
							</h1>
							<p className="text-sm text-muted mt-1">Convert text files to MCP servers instantly</p>
						</div>
						<div className="text-xs text-muted">
							Powered by{" "}
							<a
								href="https://workers.cloudflare.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-accent hover:underline"
							>
								Cloudflare Workers
							</a>
						</div>
					</div>
				</div>
			</header>

			{/* Tab Navigation */}
			<nav className="border-b border-border bg-border/20">
				<div className="max-w-4xl mx-auto px-4">
					<div className="flex gap-1">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={clsx(
									"flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
									activeTab === tab.id
										? "border-accent text-foreground"
										: "border-transparent text-muted hover:text-foreground hover:border-muted",
								)}
							>
								{tab.icon}
								{tab.label}
							</button>
						))}
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="flex-1 py-8">
				<div className="max-w-4xl mx-auto px-4">
					{activeTab === "create" && <CreateTab />}
					{activeTab === "files" && <FilesTab />}
					{activeTab === "about" && <AboutTab />}
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-border py-4">
				<div className="max-w-4xl mx-auto px-4 text-center text-xs text-muted">
					<p>txt2mcp - Convert text files into MCP servers</p>
				</div>
			</footer>
		</div>
	);
}
