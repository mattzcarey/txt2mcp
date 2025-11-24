import { useState } from "react";
import { CreateTab } from "./create-tab";
import { LookupTab } from "./lookup-tab";
import { AboutTab } from "./about-tab";

type Tab = "create" | "lookup" | "about";

export function App() {
	const [activeTab, setActiveTab] = useState<Tab>("create");

	return (
		<div className="container" style={{ paddingTop: "3rem", paddingBottom: "3rem" }} onContextMenu={(e) => e.preventDefault()}>
			<header className="text-center mb-8">
				<h1 className="mb-2">
					txt<span style={{ color: "var(--color-accent)" }}>2</span>mcp
				</h1>
				<p className="text-muted text-sm">MCP Servers to search over text files</p>
			</header>

			<nav className="tabs mb-6">
				<button
					onClick={() => setActiveTab("create")}
					className={`tab ${activeTab === "create" ? "active" : ""}`}
				>
					Create
				</button>
				<button
					onClick={() => setActiveTab("lookup")}
					className={`tab ${activeTab === "lookup" ? "active" : ""}`}
				>
					Lookup
				</button>
				<button
					onClick={() => setActiveTab("about")}
					className={`tab ${activeTab === "about" ? "active" : ""}`}
				>
					About
				</button>
			</nav>

			<main>
				{activeTab === "create" && <CreateTab />}
				{activeTab === "lookup" && <LookupTab />}
				{activeTab === "about" && <AboutTab />}
			</main>

			<footer className="text-center mt-6">
				<p className="text-xs text-muted">
					made with{" "}
					<span style={{ color: "var(--color-accent)" }}>♥</span>
					{" "}by{" "}
					<a
						href="https://twitter.com/mattzcarey"
						target="_blank"
						rel="noopener noreferrer"
						style={{ color: "var(--color-accent)", textDecoration: "none" }}
					>
						@mattzcarey
					</a>
				</p>
			</footer>
		</div>
	);
}
