import { useState, useRef, useCallback } from "react";
import { clsx } from "clsx";
import { UploadIcon, LinkIcon, CopyIcon, CheckIcon } from "./icons";

interface UploadResult {
	nanoid: string;
	url: string;
	name: string;
}

export function CreateTab() {
	const [mode, setMode] = useState<"upload" | "url">("upload");
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<UploadResult | null>(null);
	const [urlInput, setUrlInput] = useState("");
	const [copied, setCopied] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const simulateUpload = useCallback(async (name: string) => {
		// Simulate API call - in real implementation, this would call /api/upload or /api/remote
		setIsUploading(true);
		setError(null);

		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Generate a mock nanoid
		const nanoid = Math.random().toString(36).substring(2, 12);

		setResult({
			nanoid,
			url: `https://${nanoid}.txt2mcp.dev`,
			name,
		});
		setIsUploading(false);
	}, []);

	const handleDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);

			const file = e.dataTransfer.files[0];
			if (file) {
				if (file.size > 10 * 1024 * 1024) {
					setError("File size must be less than 10MB");
					return;
				}
				if (!file.type.startsWith("text/") && !file.name.endsWith(".txt")) {
					setError("Only text files are supported");
					return;
				}
				await simulateUpload(file.name);
			}
		},
		[simulateUpload],
	);

	const handleFileSelect = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				if (file.size > 10 * 1024 * 1024) {
					setError("File size must be less than 10MB");
					return;
				}
				await simulateUpload(file.name);
			}
		},
		[simulateUpload],
	);

	const handleUrlSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!urlInput.trim()) return;

			try {
				new URL(urlInput);
			} catch {
				setError("Please enter a valid URL");
				return;
			}

			await simulateUpload(urlInput);
		},
		[urlInput, simulateUpload],
	);

	const handleCopy = useCallback(async () => {
		if (result) {
			await navigator.clipboard.writeText(result.url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [result]);

	const handleReset = useCallback(() => {
		setResult(null);
		setError(null);
		setUrlInput("");
	}, []);

	if (result) {
		return (
			<div className="max-w-xl mx-auto space-y-6">
				<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 text-center">
					<div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<CheckIcon className="w-6 h-6 text-green-400" />
					</div>
					<h3 className="text-lg font-semibold text-green-400 mb-2">MCP Server Created!</h3>
					<p className="text-muted text-sm mb-4">
						Your text file has been converted to an MCP server
					</p>

					<div className="bg-background border border-border rounded-lg p-4 mb-4">
						<p className="text-xs text-muted mb-1">MCP Server URL</p>
						<div className="flex items-center gap-2">
							<code className="flex-1 text-sm font-mono text-accent break-all">{result.url}</code>
							<button
								onClick={handleCopy}
								className="p-2 hover:bg-border rounded transition-colors"
								title="Copy URL"
							>
								{copied ? (
									<CheckIcon className="w-4 h-4 text-green-400" />
								) : (
									<CopyIcon className="w-4 h-4 text-muted" />
								)}
							</button>
						</div>
					</div>

					<div className="text-xs text-muted space-y-1">
						<p>
							<span className="text-foreground">Nanoid:</span> {result.nanoid}
						</p>
						<p>
							<span className="text-foreground">Source:</span> {result.name}
						</p>
					</div>
				</div>

				<button
					onClick={handleReset}
					className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
				>
					Create Another
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-xl mx-auto space-y-6">
			{/* Mode Toggle */}
			<div className="flex bg-border/50 rounded-lg p-1">
				<button
					onClick={() => setMode("upload")}
					className={clsx(
						"flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
						mode === "upload"
							? "bg-background text-foreground"
							: "text-muted hover:text-foreground",
					)}
				>
					<UploadIcon className="w-4 h-4" />
					Upload File
				</button>
				<button
					onClick={() => setMode("url")}
					className={clsx(
						"flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
						mode === "url" ? "bg-background text-foreground" : "text-muted hover:text-foreground",
					)}
				>
					<LinkIcon className="w-4 h-4" />
					Remote URL
				</button>
			</div>

			{error && (
				<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
					{error}
				</div>
			)}

			{mode === "upload" ? (
				<div
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => fileInputRef.current?.click()}
					className={clsx(
						"border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all",
						isDragging
							? "border-accent bg-accent/10"
							: "border-border hover:border-muted hover:bg-border/20",
					)}
				>
					<input
						ref={fileInputRef}
						type="file"
						accept=".txt,text/*"
						onChange={handleFileSelect}
						className="hidden"
					/>
					<UploadIcon className="w-12 h-12 text-muted mx-auto mb-4" />
					<p className="text-foreground font-medium mb-1">
						{isDragging ? "Drop your file here" : "Drag & drop your text file"}
					</p>
					<p className="text-sm text-muted">or click to browse</p>
					<p className="text-xs text-muted mt-4">Max file size: 10MB</p>
				</div>
			) : (
				<form onSubmit={handleUrlSubmit} className="space-y-4">
					<div>
						<label htmlFor="url" className="block text-sm font-medium mb-2">
							Remote File URL
						</label>
						<input
							id="url"
							type="url"
							value={urlInput}
							onChange={(e) => setUrlInput(e.target.value)}
							placeholder="https://example.com/file.txt"
							className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
						/>
						<p className="text-xs text-muted mt-2">
							Remote files will be automatically updated when the source changes
						</p>
					</div>
					<button
						type="submit"
						disabled={!urlInput.trim() || isUploading}
						className="w-full py-3 px-4 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
					>
						{isUploading ? "Creating MCP Server..." : "Create MCP Server"}
					</button>
				</form>
			)}

			{isUploading && mode === "upload" && (
				<div className="text-center py-4">
					<div className="animate-pulse text-accent">Creating MCP Server...</div>
				</div>
			)}
		</div>
	);
}
