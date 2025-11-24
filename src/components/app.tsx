import { useState } from "react";
import { clsx } from "clsx";
import { CreateTab } from "./create-tab";
import { LookupTab } from "./lookup-tab";
import { AboutTab } from "./about-tab";

type TabId = "create" | "lookup" | "about";

const tabs: { id: TabId; label: string }[] = [
	{ id: "create", label: "Create" },
	{ id: "lookup", label: "Lookup" },
	{ id: "about", label: "About" },
];

export function App() {
	const [activeTab, setActiveTab] = useState<TabId>("create");

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="border-b border-border">
				<div className="max-w-3xl mx-auto px-6 py-8">
					<h1 className="text-3xl font-semibold tracking-tight">
						txt<span className="text-accent">2</span>mcp
					</h1>
					<p className="text-muted mt-2 text-sm">Convert text files into MCP servers</p>
				</div>
			</header>

			{/* Tab Navigation */}
			<nav className="border-b border-border">
				<div className="max-w-3xl mx-auto px-6">
					<div className="flex gap-8">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={clsx(
									"py-4 text-sm font-medium border-b-2 -mb-px transition-colors",
									activeTab === tab.id
										? "border-accent text-foreground"
										: "border-transparent text-muted hover:text-foreground",
								)}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="flex-1 py-12">
				<div className="max-w-3xl mx-auto px-6">
					{activeTab === "create" && <CreateTab />}
					{activeTab === "lookup" && <LookupTab />}
					{activeTab === "about" && <AboutTab />}
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-border py-6">
				<div className="max-w-3xl mx-auto px-6 text-center">
					<p className="text-xs text-muted">Powered by Cloudflare Workers</p>
				</div>
			</footer>
		</div>
	);
}
